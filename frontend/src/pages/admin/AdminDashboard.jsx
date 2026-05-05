import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { StatCard, PageLoader } from '../../components/common/index'
import { adminAPI } from '../../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import toast from 'react-hot-toast'

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getAnalytics()
      .then(({ data }) => setAnalytics(data.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout title="Admin Dashboard"><PageLoader /></DashboardLayout>

  const trendData = analytics?.trend?.map(t => ({
    name: `${MONTH_NAMES[t._id.month]} ${t._id.year}`,
    appointments: t.count
  })) || []

  const quickLinks = [
    { to: '/admin/doctors', label: 'Approve Doctors', icon: '👨‍⚕️', badge: analytics?.pendingDoctors, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800' },
    { to: '/admin/users', label: 'Manage Users', icon: '👥', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800' },
    { to: '/admin/appointments', label: 'Appointments', icon: '📅', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800' },
    { to: '/admin/categories', label: 'Categories', icon: '🏷️', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-200 dark:border-purple-800' },
    { to: '/receptionist', label: 'Reception', icon: '🏥', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 border-teal-200 dark:border-teal-800' }
  ]

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="👥" label="Total Users" value={analytics?.totalUsers?.toLocaleString() || 0} color="primary" />
        <StatCard icon="👨‍⚕️" label="Active Doctors" value={analytics?.totalDoctors || 0} color="green" />
        <StatCard icon="🤒" label="Patients" value={analytics?.totalPatients?.toLocaleString() || 0} color="purple" />
        <StatCard icon="📅" label="Today's Appointments" value={analytics?.todayAppointments || 0} color="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="📊" label="Total Appointments" value={analytics?.totalAppointments?.toLocaleString() || 0} color="primary" />
        <StatCard icon="✅" label="Completed" value={analytics?.completedAppointments?.toLocaleString() || 0} color="green" />
        <StatCard icon="⏳" label="Pending Doctors" value={analytics?.pendingDoctors || 0} color="amber" />
        <StatCard icon="💊" label="Prescriptions" value={analytics?.totalPrescriptions?.toLocaleString() || 0} color="purple" />
      </div>

      {/* Quick actions */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map(link => (
            <Link key={link.to} to={link.to} className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:scale-105 ${link.color}`}>
              <span className="text-2xl">{link.icon}</span>
              <span className="text-xs font-semibold text-center">{link.label}</span>
              {link.badge > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{link.badge}</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Appointment Trend (6 months)</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="appointments" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-secondary-400">No trend data available</div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Platform Overview</h3>
          <div className="space-y-4">
            {[
              { label: 'Doctor Approval Rate', value: analytics?.totalDoctors && analytics?.pendingDoctors !== undefined ? Math.round((analytics.totalDoctors / (analytics.totalDoctors + analytics.pendingDoctors)) * 100) : 100, color: 'bg-primary-500' },
              { label: 'Appointment Completion Rate', value: analytics?.totalAppointments ? Math.round((analytics.completedAppointments / analytics.totalAppointments) * 100) : 0, color: 'bg-green-500' },
              { label: 'Monthly Activity', value: analytics?.totalAppointments ? Math.min(Math.round((analytics.monthAppointments / analytics.totalAppointments) * 100 * 3), 100) : 0, color: 'bg-purple-500' }
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">{item.label}</span>
                  <span className="text-sm font-bold text-secondary-900 dark:text-white">{item.value}%</span>
                </div>
                <div className="w-full bg-secondary-100 dark:bg-secondary-700 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-secondary-100 dark:border-secondary-700">
            <h4 className="font-semibold text-secondary-700 dark:text-secondary-300 text-sm mb-3">This Month</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-center">
                <p className="text-2xl font-bold text-primary-600">{analytics?.monthAppointments || 0}</p>
                <p className="text-xs text-secondary-500 mt-0.5">Appointments</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-600">{analytics?.todayAppointments || 0}</p>
                <p className="text-xs text-secondary-500 mt-0.5">Today</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
