import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, StatusBadge, EmptyState, Pagination } from '../../components/common/index'
import { appointmentAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ status: '', date: '' })

  const fetchAppointments = async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, limit: 20 }
      if (filters.status) params.status = filters.status
      if (filters.date) params.date = filters.date
      const { data } = await appointmentAPI.getAllAppointments(params)
      setAppointments(data.data.appointments || [])
      setPages(data.data.pages || 1)
      setTotal(data.data.total || 0)
    } catch { toast.error('Failed to load appointments') }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1); fetchAppointments(1) }, [filters])

  const handleStatusChange = async (id, status) => {
    try {
      await appointmentAPI.updateStatus(id, { status })
      toast.success(`Appointment ${status}`)
      fetchAppointments(page)
    } catch { toast.error('Failed to update') }
  }

  return (
    <DashboardLayout title="All Appointments">
      <div className="flex flex-wrap gap-3 mb-6">
        <select className="input w-40" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input type="date" className="input w-44" value={filters.date} onChange={e => setFilters(p => ({ ...p, date: e.target.value }))} />
        <button onClick={() => setFilters({ status: '', date: '' })} className="btn-secondary text-sm py-2 px-4">Clear</button>
        <span className="flex items-center text-secondary-500 text-sm ml-auto">{total} total</span>
      </div>

      {loading ? <PageLoader /> : appointments.length === 0 ? (
        <EmptyState icon="📅" title="No appointments found" description="Try adjusting filters" />
      ) : (
        <>
          <div className="table-container card">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Token</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(apt => {
                  const patient = apt.patient || {}
                  const doctorName = apt.doctor?.user?.name || 'Unknown'
                  return (
                    <tr key={apt._id}>
                      <td>
                        <div>
                          <p className="font-semibold text-sm">{patient.name}</p>
                          <p className="text-xs text-secondary-500">{patient.email}</p>
                        </div>
                      </td>
                      <td className="font-medium text-sm">Dr. {doctorName}</td>
                      <td>
                        <p className="text-sm">{format(new Date(apt.date), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-secondary-500">{apt.timeSlot?.startTime}</p>
                      </td>
                      <td><span className="font-bold text-primary-600">#{apt.tokenNumber}</span></td>
                      <td className="text-xs capitalize">{apt.type}</td>
                      <td><StatusBadge status={apt.status} /></td>
                      <td>
                        <div className="flex gap-1.5 flex-wrap">
                          {apt.status === 'pending' && (
                            <button onClick={() => handleStatusChange(apt._id, 'confirmed')} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200">Confirm</button>
                          )}
                          {['pending', 'confirmed'].includes(apt.status) && (
                            <button onClick={() => handleStatusChange(apt._id, 'cancelled')} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200">Cancel</button>
                          )}
                          {apt.status === 'in-progress' && (
                            <button onClick={() => handleStatusChange(apt._id, 'completed')} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200">Complete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onPageChange={(p) => { setPage(p); fetchAppointments(p) }} />
        </>
      )}
    </DashboardLayout>
  )
}
