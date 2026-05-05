import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader } from '../../components/common/index'
import { doctorAPI, appointmentAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { format, addDays, isWeekend, startOfDay } from 'date-fns'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function BookAppointment() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [form, setForm] = useState({ type: 'in-person', reasonForVisit: '', symptoms: '', isEmergency: false })

  // Generate next 14 days
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1))
    .filter(d => {
      if (!doctor) return true
      const day = d.getDay()
      const schedule = doctor.schedule?.find(s => s.dayOfWeek === day)
      return schedule?.isWorking
    })

  useEffect(() => {
    doctorAPI.getDoctorById(doctorId)
      .then(({ data }) => setDoctor(data.data.doctor))
      .catch(() => toast.error('Doctor not found'))
      .finally(() => setLoading(false))
  }, [doctorId])

  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    setSelectedSlot(null)
    doctorAPI.getAvailableSlots(doctorId, format(selectedDate, 'yyyy-MM-dd'))
      .then(({ data }) => setSlots(data.data.slots || []))
      .catch(() => toast.error('Failed to load slots'))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, doctorId])

  const handleSubmit = async () => {
    if (!selectedDate) return toast.error('Please select a date')
    if (!selectedSlot) return toast.error('Please select a time slot')
    if (!form.reasonForVisit.trim()) return toast.error('Please provide a reason for visit')

    setSubmitting(true)
    try {
      const { data } = await appointmentAPI.book({
        doctorId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        timeSlot: selectedSlot,
        type: form.type,
        reasonForVisit: form.reasonForVisit,
        symptoms: form.symptoms ? form.symptoms.split(',').map(s => s.trim()).filter(Boolean) : [],
        isEmergency: form.isEmergency
      })
      toast.success('Appointment booked successfully!')
      navigate('/patient/appointments')
    } catch (err) {
      toast.error(err.message || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <DashboardLayout title="Book Appointment"><PageLoader /></DashboardLayout>
  if (!doctor) return <DashboardLayout title="Book Appointment"><div className="text-center py-16 text-secondary-500">Doctor not found</div></DashboardLayout>

  const user = doctor.user || {}
  const specs = doctor.specializations?.map(s => s.name).join(', ') || ''

  return (
    <DashboardLayout title="Book Appointment">
      <div className="max-w-4xl mx-auto">
        {/* Doctor summary */}
        <div className="card p-5 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.avatar?.url
              ? <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-primary-600">{user.name?.charAt(0)}</span>
            }
          </div>
          <div>
            <h2 className="font-bold text-secondary-900 dark:text-white text-lg">Dr. {user.name}</h2>
            <p className="text-primary-600 text-sm">{specs}</p>
            <p className="text-secondary-500 text-sm mt-0.5">⏱ {doctor.consultationDuration || 15} min • 💰 ${doctor.consultationFee || 0}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Date + Slot */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date picker */}
            <div className="card p-6">
              <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Select Date</h3>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {availableDates.map(date => {
                  const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center p-2.5 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-secondary-200 dark:border-secondary-600 hover:border-primary-300 text-secondary-700 dark:text-secondary-300'
                      }`}
                    >
                      <span className="text-xs font-medium">{DAYS[date.getDay()]}</span>
                      <span className="text-lg font-bold">{format(date, 'd')}</span>
                      <span className="text-xs">{format(date, 'MMM')}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="card p-6">
                <h3 className="font-bold text-secondary-900 dark:text-white mb-4">
                  Available Slots — {format(selectedDate, 'EEEE, MMMM d')}
                </h3>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8"><div className="spinner w-8 h-8" /></div>
                ) : slots.length === 0 ? (
                  <p className="text-secondary-500 text-center py-8">No slots available for this date</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button
                        key={slot.startTime}
                        disabled={slot.isBooked}
                        onClick={() => setSelectedSlot({ startTime: slot.startTime, endTime: slot.endTime })}
                        className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          slot.isBooked
                            ? 'border-secondary-100 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-700/50 text-secondary-300 dark:text-secondary-600 cursor-not-allowed'
                            : selectedSlot?.startTime === slot.startTime
                              ? 'border-primary-500 bg-primary-500 text-white'
                              : 'border-secondary-200 dark:border-secondary-600 hover:border-primary-400 text-secondary-700 dark:text-secondary-300'
                        }`}
                      >
                        {slot.isBooked ? <span className="line-through">{slot.startTime}</span> : slot.startTime}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Visit details */}
            <div className="card p-6">
              <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Visit Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Consultation Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[['in-person', '🏥', 'In Person'], ['video', '💻', 'Video Call']].map(([val, icon, label]) => (
                      <button
                        type="button" key={val}
                        onClick={() => setForm(p => ({ ...p, type: val }))}
                        className={`flex items-center gap-2 py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${form.type === val ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'border-secondary-200 dark:border-secondary-600 text-secondary-600 dark:text-secondary-400'}`}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Reason for Visit <span className="text-red-500">*</span></label>
                  <textarea className="input resize-none" rows={2} placeholder="Brief description of your concern..." value={form.reasonForVisit} onChange={e => setForm(p => ({ ...p, reasonForVisit: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Symptoms (comma-separated)</label>
                  <input className="input" placeholder="e.g. fever, headache, fatigue" value={form.symptoms} onChange={e => setForm(p => ({ ...p, symptoms: e.target.value }))} />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-primary-500" checked={form.isEmergency} onChange={e => setForm(p => ({ ...p, isEmergency: e.target.checked }))} />
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">🚨 This is an emergency</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-6">
              <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-500">Doctor</span>
                  <span className="font-semibold text-secondary-900 dark:text-white">Dr. {user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Date</span>
                  <span className="font-semibold text-secondary-900 dark:text-white">{selectedDate ? format(selectedDate, 'MMM d, yyyy') : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Time</span>
                  <span className="font-semibold text-secondary-900 dark:text-white">{selectedSlot?.startTime || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Type</span>
                  <span className="font-semibold text-secondary-900 dark:text-white capitalize">{form.type.replace('-', ' ')}</span>
                </div>
                <div className="border-t border-secondary-100 dark:border-secondary-700 pt-3 flex justify-between">
                  <span className="text-secondary-700 dark:text-secondary-300 font-semibold">Consultation Fee</span>
                  <span className="font-bold text-lg text-primary-600">${doctor.consultationFee || 0}</span>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedDate || !selectedSlot}
                className="btn-primary w-full mt-6 py-3 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Booking...
                  </span>
                ) : 'Confirm Booking'}
              </button>
              <p className="text-xs text-secondary-400 text-center mt-3">You'll receive a confirmation email</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
