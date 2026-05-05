import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader } from '../../components/common/index'
import { doctorAPI, categoryAPI } from '../../services/api'
import toast from 'react-hot-toast'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const generateTimeSlots = () => {
  const slots = []
  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const endM = m + 15
      const endH = endM >= 60 ? h + 1 : h
      const end = `${String(endH).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`
      if (endH <= 21) slots.push({ startTime: start, endTime: end, isAvailable: true })
    }
  }
  return slots
}

export default function DoctorProfilePage() {
  const [doctor, setDoctor] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [form, setForm] = useState({
    bio: '', consultationFee: '', consultationDuration: 15, languages: '',
    hospitalAffiliation: '', isAvailableForEmergency: false, schedule: []
  })

  useEffect(() => {
    Promise.all([doctorAPI.getMyProfile(), categoryAPI.getAll()])
      .then(([docRes, catRes]) => {
        const doc = docRes.data.data.doctor
        setDoctor(doc)
        setCategories(catRes.data.data.categories || [])
        setForm({
          bio: doc.bio || '',
          consultationFee: doc.consultationFee || '',
          consultationDuration: doc.consultationDuration || 15,
          languages: (doc.languages || []).join(', '),
          hospitalAffiliation: doc.hospitalAffiliation || '',
          isAvailableForEmergency: doc.isAvailableForEmergency || false,
          schedule: doc.schedule?.length > 0 ? doc.schedule : DAYS.map((_, i) => ({
            dayOfWeek: i,
            isWorking: i >= 1 && i <= 5,
            slots: i >= 1 && i <= 5 ? generateTimeSlots().filter((_, idx) => idx % 2 === 0).slice(0, 16) : [],
            maxPatientsPerDay: 20
          }))
        })
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await doctorAPI.updateProfile({
        bio: form.bio,
        consultationFee: Number(form.consultationFee),
        consultationDuration: Number(form.consultationDuration),
        languages: form.languages ? form.languages.split(',').map(l => l.trim()).filter(Boolean) : [],
        hospitalAffiliation: form.hospitalAffiliation,
        isAvailableForEmergency: form.isAvailableForEmergency,
        schedule: form.schedule
      })
      toast.success('Profile updated successfully')
    } catch { toast.error('Failed to update profile') }
    finally { setSaving(false) }
  }

  const toggleDayWorking = (dayIdx) => {
    const updated = [...form.schedule]
    const day = { ...updated[dayIdx] }
    day.isWorking = !day.isWorking
    if (day.isWorking && day.slots.length === 0) {
      day.slots = generateTimeSlots().filter((_, i) => i % 2 === 0).slice(0, 16)
    }
    updated[dayIdx] = day
    setForm(p => ({ ...p, schedule: updated }))
  }

  const toggleSlot = (dayIdx, slotIdx) => {
    const updated = [...form.schedule]
    const day = { ...updated[dayIdx], slots: [...updated[dayIdx].slots] }
    day.slots[slotIdx] = { ...day.slots[slotIdx], isAvailable: !day.slots[slotIdx].isAvailable }
    updated[dayIdx] = day
    setForm(p => ({ ...p, schedule: updated }))
  }

  if (loading) return <DashboardLayout title="My Profile"><PageLoader /></DashboardLayout>

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'stats', label: 'Stats' }
  ]

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-3xl mx-auto">
        {/* Rating banner */}
        {doctor && (
          <div className="card p-5 mb-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-3xl flex-shrink-0">👨‍⚕️</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{doctor.user?.name || 'Doctor'}</h2>
              <p className="text-secondary-500 text-sm">{doctor.licenseNumber}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-amber-400">{'★'.repeat(Math.round(doctor.rating?.average || 0))}{'☆'.repeat(5 - Math.round(doctor.rating?.average || 0))}</span>
                <span className="text-xs text-secondary-500">{doctor.rating?.average?.toFixed(1) || '0.0'} ({doctor.rating?.count || 0} reviews)</span>
                {doctor.isApproved
                  ? <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">✓ Approved</span>
                  : <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">⏳ Pending Approval</span>
                }
              </div>
            </div>
            <div className="text-right text-sm flex-shrink-0">
              <p className="font-bold text-2xl text-primary-600">{doctor.totalPatients || 0}</p>
              <p className="text-secondary-500">Patients</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-secondary-100 dark:bg-secondary-800 p-1 rounded-xl w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === t.id ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm' : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Basic Info */}
        {activeTab === 'basic' && (
          <div className="card p-6 space-y-5">
            <div>
              <label className="label">Bio</label>
              <textarea className="input resize-none" rows={4} placeholder="Tell patients about yourself, your expertise and approach..." value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Consultation Fee ($)</label>
                <input type="number" className="input" placeholder="0" min="0" value={form.consultationFee} onChange={e => setForm(p => ({ ...p, consultationFee: e.target.value }))} />
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <select className="input" value={form.consultationDuration} onChange={e => setForm(p => ({ ...p, consultationDuration: e.target.value }))}>
                  {[10, 15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Hospital / Clinic</label>
              <input className="input" placeholder="e.g. City General Hospital" value={form.hospitalAffiliation} onChange={e => setForm(p => ({ ...p, hospitalAffiliation: e.target.value }))} />
            </div>
            <div>
              <label className="label">Languages (comma-separated)</label>
              <input className="input" placeholder="English, Spanish, French..." value={form.languages} onChange={e => setForm(p => ({ ...p, languages: e.target.value }))} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-xl">
              <input type="checkbox" className="w-4 h-4 rounded text-primary-500" checked={form.isAvailableForEmergency} onChange={e => setForm(p => ({ ...p, isAvailableForEmergency: e.target.checked }))} />
              <div>
                <p className="font-semibold text-secondary-900 dark:text-white text-sm">Available for Emergency</p>
                <p className="text-xs text-secondary-500">Patients can book emergency appointments with you</p>
              </div>
            </label>
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Schedule */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            {form.schedule.map((day, dayIdx) => (
              <div key={day.dayOfWeek} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={day.isWorking} onChange={() => toggleDayWorking(dayIdx)} className="sr-only peer" />
                      <div className="w-10 h-5 bg-secondary-200 peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                    <span className="font-semibold text-secondary-900 dark:text-white">{DAYS[day.dayOfWeek]}</span>
                  </div>
                  {day.isWorking && (
                    <span className="text-xs text-secondary-500">{day.slots.filter(s => s.isAvailable).length} slots active</span>
                  )}
                </div>
                {day.isWorking && day.slots.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {day.slots.map((slot, slotIdx) => (
                      <button key={slot.startTime} onClick={() => toggleSlot(dayIdx, slotIdx)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${slot.isAvailable ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-secondary-100 text-secondary-400 dark:bg-secondary-700 line-through'}`}>
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                )}
                {!day.isWorking && (
                  <p className="text-secondary-400 text-sm">Not working this day</p>
                )}
              </div>
            ))}
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
              {saving ? 'Saving Schedule...' : 'Save Schedule'}
            </button>
          </div>
        )}

        {/* Stats */}
        {activeTab === 'stats' && doctor && (
          <div className="card p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Patients', value: doctor.totalPatients || 0, icon: '👥' },
                { label: 'Total Appointments', value: doctor.totalAppointments || 0, icon: '📅' },
                { label: 'Rating', value: `${doctor.rating?.average?.toFixed(1) || '0.0'}/5`, icon: '⭐' },
                { label: 'Reviews', value: doctor.rating?.count || 0, icon: '💬' },
                { label: 'Experience', value: `${doctor.experience || 0} yrs`, icon: '🏥' },
                { label: 'Consultation Fee', value: `$${doctor.consultationFee || 0}`, icon: '💰' }
              ].map(stat => (
                <div key={stat.label} className="p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-xl text-center">
                  <p className="text-2xl mb-1">{stat.icon}</p>
                  <p className="font-bold text-xl text-secondary-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-secondary-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
