import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { StatCard, PageLoader, StatusBadge, EmptyState } from '../../components/common/index'
import { useAuth } from '../../context/AuthContext'
import { appointmentAPI, prescriptionAPI } from '../../services/api'
import { format, isToday, isTomorrow } from 'date-fns'
import toast from 'react-hot-toast'

function AppointmentCard({ apt }) {
  const date = new Date(apt.date)
  const label = isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'MMM d, yyyy')
  const doctorName = apt.doctor?.user?.name || 'Doctor'
  const specs = apt.doctor?.specializations?.map(s => s.name).join(', ') || ''

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-secondary-100 dark:border-secondary-700 hover:border-primary-200 dark:hover:border-primary-700 transition-all bg-white dark:bg-secondary-800">
      <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {apt.doctor?.user?.avatar?.url
          ? <img src={apt.doctor.user.avatar.url} alt={doctorName} className="w-full h-full object-cover" />
          : <span className="text-primary-600 font-bold">{doctorName.charAt(0)}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="font-semibold text-secondary-900 dark:text-white">Dr. {doctorName}</p>
            {specs && <p className="text-xs text-secondary-500">{specs}</p>}
          </div>
          <StatusBadge status={apt.status} />
        </div>
        <div className="flex items-center gap-3 text-xs text-secondary-500 mt-1">
          <span className="flex items-center gap-1">
            <span>📅</span>{label}
          </span>
          <span className="flex items-center gap-1">
            <span>⏰</span>{apt.timeSlot?.startTime}
          </span>
          <span className="flex items-center gap-1">
            <span>🎫</span>Token #{apt.tokenNumber}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const [upcomingApts, setUpcomingApts] = useState([])
  const [recentPrescriptions, setRecentPrescriptions] = useState([])
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [aptRes, presRes] = await Promise.all([
          appointmentAPI.getMyAppointments({ limit: 5 }),
          prescriptionAPI.getMyPrescriptions({ limit: 3 })
        ])
        const apts = aptRes.data.data.appointments || []
        setUpcomingApts(apts.filter(a => ['pending', 'confirmed'].includes(a.status)).slice(0, 3))
        setStats({
          total: aptRes.data.data.total || 0,
          completed: apts.filter(a => a.status === 'completed').length,
          pending: apts.filter(a => ['pending', 'confirmed'].includes(a.status)).length
        })
        setRecentPrescriptions(presRes.data.data.prescriptions || [])
      } catch (err) {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <DashboardLayout title="Dashboard"><PageLoader /></DashboardLayout>

  const quickActions = [
    { label: 'Find a Doctor', icon: '🔍', to: '/patient/find-doctors', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800' },
    { label: 'Symptom Checker', icon: '🧠', to: '/patient/symptoms', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800' },
    { label: 'Health Risk', icon: '📊', to: '/patient/health-risk', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800' },
    { label: 'My Reports', icon: '📋', to: '/patient/reports', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800' },
    { label: 'Prescriptions', icon: '💊', to: '/patient/prescriptions', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800' },
    { label: 'Pharmacy', icon: '🏪', to: '/patient/pharmacy', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-800' }
  ]

  return (
    <DashboardLayout title="Dashboard">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-full opacity-10">
          <div className="w-48 h-48 border-2 border-white rounded-full absolute -top-8 -right-8" />
          <div className="w-32 h-32 border border-white rounded-full absolute bottom-0 right-4" />
        </div>
        <div className="relative">
          <h2 className="text-xl font-bold mb-1">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋</h2>
          <p className="text-primary-200 text-sm mb-4">How are you feeling today? Your health is our priority.</p>
          <Link to="/patient/find-doctors" className="inline-flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary-50 transition-colors">
            Book Appointment →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="📅" label="Total Appointments" value={stats.total} color="primary" />
        <StatCard icon="✅" label="Completed" value={stats.completed} color="green" />
        <StatCard icon="⏳" label="Upcoming" value={stats.pending} color="amber" />
        <StatCard icon="💊" label="Prescriptions" value={recentPrescriptions.length} color="purple" />
      </div>

      {/* Quick actions */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map(a => (
            <Link key={a.to} to={a.to} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:scale-105 ${a.color}`}>
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-semibold text-center leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming appointments */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-secondary-900 dark:text-white">Upcoming Appointments</h3>
            <Link to="/patient/appointments" className="text-primary-600 text-sm font-semibold hover:text-primary-700">View all →</Link>
          </div>
          {upcomingApts.length > 0 ? (
            <div className="space-y-3">
              {upcomingApts.map(apt => <AppointmentCard key={apt._id} apt={apt} />)}
            </div>
          ) : (
            <EmptyState icon="📅" title="No upcoming appointments" description="Book an appointment with a doctor today"
              action={<Link to="/patient/find-doctors" className="btn-primary mt-2">Find a Doctor</Link>} />
          )}
        </div>

        {/* Recent prescriptions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-secondary-900 dark:text-white">Recent Prescriptions</h3>
            <Link to="/patient/prescriptions" className="text-primary-600 text-sm font-semibold hover:text-primary-700">View all →</Link>
          </div>
          {recentPrescriptions.length > 0 ? (
            <div className="space-y-3">
              {recentPrescriptions.map(p => (
                <div key={p._id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary-50 dark:bg-secondary-700/50">
                  <span className="text-2xl mt-0.5">💊</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary-900 dark:text-white text-sm">{p.diagnosis}</p>
                    <p className="text-xs text-secondary-500">Dr. {p.doctor?.user?.name} • {format(new Date(p.createdAt), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-secondary-400 mt-0.5">{p.medicines?.length} medicine(s) prescribed</p>
                  </div>
                  {p.pdfUrl && (
                    <a href={p.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 flex-shrink-0" title="Download PDF">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="💊" title="No prescriptions yet" description="Your prescriptions will appear here after doctor visits" />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
