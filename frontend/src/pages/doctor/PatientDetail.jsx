import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, StatusBadge, EmptyState } from '../../components/common/index'
import { appointmentAPI, reportAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function PatientDetail() {
  const { patientId } = useParams()
  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('history')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [historyRes, reportsRes] = await Promise.all([
          appointmentAPI.getPatientHistory(patientId),
          reportAPI.getPatientReports(patientId)
        ])
        setPatient(historyRes.data.data.patient)
        setAppointments(historyRes.data.data.appointments || [])
        setReports(reportsRes.data.data.reports || [])
      } catch { toast.error('Failed to load patient data') }
      finally { setLoading(false) }
    }
    loadData()
  }, [patientId])

  if (loading) return <DashboardLayout title="Patient Details"><PageLoader /></DashboardLayout>
  if (!patient) return <DashboardLayout title="Patient Details"><div className="text-center py-16 text-secondary-500">Patient not found</div></DashboardLayout>

  const age = patient.dateOfBirth ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null

  const tabs = [
    { id: 'history', label: 'Appointment History', count: appointments.length },
    { id: 'reports', label: 'Reports', count: reports.length },
    { id: 'profile', label: 'Medical Profile' }
  ]

  return (
    <DashboardLayout title="Patient Details">
      <div className="max-w-4xl mx-auto">
        {/* Patient header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
              {patient.avatar?.url
                ? <img src={patient.avatar.url} alt={patient.name} className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-primary-600">{patient.name?.charAt(0)}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{patient.name}</h2>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-secondary-500">
                {age && <span>🎂 {age} years old</span>}
                {patient.gender && <span>• {patient.gender}</span>}
                {patient.bloodGroup && <span>🩸 {patient.bloodGroup}</span>}
                {patient.phone && <span>📞 {patient.phone}</span>}
              </div>
              {patient.allergies?.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs font-semibold text-red-500">⚠️ Allergies: </span>
                  {patient.allergies.map(a => (
                    <span key={a} className="badge bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mr-1 text-xs">{a}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{appointments.length} visits</span>
              <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{reports.length} reports</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-secondary-100 dark:bg-secondary-800 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm' : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'}`}>
              {tab.label} {tab.count !== undefined && <span className="ml-1 text-xs">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* Appointment History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <EmptyState icon="📅" title="No appointment history" />
            ) : appointments.map(apt => (
              <div key={apt._id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-secondary-900 dark:text-white">{format(new Date(apt.date), 'EEEE, MMMM d, yyyy')}</span>
                      <StatusBadge status={apt.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-secondary-500 mb-2">
                      <span>⏰ {apt.timeSlot?.startTime}</span>
                      <span>🎫 Token #{apt.tokenNumber}</span>
                      <span>📋 {apt.type}</span>
                    </div>
                    {apt.reasonForVisit && <p className="text-sm text-secondary-600 dark:text-secondary-400">Reason: {apt.reasonForVisit}</p>}
                    {apt.vitals && Object.values(apt.vitals).some(Boolean) && (
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-secondary-500">
                        {apt.vitals.bloodPressure && <span>BP: {apt.vitals.bloodPressure}</span>}
                        {apt.vitals.heartRate && <span>HR: {apt.vitals.heartRate} bpm</span>}
                        {apt.vitals.temperature && <span>Temp: {apt.vitals.temperature}°F</span>}
                        {apt.vitals.weight && <span>Weight: {apt.vitals.weight} kg</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {apt.prescription && (
                      <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">💊 Rx issued</span>
                    )}
                    {['confirmed', 'in-progress'].includes(apt.status) && !apt.prescription && (
                      <Link to={`/doctor/prescribe/${apt._id}`} className="btn-primary text-xs py-1.5 px-3">+ Prescribe</Link>
                    )}
                  </div>
                </div>
                {apt.prescription && (
                  <div className="mt-3 pt-3 border-t border-secondary-100 dark:border-secondary-700">
                    <p className="text-xs font-semibold text-secondary-700 dark:text-secondary-300 mb-1">Diagnosis: <span className="font-normal">{apt.prescription.diagnosis}</span></p>
                    <p className="text-xs text-secondary-500">{apt.prescription.medicines?.length || 0} medicine(s) prescribed</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <div>
            {reports.length === 0 ? (
              <EmptyState icon="📋" title="No reports available" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reports.map(r => {
                  const typeEmoji = { blood_test: '🩸', urine_test: '🧪', xray: '🦴', mri: '🧠', ct_scan: '🔬', ultrasound: '📡', ecg: '❤️', other: '📄' }
                  return (
                    <div key={r._id} className="card p-4 flex items-start gap-3">
                      <div className="text-2xl">{typeEmoji[r.type] || '📄'}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-secondary-900 dark:text-white text-sm truncate">{r.title}</h4>
                        <p className="text-xs text-secondary-500">{r.type?.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-xs text-secondary-400 mt-0.5">{format(new Date(r.reportDate || r.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                      <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Medical Profile */}
        {activeTab === 'profile' && (
          <div className="card p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <h4 className="font-bold text-secondary-900 dark:text-white mb-3">Personal Information</h4>
                <div className="space-y-2 text-sm">
                  {[
                    ['Name', patient.name],
                    ['Date of Birth', patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'MMM d, yyyy') : '—'],
                    ['Gender', patient.gender || '—'],
                    ['Blood Group', patient.bloodGroup || '—'],
                    ['Phone', patient.phone || '—'],
                    ['Email', patient.email]
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <span className="text-secondary-500 w-28 flex-shrink-0">{label}:</span>
                      <span className="text-secondary-900 dark:text-white font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-secondary-900 dark:text-white mb-3">Medical Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-secondary-500 uppercase mb-1">Allergies</p>
                    {patient.allergies?.length > 0
                      ? <div className="flex flex-wrap gap-1">{patient.allergies.map(a => <span key={a} className="badge bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">{a}</span>)}</div>
                      : <p className="text-sm text-secondary-400">None reported</p>
                    }
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-secondary-500 uppercase mb-1">Medical History</p>
                    {patient.medicalHistory?.length > 0
                      ? patient.medicalHistory.map((h, i) => (
                        <div key={i} className="text-sm mb-1">
                          <span className="font-medium text-secondary-800 dark:text-secondary-200">{h.condition}</span>
                          {h.diagnosedDate && <span className="text-secondary-400 ml-2 text-xs">({format(new Date(h.diagnosedDate), 'MMM yyyy')})</span>}
                          {h.notes && <p className="text-xs text-secondary-500">{h.notes}</p>}
                        </div>
                      ))
                      : <p className="text-sm text-secondary-400">No history recorded</p>
                    }
                  </div>
                </div>
              </div>
            </div>
            {patient.emergencyContact?.name && (
              <div className="pt-4 border-t border-secondary-100 dark:border-secondary-700">
                <h4 className="font-bold text-secondary-900 dark:text-white mb-2">Emergency Contact</h4>
                <div className="text-sm text-secondary-600 dark:text-secondary-400">
                  <span className="font-medium">{patient.emergencyContact.name}</span> ({patient.emergencyContact.relationship}) — {patient.emergencyContact.phone}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
