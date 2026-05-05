import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const socketRef = useRef(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null }
      return
    }

    const token = localStorage.getItem('nc_token')
    if (!token) return

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    })

    socket.on('connect', () => console.log('Socket connected'))
    socket.on('connect_error', (err) => console.error('Socket error:', err.message))

    socket.on('notification', (notif) => {
      setNotifications(prev => [notif, ...prev])
      setUnreadCount(c => c + 1)
      toast(notif.title, { icon: '🔔', duration: 4000 })
    })

    socket.on('appointment_updated', (data) => {
      toast(`Appointment #${data.tokenNumber} - ${data.status}`, { icon: '📅' })
    })

    socketRef.current = socket
    return () => { socket.disconnect(); socketRef.current = null }
  }, [isAuthenticated])

  const joinConsultation = (appointmentId) => socketRef.current?.emit('join_consultation', { appointmentId })
  const leaveConsultation = (appointmentId) => socketRef.current?.emit('leave_consultation', { appointmentId })
  const sendMessage = (appointmentId, message) => socketRef.current?.emit('consultation_message', { appointmentId, message })
  const clearUnread = () => setUnreadCount(0)

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, notifications, unreadCount, joinConsultation, leaveConsultation, sendMessage, clearUnread }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
