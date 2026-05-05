// MyPrescriptions.jsx
import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, EmptyState, Pagination, Modal } from '../../components/common/index'
import { prescriptionAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [selected, setSelected] = useState(null)

  const fetchPrescriptions = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await prescriptionAPI.getMyPrescriptions({ page: p, limit: 10 })
      setPrescriptions(data.data.prescriptions || [])
      setPages(data.data.pages || 1)
    } catch { toast.error('Failed to load prescriptions') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPrescriptions() }, [])

  return (
    <DashboardLayout title="My Prescriptions">
      {loading ? <PageLoader /> : prescriptions.length === 0 ? (
        <EmptyState icon="💊" title="No prescriptions yet" description="Your prescriptions will appear here after doctor visits" />
      ) : (
        <>
          <div className="space-y-4">
            {prescriptions.map(p => (
              <div key={p._id} className="card p-5 hover:shadow-card-hover transition-all cursor-pointer" onClick={() => setSelected(p)}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">💊</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-secondary-900 dark:text-white">{p.diagnosis}</h3>
                        <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{p.prescriptionNumber}</span>
                      </div>
                      <p className="text-primary-600 text-sm">Dr. {p.doctor?.user?.name}</p>
                      <div className="flex items-center gap-3 text-xs text-secondary-500 mt-1">
                        <span>📅 {format(new Date(p.createdAt), 'MMM d, yyyy')}</span>
                        <span>💊 {p.medicines?.length} medicine(s)</span>
                        {p.followUpDate && <span>🔄 Follow-up: {format(new Date(p.followUpDate), 'MMM d')}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setSelected(p) }} className="btn-secondary text-xs py-2">View Details</button>
                    {p.pdfUrl && (
                      <a href={p.pdfUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="btn-primary text-xs py-2">Download PDF</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} pages={pages} onPageChange={(p) => { setPage(p); fetchPrescriptions(p) }} />
        </>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Prescription ${selected?.prescriptionNumber}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-secondary-500">Doctor</span><p className="font-semibold">Dr. {selected.doctor?.user?.name}</p></div>
              <div><span className="text-secondary-500">Date</span><p className="font-semibold">{format(new Date(selected.createdAt), 'MMM d, yyyy')}</p></div>
              <div className="col-span-2"><span className="text-secondary-500">Diagnosis</span><p className="font-semibold">{selected.diagnosis}</p></div>
            </div>
            <div>
              <h4 className="font-bold text-secondary-900 dark:text-white mb-3">Medicines</h4>
              <div className="space-y-2">
                {selected.medicines?.map((med, i) => (
                  <div key={i} className="p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-xl">
                    <p className="font-semibold text-primary-600">{med.name}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-secondary-500 mt-1">
                      <span>💊 {med.dosage}</span>
                      <span>🔄 {med.frequency}</span>
                      <span>⏱ {med.duration}</span>
                      {med.instructions && <span>📝 {med.instructions}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {selected.notes && (
              <div><h4 className="font-bold text-secondary-900 dark:text-white mb-2">Doctor's Notes</h4><p className="text-secondary-600 dark:text-secondary-400 text-sm">{selected.notes}</p></div>
            )}
            {selected.pdfUrl && (
              <a href={selected.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full justify-center">Download Prescription PDF</a>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
