import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { StatCard, PageLoader, StatusBadge, EmptyState } from '../../components/common/index'
import { doctorAPI, appointmentAPI } from '../../services/api'
import { format, isToday } from 'date-fns'
import toast from 'react-hot-toast'

function PatientRow({ apt, onStatusChange }) {
  const patient = apt.patient || {}
  const age = patient.dateOfBirth ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null

  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {patient.avatar?.url
              ? <img src={patient.avatar.url} alt={patient.name} className="w-full h-full object-cover" />
              : <span className="font-bold text-primary-600 text-sm">{patient.name?.charAt(0)}</span>
            }
          </div>
          <div>
            <p className="font-semibold text-secondary-900 dark:text-white">{patient.name}</p>
            <p className="text-xs text-secondary-500">{age ? `${age} yrs` : ''} {patient.gender ? `· ${patient.gender}` : ''}</p>
          </div>
        </div>
      </td>
      <td><span className="font-bold text-primary-600 text-lg">#{apt.tokenNumber}</span></td>
      <td><span className="text-secondary-700 dark:text-secondary-300 text-sm">{apt.timeSlot?.startTime}</span></td>
      <td><StatusBadge status={apt.status} /></td>
      <td>
        <div className="flex gap-1.5">
          {apt.status === 'pending' && (
            <button onClick={() => onStatusChange(apt._id, 'confirmed')} className="text-xs px-2.5 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-200 transition-colors">Confirm</button>
          )}
          {apt.status === 'confirmed' && (
            <button onClick={() => onStatusChange(apt._id, 'in-progress')} className="text-xs px-2.5 py-1.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg font-semibold hover:bg-purple-200 transition-colors">Start</button>
          )}
          {['confirmed', 'in-progress'].includes(apt.status) && (
            <Link to={`/doctor/prescribe/${apt._id}`} className="text-xs px-2.5 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg font-semibold hover:bg-green-200 transition-colors">Prescribe</Link>
          )}
          <Link to={`/doctor/patient/${apt.patient?._id}`} className="text-xs px-2.5 py-1.5 bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300 rounded-lg font-semibold hover:bg-secondary-200 transition-colors">History</Link>
        </div>
      </td>
    </tr>
  )
}

export default function DoctorDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todayDate] = useState(format(new Date(), 'EEEE, MMMM d, yyyy'))

  const fetchStats = async () => {
    try {
      const { data } = await doctorAPI.getDashboardStats()
      setStats(data.data)
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  const handleStatusChange = async (aptId, status) => {
    try {
      await appointmentAPI.updateStatus(aptId, { status })
      toast.success(`Patient ${status}`)
      fetchStats()
    } catch { toast.error('Failed to update status') }
  }

  if (loading) return <DashboardLayout title="Doctor Dashboard"><PageLoader /></DashboardLayout>

  return (
    <DashboardLayout title="Doctor Dashboard">
      <div className="mb-6">
        <p className="text-secondary-500 text-sm">{todayDate}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="📅" label="Today's Patients" value={stats?.todayAppointments?.length || 0} color="primary" />
        <StatCard icon="⏳" label="Pending" value={stats?.pendingCount || 0} color="amber" />
        <StatCard icon="✅" label="Completed" value={stats?.totalCompleted || 0} color="green" />
        <StatCard icon="👥" label="Total Patients" value={stats?.totalPatients || 0} color="purple" />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-secondary-900 dark:text-white">Today's Queue</h3>
          <Link to="/doctor/appointments" className="text-primary-600 text-sm font-semibold hover:text-primary-700">View all appointments →</Link>
        </div>

        {stats?.todayAppointments?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Token</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.todayAppointments.map(apt => (
                  <PatientRow key={apt._id} apt={apt} onStatusChange={handleStatusChange} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="🎉" title="No appointments today" description="You have a free day or appointments haven't been scheduled yet." />
        )}
      </div>
    </DashboardLayout>
  )
}
