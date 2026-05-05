// NotificationPage.jsx
import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, EmptyState } from '../../components/common/index'
import { notificationAPI } from '../../services/api'
import { useSocket } from '../../context/SocketContext'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const TYPE_ICONS = {
  appointment_booked: '📅', appointment_confirmed: '✅', appointment_cancelled: '❌',
  appointment_reminder: '⏰', prescription_ready: '💊', report_uploaded: '📋',
  doctor_approved: '👨‍⚕️', payment_received: '💳', general: '🔔'
}

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const { clearUnread } = useSocket()

  useEffect(() => {
    notificationAPI.getAll({ limit: 50 })
      .then(({ data }) => {
        setNotifications(data.data.notifications || [])
        setUnreadCount(data.data.unreadCount || 0)
      })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false))
  }, [])

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch { /* silent fail */ }
  }

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      clearUnread()
      toast.success('All notifications marked as read')
    } catch { toast.error('Failed to mark all as read') }
  }

  return (
    <DashboardLayout title="Notifications">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <p className="text-secondary-500 text-sm">{unreadCount} unread</p>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-sm py-2">Mark all as read</button>
          )}
        </div>

        {loading ? <PageLoader /> : notifications.length === 0 ? (
          <EmptyState icon="🔔" title="No notifications" description="You're all caught up!" />
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`card p-4 flex items-start gap-4 cursor-pointer transition-all hover:shadow-card-hover ${!n.isRead ? 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${!n.isRead ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-secondary-100 dark:bg-secondary-700'}`}>
                  {TYPE_ICONS[n.type] || '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.isRead ? 'text-secondary-900 dark:text-white' : 'text-secondary-700 dark:text-secondary-300'}`}>{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-secondary-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-secondary-400 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
