// MyReports.jsx
import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, EmptyState, Pagination, ConfirmDialog } from '../../components/common/index'
import { reportAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function MyReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ title: '', type: 'other', reportDate: '' })
  const [file, setFile] = useState(null)
  const [showUpload, setShowUpload] = useState(false)

  const fetchReports = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await reportAPI.getMyReports({ page: p, limit: 10 })
      setReports(data.data.reports || [])
      setPages(data.data.pages || 1)
    } catch { toast.error('Failed to load reports') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReports() }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')
    if (!form.title) return toast.error('Please enter a title')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('report', file)
      fd.append('title', form.title)
      fd.append('type', form.type)
      if (form.reportDate) fd.append('reportDate', form.reportDate)
      await reportAPI.upload(fd)
      toast.success('Report uploaded successfully')
      setShowUpload(false)
      setForm({ title: '', type: 'other', reportDate: '' })
      setFile(null)
      fetchReports(1)
    } catch (err) { toast.error(err.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  const handleDelete = async () => {
    try {
      await reportAPI.delete(deleteId)
      toast.success('Report deleted')
      fetchReports(page)
    } catch { toast.error('Failed to delete') }
    setDeleteId(null)
  }

  const reportTypes = ['blood_test', 'urine_test', 'xray', 'mri', 'ct_scan', 'ultrasound', 'ecg', 'other']
  const typeEmoji = { blood_test: '🩸', urine_test: '🧪', xray: '🦴', mri: '🧠', ct_scan: '🔬', ultrasound: '📡', ecg: '❤️', other: '📄' }

  return (
    <DashboardLayout title="My Medical Reports">
      <div className="flex items-center justify-between mb-6">
        <p className="text-secondary-500 text-sm">{reports.length} report(s) stored</p>
        <button onClick={() => setShowUpload(s => !s)} className="btn-primary">+ Upload Report</button>
      </div>

      {showUpload && (
        <div className="card p-6 mb-6">
          <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Upload New Report</h3>
          <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Report Title <span className="text-red-500">*</span></label>
              <input className="input" placeholder="e.g. Blood Test Results" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Report Type</label>
              <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {reportTypes.map(t => <option key={t} value={t}>{typeEmoji[t]} {t.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Report Date</label>
              <input type="date" className="input" value={form.reportDate} onChange={e => setForm(p => ({ ...p, reportDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">File <span className="text-red-500">*</span></label>
              <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} className="input py-2 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={uploading} className="btn-primary">{uploading ? 'Uploading...' : 'Upload Report'}</button>
              <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <PageLoader /> : reports.length === 0 ? (
        <EmptyState icon="📋" title="No reports uploaded" description="Upload your medical reports for easy access" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map(r => (
              <div key={r._id} className="card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl flex-shrink-0">
                    {typeEmoji[r.type] || '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-secondary-900 dark:text-white truncate">{r.title}</h3>
                    <p className="text-xs text-secondary-500 mt-0.5">{r.type?.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-xs text-secondary-400 mt-1">
                      {r.reportDate ? format(new Date(r.reportDate), 'MMM d, yyyy') : format(new Date(r.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </a>
                    <button onClick={() => setDeleteId(r._id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                {r.notes && <p className="text-xs text-secondary-500 mt-3 border-t border-secondary-100 dark:border-secondary-700 pt-2">{r.notes}</p>}
              </div>
            ))}
          </div>
          <Pagination page={page} pages={pages} onPageChange={(p) => { setPage(p); fetchReports(p) }} />
        </>
      )}
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Report" message="Are you sure you want to delete this report? This action cannot be undone." confirmText="Delete" danger />
    </DashboardLayout>
  )
}
