import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, StatusBadge, EmptyState, Pagination } from '../../components/common/index'
import { appointmentAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ date: format(new Date(), 'yyyy-MM-dd'), status: '' })

  const fetchAppointments = async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, limit: 20 }
      if (filters.date) params.date = filters.date
      if (filters.status) params.status = filters.status
      const { data } = await appointmentAPI.getDoctorAppointments(params)
      setAppointments(data.data.appointments || [])
      setPages(data.data.pages || 1)
      setTotal(data.data.total || 0)
    } catch { toast.error('Failed to load appointments') }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1); fetchAppointments(1) }, [filters])

  const updateStatus = async (id, status) => {
    try {
      await appointmentAPI.updateStatus(id, { status })
      toast.success(`Status updated to ${status}`)
      fetchAppointments(page)
    } catch { toast.error('Failed to update status') }
  }

  return (
    <DashboardLayout title="My Appointments">
      <div className="flex flex-wrap gap-3 mb-6">
        <input type="date" className="input w-44" value={filters.date} onChange={e => setFilters(p => ({ ...p, date: e.target.value }))} />
        <select className="input w-40" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button onClick={() => setFilters({ date: '', status: '' })} className="btn-secondary text-sm py-2">Clear Filters</button>
        <span className="flex items-center text-secondary-500 text-sm ml-auto">{total} appointment(s)</span>
      </div>

      {loading ? <PageLoader /> : appointments.length === 0 ? (
        <EmptyState icon="📅" title="No appointments found" description="No appointments match your current filters" />
      ) : (
        <>
          <div className="space-y-3">
            {appointments.map(apt => {
              const patient = apt.patient || {}
              const age = patient.dateOfBirth
                ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
                : null

              return (
                <div key={apt._id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {patient.avatar?.url
                        ? <img src={patient.avatar.url} alt={patient.name} className="w-full h-full object-cover" />
                        : <span className="font-bold text-primary-600">{patient.name?.charAt(0)}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-bold text-secondary-900 dark:text-white">{patient.name}</h3>
                        {age && <span className="text-xs text-secondary-500">{age} yrs • {patient.gender}</span>}
                        {patient.bloodGroup && <span className="badge bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">{patient.bloodGroup}</span>}
                        {apt.isEmergency && <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">🚨 Emergency</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-secondary-500">
                        <span>📅 {format(new Date(apt.date), 'MMM d, yyyy')}</span>
                        <span>⏰ {apt.timeSlot?.startTime}</span>
                        <span className="font-bold text-primary-600">Token #{apt.tokenNumber}</span>
                        <span className="capitalize">📋 {apt.type}</span>
                      </div>
                      {apt.reasonForVisit && (
                        <p className="text-xs text-secondary-400 mt-1 truncate">Reason: {apt.reasonForVisit}</p>
                      )}
                      {patient.allergies?.length > 0 && (
                        <p className="text-xs text-red-500 mt-0.5">⚠️ Allergies: {patient.allergies.join(', ')}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={apt.status} />
                    <div className="flex gap-1.5 flex-wrap">
                      {apt.status === 'pending' && (
                        <button onClick={() => updateStatus(apt._id, 'confirmed')} className="text-xs px-2.5 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-200 transition-colors">Confirm</button>
                      )}
                      {apt.status === 'confirmed' && (
                        <button onClick={() => updateStatus(apt._id, 'in-progress')} className="text-xs px-2.5 py-1.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg font-semibold hover:bg-purple-200 transition-colors">Start</button>
                      )}
                      {['confirmed', 'in-progress'].includes(apt.status) && !apt.prescription && (
                        <Link to={`/doctor/prescribe/${apt._id}`} className="text-xs px-2.5 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg font-semibold hover:bg-green-200 transition-colors">+ Prescribe</Link>
                      )}
                      {apt.status === 'confirmed' && (
                        <button onClick={() => updateStatus(apt._id, 'no-show')} className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-lg font-semibold hover:bg-gray-200 transition-colors">No-show</button>
                      )}
                      <Link to={`/doctor/patient/${patient._id}`} className="text-xs px-2.5 py-1.5 bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300 rounded-lg font-semibold hover:bg-secondary-200 transition-colors">History</Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <Pagination page={page} pages={pages} onPageChange={(p) => { setPage(p); fetchAppointments(p) }} />
        </>
      )}
    </DashboardLayout>
  )
}
