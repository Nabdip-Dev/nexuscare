// AdminUsers.jsx
import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, StatusBadge, Pagination, ConfirmDialog } from '../../components/common/index'
import { adminAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const fetchUsers = async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, limit: 15 }
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      const { data } = await adminAPI.getUsers(params)
      setUsers(data.data.users || [])
      setPages(data.data.pages || 1)
      setTotal(data.data.total || 0)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1); fetchUsers(1) }, [search, roleFilter])

  const toggleActive = async (user) => {
    try {
      await adminAPI.updateUser(user._id, { isActive: !user.isActive })
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`)
      fetchUsers(page)
    } catch { toast.error('Failed to update user') }
  }

  const handleDelete = async () => {
    try {
      await adminAPI.deleteUser(deleteId)
      toast.success('User deleted')
      fetchUsers(page)
    } catch { toast.error('Failed to delete') }
    setDeleteId(null)
  }

  const roleColors = { patient: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', doctor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', receptionist: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }

  return (
    <DashboardLayout title="Manage Users">
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <input className="input pl-10" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select className="input w-40" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {['patient', 'doctor', 'admin', 'receptionist'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span className="flex items-center text-secondary-500 text-sm">{total} total</span>
      </div>

      {loading ? <PageLoader /> : (
        <>
          <div className="table-container card">
            <table>
              <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {u.avatar?.url ? <img src={u.avatar.url} alt={u.name} className="w-full h-full object-cover" /> : <span className="font-bold text-primary-600 text-sm">{u.name?.charAt(0)}</span>}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-secondary-900 dark:text-white">{u.name}</p>
                          <p className="text-xs text-secondary-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                    <td>
                      <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-xs text-secondary-500">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <button onClick={() => toggleActive(u)} className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${u.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => setDeleteId(u._id)} className="text-xs px-2.5 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg font-semibold hover:bg-red-200 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onPageChange={(p) => { setPage(p); fetchUsers(p) }} />
        </>
      )}
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete User" message="Are you sure you want to permanently delete this user? This cannot be undone." confirmText="Delete" danger />
    </DashboardLayout>
  )
}
