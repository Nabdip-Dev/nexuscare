import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader } from '../../components/common/index'
import { appointmentAPI, prescriptionAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const emptyMed = () => ({ name: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: '' })
const emptyTest = () => ({ testName: '', instructions: '', urgency: 'routine' })

export default function CreatePrescription() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    diagnosis: '',
    symptoms: '',
    notes: '',
    generalAdvice: '',
    followUpDate: '',
    medicines: [emptyMed()],
    labTests: []
  })
  const [vitals, setVitals] = useState({ bloodPressure: '', heartRate: '', temperature: '', weight: '', height: '', oxygenSaturation: '' })

  useEffect(() => {
    appointmentAPI.getAppointment(appointmentId)
      .then(({ data }) => {
        const apt = data.data.appointment
        setAppointment(apt)
        if (apt.prescription) {
          toast.error('Prescription already exists for this appointment.')
          navigate('/doctor/appointments')
        }
        // Pre-fill symptoms from appointment
        if (apt.symptoms?.length) setForm(p => ({ ...p, symptoms: apt.symptoms.join(', ') }))
      })
      .catch(() => { toast.error('Appointment not found'); navigate('/doctor/appointments') })
      .finally(() => setLoading(false))
  }, [appointmentId, navigate])

  const updateMed = (i, field, val) => {
    const meds = [...form.medicines]
    meds[i][field] = val
    setForm(p => ({ ...p, medicines: meds }))
  }
  const addMed = () => setForm(p => ({ ...p, medicines: [...p.medicines, emptyMed()] }))
  const removeMed = (i) => setForm(p => ({ ...p, medicines: p.medicines.filter((_, idx) => idx !== i) }))

  const updateTest = (i, field, val) => {
    const tests = [...form.labTests]
    tests[i][field] = val
    setForm(p => ({ ...p, labTests: tests }))
  }
  const addTest = () => setForm(p => ({ ...p, labTests: [...p.labTests, emptyTest()] }))
  const removeTest = (i) => setForm(p => ({ ...p, labTests: p.labTests.filter((_, idx) => idx !== i) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.diagnosis.trim()) return toast.error('Diagnosis is required')
    const validMeds = form.medicines.filter(m => m.name && m.dosage && m.frequency && m.duration)
    if (validMeds.length === 0) return toast.error('Add at least one medicine')

    setSubmitting(true)
    try {
      await prescriptionAPI.create({
        appointmentId,
        diagnosis: form.diagnosis,
        symptoms: form.symptoms ? form.symptoms.split(',').map(s => s.trim()).filter(Boolean) : [],
        medicines: validMeds,
        labTests: form.labTests.filter(t => t.testName),
        notes: form.notes,
        generalAdvice: form.generalAdvice,
        followUpDate: form.followUpDate || undefined,
        vitals: Object.fromEntries(Object.entries(vitals).filter(([, v]) => v))
      })
      toast.success('Prescription created successfully!')
      navigate('/doctor/appointments')
    } catch (err) {
      toast.error(err.message || 'Failed to create prescription')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <DashboardLayout title="Create Prescription"><PageLoader /></DashboardLayout>
  if (!appointment) return null

  const patient = appointment.patient || {}

  return (
    <DashboardLayout title="Create Prescription">
      <div className="max-w-4xl mx-auto">
        {/* Patient info */}
        <div className="card p-5 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {patient.avatar?.url
              ? <img src={patient.avatar.url} alt={patient.name} className="w-full h-full object-cover" />
              : <span className="text-xl font-bold text-primary-600">{patient.name?.charAt(0)}</span>
            }
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-secondary-900 dark:text-white">{patient.name}</h2>
            <div className="flex flex-wrap gap-3 text-sm text-secondary-500 mt-0.5">
              {patient.dateOfBirth && <span>Age: {Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))}</span>}
              {patient.gender && <span>• {patient.gender}</span>}
              {patient.bloodGroup && <span>• Blood: {patient.bloodGroup}</span>}
            </div>
            {patient.allergies?.length > 0 && <p className="text-xs text-red-500 mt-1">⚠️ Allergies: {patient.allergies.join(', ')}</p>}
          </div>
          <div className="text-right text-sm text-secondary-500">
            <p className="font-semibold">📅 {format(new Date(appointment.date), 'MMM d, yyyy')}</p>
            <p>⏰ {appointment.timeSlot?.startTime}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vitals */}
          <div className="card p-6">
            <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Patient Vitals</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { key: 'bloodPressure', label: 'Blood Pressure', placeholder: '120/80 mmHg' },
                { key: 'heartRate', label: 'Heart Rate', placeholder: '72 bpm' },
                { key: 'temperature', label: 'Temperature', placeholder: '98.6 °F' },
                { key: 'weight', label: 'Weight', placeholder: '70 kg' },
                { key: 'height', label: 'Height', placeholder: '175 cm' },
                { key: 'oxygenSaturation', label: 'O₂ Saturation', placeholder: '98%' }
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input className="input" placeholder={placeholder} value={vitals[key]} onChange={e => setVitals(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          {/* Diagnosis */}
          <div className="card p-6">
            <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Diagnosis</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Primary Diagnosis <span className="text-red-500">*</span></label>
                <input className="input" placeholder="e.g. Acute Pharyngitis, Type 2 Diabetes..." value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Symptoms (comma-separated)</label>
                <input className="input" placeholder="fever, sore throat, headache..." value={form.symptoms} onChange={e => setForm(p => ({ ...p, symptoms: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Medicines */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-secondary-900 dark:text-white">Medicines</h3>
              <button type="button" onClick={addMed} className="btn-secondary text-sm py-2">+ Add Medicine</button>
            </div>
            <div className="space-y-4">
              {form.medicines.map((med, i) => (
                <div key={i} className="p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-primary-600 text-sm">Medicine #{i + 1}</span>
                    {form.medicines.length > 1 && (
                      <button type="button" onClick={() => removeMed(i)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="label">Name <span className="text-red-500">*</span></label>
                      <input className="input" placeholder="e.g. Amoxicillin" value={med.name} onChange={e => updateMed(i, 'name', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Dosage <span className="text-red-500">*</span></label>
                      <input className="input" placeholder="500mg" value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Frequency <span className="text-red-500">*</span></label>
                      <select className="input" value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)}>
                        <option value="">Select...</option>
                        {['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'As needed', 'At bedtime'].map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Duration <span className="text-red-500">*</span></label>
                      <input className="input" placeholder="7 days" value={med.duration} onChange={e => updateMed(i, 'duration', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Quantity</label>
                      <input type="number" className="input" placeholder="30" value={med.quantity} onChange={e => updateMed(i, 'quantity', e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Instructions</label>
                      <input className="input" placeholder="Take after meals, avoid alcohol..." value={med.instructions} onChange={e => updateMed(i, 'instructions', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lab Tests */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-secondary-900 dark:text-white">Lab Tests</h3>
              <button type="button" onClick={addTest} className="btn-secondary text-sm py-2">+ Add Test</button>
            </div>
            {form.labTests.length === 0 ? (
              <p className="text-secondary-400 text-sm text-center py-4">No lab tests added</p>
            ) : (
              <div className="space-y-3">
                {form.labTests.map((test, i) => (
                  <div key={i} className="grid grid-cols-3 gap-3 p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-xl items-end">
                    <div>
                      <label className="label">Test Name</label>
                      <input className="input" placeholder="e.g. CBC, HbA1c..." value={test.testName} onChange={e => updateTest(i, 'testName', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Urgency</label>
                      <select className="input" value={test.urgency} onChange={e => updateTest(i, 'urgency', e.target.value)}>
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="stat">STAT</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="label">Instructions</label>
                        <input className="input" placeholder="Fasting required..." value={test.instructions} onChange={e => updateTest(i, 'instructions', e.target.value)} />
                      </div>
                      <button type="button" onClick={() => removeTest(i)} className="text-red-500 hover:text-red-700 self-end pb-3">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes & Follow-up */}
          <div className="card p-6">
            <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Notes & Follow-up</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Doctor's Notes</label>
                <textarea className="input resize-none" rows={3} placeholder="Additional notes for patient..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div>
                <label className="label">General Advice</label>
                <textarea className="input resize-none" rows={3} placeholder="Rest, diet, lifestyle advice..." value={form.generalAdvice} onChange={e => setForm(p => ({ ...p, generalAdvice: e.target.value }))} />
              </div>
              <div>
                <label className="label">Follow-up Date</label>
                <input type="date" className="input" value={form.followUpDate} onChange={e => setForm(p => ({ ...p, followUpDate: e.target.value }))} min={format(new Date(), 'yyyy-MM-dd')} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary px-8">
              {submitting ? (
                <span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</span>
              ) : 'Create Prescription'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
