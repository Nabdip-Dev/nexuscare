// MyAppointments.jsx
import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, StatusBadge, EmptyState, Pagination, Modal } from '../../components/common/index'
import { appointmentAPI } from '../../services/api'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelling, setCancelling] = useState(null)

  const fetchAppointments = async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, limit: 10 }
      if (statusFilter) params.status = statusFilter
      const { data } = await appointmentAPI.getMyAppointments(params)
      setAppointments(data.data.appointments || [])
      setPages(data.data.pages || 1)
    } catch { toast.error('Failed to load appointments') }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1); fetchAppointments(1) }, [statusFilter])

  const cancelAppointment = async (id) => {
    try {
      await appointmentAPI.updateStatus(id, { status: 'cancelled', reason: 'Cancelled by patient' })
      toast.success('Appointment cancelled')
      fetchAppointments(page)
    } catch { toast.error('Failed to cancel') }
    setCancelling(null)
  }

  const statuses = ['', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']

  return (
    <DashboardLayout title="My Appointments">
      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${statusFilter === s ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-400 hover:border-primary-300'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : appointments.length === 0 ? (
        <EmptyState icon="📅" title="No appointments found" description="Book an appointment with a doctor"
          action={<Link to="/patient/find-doctors" className="btn-primary mt-2">Find Doctors</Link>} />
      ) : (
        <>
          <div className="space-y-4">
            {appointments.map(apt => {
              const doctorName = apt.doctor?.user?.name || 'Doctor'
              const specs = apt.doctor?.specializations?.map(s => s.name).join(', ') || ''
              return (
                <div key={apt._id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {apt.doctor?.user?.avatar?.url
                      ? <img src={apt.doctor.user.avatar.url} alt={doctorName} className="w-full h-full object-cover" />
                      : <span className="font-bold text-primary-600">{doctorName.charAt(0)}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-secondary-900 dark:text-white">Dr. {doctorName}</h3>
                      <StatusBadge status={apt.status} />
                      {apt.isEmergency && <span className="badge bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">🚨 Emergency</span>}
                    </div>
                    <p className="text-primary-600 text-sm mb-1">{specs}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-secondary-500">
                      <span>📅 {format(new Date(apt.date), 'MMM d, yyyy')}</span>
                      <span>⏰ {apt.timeSlot?.startTime}</span>
                      <span>🎫 Token #{apt.tokenNumber}</span>
                      <span>📋 {apt.type}</span>
                    </div>
                    {apt.reasonForVisit && <p className="text-xs text-secondary-400 mt-1 truncate">Reason: {apt.reasonForVisit}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {apt.type === 'video' && ['confirmed', 'in-progress'].includes(apt.status) && (
                      <Link to={`/consultation/${apt._id}`} className="btn-primary text-xs py-2 px-3">Join Call</Link>
                    )}
                    {apt.prescription && (
                      <Link to={`/patient/prescriptions`} className="btn-secondary text-xs py-2 px-3">Rx</Link>
                    )}
                    {['pending', 'confirmed'].includes(apt.status) && (
                      <button onClick={() => setCancelling(apt._id)} className="btn-danger text-xs py-2 px-3">Cancel</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <Pagination page={page} pages={pages} onPageChange={(p) => { setPage(p); fetchAppointments(p) }} />
        </>
      )}

      <Modal isOpen={!!cancelling} onClose={() => setCancelling(null)} title="Cancel Appointment" size="sm">
        <p className="text-secondary-600 dark:text-secondary-400 mb-6">Are you sure you want to cancel this appointment?</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setCancelling(null)} className="btn-secondary">Keep it</button>
          <button onClick={() => cancelAppointment(cancelling)} className="btn-danger">Yes, Cancel</button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
