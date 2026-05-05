import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader } from '../../components/common/index'
import { appointmentAPI } from '../../services/api'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function VideoConsultation() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket, joinConsultation, leaveConsultation, sendMessage } = useSocket()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimerRef = useRef(null)

  useEffect(() => {
    appointmentAPI.getAppointment(appointmentId)
      .then(({ data }) => {
        const apt = data.data.appointment
        if (apt.type !== 'video') { toast.error('This is not a video consultation'); navigate(-1); return }
        setAppointment(apt)
        joinConsultation(appointmentId)
      })
      .catch(() => { toast.error('Appointment not found'); navigate(-1) })
      .finally(() => setLoading(false))

    return () => { leaveConsultation(appointmentId) }
  }, [appointmentId])

  useEffect(() => {
    if (!socket) return
    const handleMsg = (data) => {
      setMessages(prev => [...prev, data])
      setPeerTyping(false)
    }
    const handleTyping = ({ userId: typingUserId, isTyping: typing }) => {
      if (typingUserId !== user._id.toString()) setPeerTyping(typing)
    }
    socket.on('consultation_message', handleMsg)
    socket.on('typing', handleTyping)
    return () => { socket.off('consultation_message', handleMsg); socket.off('typing', handleTyping) }
  }, [socket, user._id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!messageInput.trim()) return
    sendMessage(appointmentId, messageInput.trim())
    setMessages(prev => [...prev, { from: { id: user._id, name: user.name, role: user.role }, message: messageInput.trim(), timestamp: new Date() }])
    setMessageInput('')
  }

  const handleTyping = (val) => {
    setMessageInput(val)
    if (!socket) return
    socket.emit('typing', { appointmentId, isTyping: true })
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => socket.emit('typing', { appointmentId, isTyping: false }), 1500)
  }

  const handleEndSession = async () => {
    try {
      await appointmentAPI.updateStatus(appointmentId, { status: 'completed' })
      toast.success('Consultation ended')
      navigate(-1)
    } catch { toast.error('Failed to end session') }
  }

  if (loading) return <DashboardLayout title="Video Consultation"><PageLoader /></DashboardLayout>
  if (!appointment) return null

  const isDoctor = user.role === 'doctor'
  const otherPerson = isDoctor ? appointment.patient : appointment.doctor?.user

  return (
    <DashboardLayout title="Video Consultation">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Video area */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="card flex-1 bg-secondary-900 flex items-center justify-center relative overflow-hidden rounded-2xl">
              <div className="text-center text-white">
                <div className="w-24 h-24 rounded-full bg-primary-500/30 flex items-center justify-center mx-auto mb-4 text-5xl">
                  {isDoctor ? '🤒' : '👨‍⚕️'}
                </div>
                <p className="text-lg font-semibold">{otherPerson?.name || 'Participant'}</p>
                <p className="text-secondary-400 text-sm mt-1">Video feed not available in demo mode</p>
                <div className="mt-4 inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Connected
                </div>
              </div>
              {/* Self video placeholder */}
              <div className="absolute bottom-4 right-4 w-28 h-20 bg-secondary-700 rounded-xl flex items-center justify-center border-2 border-secondary-600">
                <span className="text-2xl">😊</span>
              </div>
            </div>

            {/* Controls */}
            <div className="card p-4 flex items-center justify-center gap-4">
              {[
                { icon: '🎤', label: 'Mute', color: 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300' },
                { icon: '📹', label: 'Camera', color: 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300' },
                { icon: '🖥️', label: 'Share', color: 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300' }
              ].map(btn => (
                <button key={btn.label} className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl ${btn.color} hover:opacity-80 transition-opacity`}>
                  <span className="text-xl">{btn.icon}</span>
                  <span className="text-xs font-medium">{btn.label}</span>
                </button>
              ))}
              <button onClick={handleEndSession} className="flex flex-col items-center gap-1 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors">
                <span className="text-xl">📵</span>
                <span className="text-xs font-medium">End</span>
              </button>
            </div>
          </div>

          {/* Chat */}
          <div className="card flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-secondary-100 dark:border-secondary-700 flex-shrink-0">
              <h3 className="font-bold text-secondary-900 dark:text-white">Consultation Chat</h3>
              <p className="text-xs text-secondary-500">{format(new Date(appointment.date), 'MMM d, yyyy')} • {appointment.timeSlot?.startTime}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-secondary-400 text-sm">Chat with your {isDoctor ? 'patient' : 'doctor'} here</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.from?.id === user._id.toString()
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary-500 text-white rounded-br-sm' : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-bl-sm'}`}>
                      {!isMe && <p className="text-xs font-semibold mb-1 text-primary-600 dark:text-primary-400">{msg.from?.name}</p>}
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-secondary-400'}`}>{format(new Date(msg.timestamp), 'HH:mm')}</p>
                    </div>
                  </div>
                )
              })}
              {peerTyping && (
                <div className="flex justify-start">
                  <div className="bg-secondary-100 dark:bg-secondary-700 px-3 py-2 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-3 py-3 border-t border-secondary-100 dark:border-secondary-700 flex gap-2 flex-shrink-0">
              <input
                className="input flex-1 text-sm py-2"
                placeholder="Type a message..."
                value={messageInput}
                onChange={e => handleTyping(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button onClick={handleSend} disabled={!messageInput.trim()} className="btn-primary px-3 py-2 disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
