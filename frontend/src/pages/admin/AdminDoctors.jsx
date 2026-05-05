// AdminDoctors.jsx
import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, EmptyState, Modal } from '../../components/common/index'
import { adminAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminDoctors() {
  const [pendingDoctors, setPendingDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [processing, setProcessing] = useState(null)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const { data } = await adminAPI.getPendingDoctors()
      setPendingDoctors(data.data.doctors || [])
    } catch { toast.error('Failed to load pending doctors') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPending() }, [])

  const handleApprove = async (doctorId, isApproved) => {
    setProcessing(doctorId)
    try {
      await adminAPI.approveDoctor(doctorId, { isApproved })
      toast.success(`Doctor ${isApproved ? 'approved' : 'rejected'}`)
      fetchPending()
      setSelected(null)
    } catch { toast.error('Failed to process') }
    finally { setProcessing(null) }
  }

  return (
    <DashboardLayout title="Doctor Approvals">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-secondary-500 text-sm">{pendingDoctors.length} doctor(s) awaiting approval</p>
        </div>
      </div>

      {loading ? <PageLoader /> : pendingDoctors.length === 0 ? (
        <EmptyState icon="✅" title="All doctors reviewed" description="No pending doctor approval requests" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingDoctors.map(doc => {
            const user = doc.user || {}
            const specs = doc.specializations?.map(s => s.name).join(', ') || 'Not specified'
            return (
              <div key={doc._id} className="card p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.avatar?.url ? <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" /> : <span className="font-bold text-primary-600">{user.name?.charAt(0)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-secondary-900 dark:text-white">Dr. {user.name}</h3>
                    <p className="text-xs text-secondary-500 truncate">{user.email}</p>
                    <p className="text-xs text-primary-600 mt-0.5">{specs}</p>
                  </div>
                  <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex-shrink-0">Pending</span>
                </div>
                <div className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                  <p>🪪 License: <span className="font-semibold">{doc.licenseNumber}</span></p>
                  <p>🏥 {doc.experience || 0} years experience</p>
                  {doc.qualifications?.length > 0 && <p>🎓 {doc.qualifications[0]?.degree}</p>}
                  <p className="text-xs text-secondary-400">Applied {format(new Date(user.createdAt || doc.createdAt), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(doc)} className="btn-secondary flex-1 text-sm py-2">View Details</button>
                  <button onClick={() => handleApprove(doc._id, true)} disabled={processing === doc._id} className="btn-primary flex-1 text-sm py-2">
                    {processing === doc._id ? '...' : '✓ Approve'}
                  </button>
                  <button onClick={() => handleApprove(doc._id, false)} disabled={processing === doc._id} className="btn-danger text-sm py-2 px-3">✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Doctor Details" size="lg">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-secondary-500">Name</span><p className="font-semibold">Dr. {selected.user?.name}</p></div>
              <div><span className="text-secondary-500">Email</span><p className="font-semibold">{selected.user?.email}</p></div>
              <div><span className="text-secondary-500">License #</span><p className="font-semibold">{selected.licenseNumber}</p></div>
              <div><span className="text-secondary-500">Experience</span><p className="font-semibold">{selected.experience} years</p></div>
              <div><span className="text-secondary-500">Fee</span><p className="font-semibold">${selected.consultationFee}</p></div>
              <div><span className="text-secondary-500">Hospital</span><p className="font-semibold">{selected.hospitalAffiliation || 'N/A'}</p></div>
            </div>
            {selected.qualifications?.length > 0 && (
              <div>
                <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">Qualifications</h4>
                {selected.qualifications.map((q, i) => (
                  <p key={i} className="text-secondary-600 dark:text-secondary-400">{q.degree} — {q.institution} ({q.year})</p>
                ))}
              </div>
            )}
            {selected.bio && <div><h4 className="font-semibold text-secondary-900 dark:text-white mb-1">Bio</h4><p className="text-secondary-600 dark:text-secondary-400">{selected.bio}</p></div>}
            <div className="flex gap-3 pt-4">
              <button onClick={() => handleApprove(selected._id, true)} className="btn-primary flex-1">✓ Approve Doctor</button>
              <button onClick={() => handleApprove(selected._id, false)} className="btn-danger flex-1">✕ Reject</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
