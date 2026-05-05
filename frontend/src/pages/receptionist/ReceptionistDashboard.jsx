import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, StatusBadge, EmptyState, Modal } from '../../components/common/index'
import { receptionistAPI, doctorAPI, categoryAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function ReceptionistDashboard() {
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [queue, setQueue] = useState([])
  const [loadingQueue, setLoadingQueue] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [slots, setSlots] = useState([])
  const [booking, setBooking] = useState({
    patientId: '', patientName: '', doctorId: '', date: format(new Date(), 'yyyy-MM-dd'),
    timeSlot: null, reasonForVisit: '', isEmergency: false
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    doctorAPI.getDoctors({ limit: 100 }).then(({ data }) => setDoctors(data.data.doctors || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedDoctor) return
    setLoadingQueue(true)
    receptionistAPI.getQueue(selectedDoctor)
      .then(({ data }) => setQueue(data.data.queue || []))
      .catch(() => toast.error('Failed to load queue'))
      .finally(() => setLoadingQueue(false))
  }, [selectedDoctor])

  const searchPatients = async (q) => {
    if (q.length < 2) { setSearchResults([]); return }
    try {
      const { data } = await receptionistAPI.searchPatient(q)
      setSearchResults(data.data.patients || [])
    } catch { setSearchResults([]) }
  }

  useEffect(() => {
    const timer = setTimeout(() => searchPatients(patientSearch), 400)
    return () => clearTimeout(timer)
  }, [patientSearch])

  const fetchSlots = async (doctorId, date) => {
    if (!doctorId || !date) return
    try {
      const { data } = await doctorAPI.getAvailableSlots(doctorId, date)
      setSlots(data.data.slots || [])
    } catch { setSlots([]) }
  }

  useEffect(() => {
    fetchSlots(booking.doctorId, booking.date)
  }, [booking.doctorId, booking.date])

  const handleBook = async () => {
    if (!booking.patientId) return toast.error('Please select a patient')
    if (!booking.doctorId) return toast.error('Please select a doctor')
    if (!booking.timeSlot) return toast.error('Please select a time slot')
    setSubmitting(true)
    try {
      await receptionistAPI.createAppointment({
        patientId: booking.patientId,
        doctorId: booking.doctorId,
        date: booking.date,
        timeSlot: booking.timeSlot,
        reasonForVisit: booking.reasonForVisit,
        isEmergency: booking.isEmergency
      })
      toast.success('Appointment booked successfully!')
      setShowBookModal(false)
      if (booking.doctorId === selectedDoctor) {
        receptionistAPI.getQueue(selectedDoctor).then(({ data }) => setQueue(data.data.queue || []))
      }
      setBooking({ patientId: '', patientName: '', doctorId: '', date: format(new Date(), 'yyyy-MM-dd'), timeSlot: null, reasonForVisit: '', isEmergency: false })
    } catch (err) {
      toast.error(err.message || 'Booking failed')
    } finally { setSubmitting(false) }
  }

  const statusColors = { pending: 'border-l-amber-400', confirmed: 'border-l-blue-400', 'in-progress': 'border-l-purple-400', completed: 'border-l-green-400' }

  return (
    <DashboardLayout title="Reception Desk">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <select className="input w-56" value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}>
            <option value="">Select Doctor for Queue</option>
            {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.user?.name}</option>)}
          </select>
          {selectedDoctor && <button onClick={() => receptionistAPI.getQueue(selectedDoctor).then(({ data }) => setQueue(data.data.queue || []))} className="btn-secondary text-sm py-2">↻ Refresh</button>}
        </div>
        <button onClick={() => setShowBookModal(true)} className="btn-primary">+ New Appointment</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Queue */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-secondary-900 dark:text-white">Today's Queue</h3>
            {selectedDoctor && <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{queue.length} patients</span>}
          </div>
          {!selectedDoctor ? (
            <EmptyState icon="👨‍⚕️" title="Select a doctor" description="Choose a doctor to view their queue" />
          ) : loadingQueue ? <PageLoader /> : queue.length === 0 ? (
            <EmptyState icon="🎉" title="Queue is empty" description="No patients in queue for today" />
          ) : (
            <div className="space-y-3">
              {queue.map(apt => {
                const patient = apt.patient || {}
                return (
                  <div key={apt._id} className={`flex items-center gap-4 p-4 rounded-xl border border-l-4 ${statusColors[apt.status] || 'border-l-secondary-300'} bg-white dark:bg-secondary-800 border-secondary-100 dark:border-secondary-700`}>
                    <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">#{apt.tokenNumber}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-9 h-9 rounded-full bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center overflow-hidden">
                        {patient.avatar?.url ? <img src={patient.avatar.url} alt={patient.name} className="w-full h-full object-cover" /> : <span className="font-bold text-secondary-500 text-sm">{patient.name?.charAt(0)}</span>}
                      </div>
                      <div>
                        <p className="font-semibold text-secondary-900 dark:text-white text-sm">{patient.name}</p>
                        <p className="text-xs text-secondary-500">{patient.phone} • {apt.timeSlot?.startTime}</p>
                      </div>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          {[
            { label: 'In Queue', value: queue.length, icon: '👥', color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
            { label: 'In Progress', value: queue.filter(q => q.status === 'in-progress').length, icon: '⚡', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
            { label: 'Completed Today', value: queue.filter(q => q.status === 'completed').length, icon: '✅', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
            { label: 'Pending', value: queue.filter(q => q.status === 'pending').length, icon: '⏳', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' }
          ].map(stat => (
            <div key={stat.label} className={`card p-4 flex items-center gap-3 ${stat.color}`}>
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-secondary-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Book Appointment Modal */}
      <Modal isOpen={showBookModal} onClose={() => setShowBookModal(false)} title="Book Walk-in Appointment" size="lg">
        <div className="space-y-4">
          {/* Patient search */}
          <div>
            <label className="label">Search Patient</label>
            <div className="relative">
              <input className="input" placeholder="Search by name, email or phone..." value={patientSearch} onChange={e => { setPatientSearch(e.target.value); if (!e.target.value) setBooking(p => ({ ...p, patientId: '', patientName: '' })) }} />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-600 rounded-xl shadow-card-lg mt-1 overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map(p => (
                    <button key={p._id} onClick={() => { setBooking(prev => ({ ...prev, patientId: p._id, patientName: p.name })); setPatientSearch(p.name); setSearchResults([]) }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary-50 dark:hover:bg-secondary-700 text-left transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-600">{p.name?.charAt(0)}</div>
                      <div>
                        <p className="font-semibold text-sm text-secondary-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-secondary-500">{p.email} {p.phone ? `• ${p.phone}` : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {booking.patientId && <p className="text-xs text-green-600 mt-1">✓ Selected: {booking.patientName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Doctor</label>
              <select className="input" value={booking.doctorId} onChange={e => setBooking(p => ({ ...p, doctorId: e.target.value, timeSlot: null }))}>
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.user?.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={booking.date} min={format(new Date(), 'yyyy-MM-dd')} onChange={e => setBooking(p => ({ ...p, date: e.target.value, timeSlot: null }))} />
            </div>
          </div>

          {slots.length > 0 && (
            <div>
              <label className="label">Time Slot</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {slots.map(slot => (
                  <button key={slot.startTime} disabled={slot.isBooked} onClick={() => setBooking(p => ({ ...p, timeSlot: { startTime: slot.startTime, endTime: slot.endTime } }))}
                    className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${slot.isBooked ? 'opacity-30 cursor-not-allowed border-secondary-200' : booking.timeSlot?.startTime === slot.startTime ? 'border-primary-500 bg-primary-500 text-white' : 'border-secondary-200 dark:border-secondary-600 hover:border-primary-400 text-secondary-700 dark:text-secondary-300'}`}>
                    {slot.startTime}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label">Reason for Visit</label>
            <input className="input" placeholder="Chief complaint..." value={booking.reasonForVisit} onChange={e => setBooking(p => ({ ...p, reasonForVisit: e.target.value }))} />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded text-primary-500" checked={booking.isEmergency} onChange={e => setBooking(p => ({ ...p, isEmergency: e.target.checked }))} />
            <span className="text-sm text-secondary-700 dark:text-secondary-300">🚨 Emergency appointment</span>
          </label>

          <div className="flex gap-3">
            <button onClick={() => setShowBookModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleBook} disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
