// DoctorPrescriptions.jsx
import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, EmptyState, Pagination, Modal } from '../../components/common/index'
import { prescriptionAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [selected, setSelected] = useState(null)

  const fetchPrescriptions = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await prescriptionAPI.getDoctorPrescriptions({ page: p, limit: 15 })
      setPrescriptions(data.data.prescriptions || [])
      setPages(data.data.pages || 1)
    } catch { toast.error('Failed to load prescriptions') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPrescriptions() }, [])

  return (
    <DashboardLayout title="Prescriptions Issued">
      {loading ? <PageLoader /> : prescriptions.length === 0 ? (
        <EmptyState icon="💊" title="No prescriptions issued" description="Prescriptions you create will appear here" />
      ) : (
        <>
          <div className="table-container card">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Rx Number</th>
                  <th>Diagnosis</th>
                  <th>Medicines</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map(p => {
                  const patient = p.patient || {}
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {patient.avatar?.url ? <img src={patient.avatar.url} alt={patient.name} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-primary-600">{patient.name?.charAt(0)}</span>}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{patient.name}</p>
                            <p className="text-xs text-secondary-500">{patient.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="font-mono text-xs bg-secondary-100 dark:bg-secondary-700 px-2 py-1 rounded-lg">{p.prescriptionNumber}</span></td>
                      <td className="max-w-xs"><p className="truncate text-sm">{p.diagnosis}</p></td>
                      <td><span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{p.medicines?.length || 0} meds</span></td>
                      <td className="text-xs text-secondary-500">{format(new Date(p.createdAt), 'MMM d, yyyy')}</td>
                      <td>
                        <div className="flex gap-1.5">
                          <button onClick={() => setSelected(p)} className="text-xs px-2.5 py-1.5 bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300 rounded-lg font-semibold hover:bg-secondary-200 transition-colors">View</button>
                          {p.pdfUrl && <a href={p.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1.5 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-lg font-semibold hover:bg-primary-200 transition-colors">PDF</a>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onPageChange={(p) => { setPage(p); fetchPrescriptions(p) }} />
        </>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Prescription ${selected?.prescriptionNumber}`} size="lg">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-secondary-500">Patient</span><p className="font-semibold">{selected.patient?.name}</p></div>
              <div><span className="text-secondary-500">Date</span><p className="font-semibold">{format(new Date(selected.createdAt), 'MMM d, yyyy')}</p></div>
              <div className="col-span-2"><span className="text-secondary-500">Diagnosis</span><p className="font-semibold">{selected.diagnosis}</p></div>
            </div>
            <div>
              <h4 className="font-bold text-secondary-900 dark:text-white mb-2">Medicines</h4>
              <div className="space-y-2">
                {selected.medicines?.map((med, i) => (
                  <div key={i} className="p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-xl">
                    <p className="font-semibold text-primary-600 text-sm">{med.name} — {med.dosage}</p>
                    <p className="text-xs text-secondary-500 mt-0.5">{med.frequency} • {med.duration} {med.instructions && `• ${med.instructions}`}</p>
                  </div>
                ))}
              </div>
            </div>
            {selected.notes && <div><span className="text-secondary-500">Notes</span><p className="text-secondary-700 dark:text-secondary-300 mt-1">{selected.notes}</p></div>}
            {selected.pdfUrl && <a href={selected.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full justify-center">Download PDF</a>}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
