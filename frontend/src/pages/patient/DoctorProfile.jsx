// DoctorProfile.jsx - patient/DoctorProfile.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, Modal } from '../../components/common/index'
import { doctorAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function DoctorProfile() {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState(false)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    doctorAPI.getDoctorById(id)
      .then(({ data }) => setDoctor(data.data.doctor))
      .catch(() => toast.error('Doctor not found'))
      .finally(() => setLoading(false))
  }, [id])

  const submitReview = async () => {
    setSubmittingReview(true)
    try {
      await doctorAPI.addReview(id, review)
      toast.success('Review submitted!')
      setReviewModal(false)
      doctorAPI.getDoctorById(id).then(({ data }) => setDoctor(data.data.doctor))
    } catch (err) { toast.error(err.message || 'Failed to submit review') }
    finally { setSubmittingReview(false) }
  }

  if (loading) return <DashboardLayout title="Doctor Profile"><PageLoader /></DashboardLayout>
  if (!doctor) return <DashboardLayout title="Doctor Profile"><div className="text-center py-16 text-secondary-500">Doctor not found</div></DashboardLayout>

  const user = doctor.user || {}
  const specs = doctor.specializations?.map(s => s.name).join(', ') || ''
  const stars = Math.round(doctor.rating?.average || 0)

  return (
    <DashboardLayout title="Doctor Profile">
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.avatar?.url ? <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-primary-600">{user.name?.charAt(0)}</span>}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Dr. {user.name}</h1>
              <p className="text-primary-600 font-medium">{specs}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-amber-400">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
                <span className="text-secondary-500 text-sm">{doctor.rating?.average?.toFixed(1) || '0.0'} ({doctor.rating?.count || 0} reviews)</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-secondary-600 dark:text-secondary-400">
                <span>🏥 {doctor.experience || 0} years experience</span>
                <span>💰 ${doctor.consultationFee || 0}/visit</span>
                <span>⏱ {doctor.consultationDuration || 15} min</span>
                {doctor.isAvailableForEmergency && <span className="text-red-500 font-semibold">🚨 Emergency available</span>}
              </div>
              {doctor.hospitalAffiliation && <p className="text-sm text-secondary-500 mt-1">🏨 {doctor.hospitalAffiliation}</p>}
              {doctor.languages?.length > 0 && <p className="text-sm text-secondary-500 mt-1">🌐 {doctor.languages.join(', ')}</p>}
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Link to={`/patient/book/${id}`} className="btn-primary text-center py-3 px-8">Book Appointment</Link>
              <button onClick={() => setReviewModal(true)} className="btn-secondary text-center py-2 px-6 text-sm">Leave a Review</button>
            </div>
          </div>
        </div>

        {doctor.bio && (
          <div className="card p-6 mb-6">
            <h3 className="font-bold text-secondary-900 dark:text-white mb-3">About Dr. {user.name}</h3>
            <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed">{doctor.bio}</p>
          </div>
        )}

        {doctor.qualifications?.length > 0 && (
          <div className="card p-6 mb-6">
            <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Qualifications</h3>
            <div className="space-y-3">
              {doctor.qualifications.map((q, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xl">🎓</span>
                  <div>
                    <p className="font-semibold text-secondary-900 dark:text-white">{q.degree}</p>
                    <p className="text-sm text-secondary-500">{q.institution} {q.year && `• ${q.year}`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {doctor.reviews?.length > 0 && (
          <div className="card p-6">
            <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Patient Reviews</h3>
            <div className="space-y-4">
              {doctor.reviews.slice(0, 5).map((r, i) => (
                <div key={i} className="p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        {r.patient?.avatar?.url ? <img src={r.patient.avatar.url} alt="" className="w-full h-full object-cover rounded-full" /> : <span className="text-xs font-bold text-primary-600">{r.patient?.name?.charAt(0) || 'P'}</span>}
                      </div>
                      <span className="font-semibold text-sm text-secondary-900 dark:text-white">{r.patient?.name || 'Patient'}</span>
                    </div>
                    <span className="text-amber-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  {r.comment && <p className="text-secondary-600 dark:text-secondary-400 text-sm">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="Leave a Review" size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setReview(p => ({ ...p, rating: star }))} className={`text-3xl transition-all ${star <= review.rating ? 'text-amber-400 scale-110' : 'text-secondary-300 hover:text-amber-300'}`}>★</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Your Review (optional)</label>
              <textarea className="input resize-none" rows={3} placeholder="Share your experience..." value={review.comment} onChange={e => setReview(p => ({ ...p, comment: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submitReview} disabled={submittingReview} className="btn-primary flex-1">{submittingReview ? 'Submitting...' : 'Submit Review'}</button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
