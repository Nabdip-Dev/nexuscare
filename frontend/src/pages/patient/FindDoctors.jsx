import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, EmptyState, Pagination } from '../../components/common/index'
import { doctorAPI, categoryAPI } from '../../services/api'
import toast from 'react-hot-toast'

function DoctorCard({ doctor }) {
  const user = doctor.user || {}
  const specs = doctor.specializations?.map(s => s.name).join(', ') || 'General Practice'
  const stars = '★'.repeat(Math.round(doctor.rating?.average || 0)) + '☆'.repeat(5 - Math.round(doctor.rating?.average || 0))

  return (
    <div className="card p-6 hover:shadow-card-hover transition-all duration-200 flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center overflow-hidden flex-shrink-0">
          {user.avatar?.url
            ? <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
            : <span className="text-2xl font-bold text-primary-600">{user.name?.charAt(0)}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-secondary-900 dark:text-white">Dr. {user.name}</h3>
          <p className="text-primary-600 text-sm font-medium truncate">{specs}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-amber-400 text-sm">{stars}</span>
            <span className="text-secondary-500 text-xs">({doctor.rating?.count || 0} reviews)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
          <span>🏥</span>
          <span>{doctor.experience || 0} yrs exp</span>
        </div>
        <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
          <span>💰</span>
          <span>${doctor.consultationFee || 0}/visit</span>
        </div>
        {doctor.hospitalAffiliation && (
          <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400 col-span-2">
            <span>🏨</span>
            <span className="truncate">{doctor.hospitalAffiliation}</span>
          </div>
        )}
        {doctor.languages?.length > 0 && (
          <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400 col-span-2">
            <span>🌐</span>
            <span className="truncate">{doctor.languages.join(', ')}</span>
          </div>
        )}
      </div>

      {doctor.bio && (
        <p className="text-secondary-500 text-xs mb-4 line-clamp-2">{doctor.bio}</p>
      )}

      <div className="flex gap-2 mt-auto">
        <Link to={`/patient/doctors/${doctor._id}`} className="btn-secondary flex-1 text-sm py-2">View Profile</Link>
        <Link to={`/patient/book/${doctor._id}`} className="btn-primary flex-1 text-sm py-2">Book Now</Link>
      </div>
    </div>
  )
}

export default function FindDoctors() {
  const [doctors, setDoctors] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ search: '', specialization: '', sort: '-rating.average' })

  const fetchDoctors = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, limit: 12, ...filters }
      if (!filters.specialization) delete params.specialization
      if (!filters.search) delete params.search
      const { data } = await doctorAPI.getDoctors(params)
      setDoctors(data.data.doctors || [])
      setTotal(data.data.total || 0)
      setPages(data.data.pages || 1)
    } catch {
      toast.error('Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    categoryAPI.getAll().then(({ data }) => setCategories(data.data.categories || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setPage(1)
    fetchDoctors(1)
  }, [filters])

  const handlePageChange = (p) => { setPage(p); fetchDoctors(p) }

  return (
    <DashboardLayout title="Find Doctors">
      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              className="input pl-10"
              placeholder="Search doctors..."
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <select className="input" value={filters.specialization} onChange={e => setFilters(p => ({ ...p, specialization: e.target.value }))}>
            <option value="">All Specializations</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="input" value={filters.sort} onChange={e => setFilters(p => ({ ...p, sort: e.target.value }))}>
            <option value="-rating.average">Highest Rated</option>
            <option value="consultationFee">Lowest Fee</option>
            <option value="-consultationFee">Highest Fee</option>
            <option value="-experience">Most Experienced</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-secondary-600 dark:text-secondary-400 text-sm">
          {total > 0 ? `${total} doctor${total !== 1 ? 's' : ''} found` : ''}
        </p>
      </div>

      {loading ? (
        <PageLoader />
      ) : doctors.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map(doc => <DoctorCard key={doc._id} doctor={doc} />)}
          </div>
          <Pagination page={page} pages={pages} onPageChange={handlePageChange} />
        </>
      ) : (
        <EmptyState icon="👨‍⚕️" title="No doctors found" description="Try adjusting your filters or search terms" />
      )}
    </DashboardLayout>
  )
}
