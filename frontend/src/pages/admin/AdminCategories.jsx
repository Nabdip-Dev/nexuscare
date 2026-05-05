// AdminCategories.jsx
import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, EmptyState, Modal, ConfirmDialog } from '../../components/common/index'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', icon: '🏥', isActive: true })
  const [saving, setSaving] = useState(false)

  const fetchCats = async () => {
    setLoading(true)
    try {
      const { data } = await adminAPI.getCategories()
      setCategories(data.data.categories || [])
    } catch { toast.error('Failed to load categories') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCats() }, [])

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '', icon: '🏥', isActive: true }); setShowModal(true) }
  const openEdit = (cat) => { setEditing(cat); setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '🏥', isActive: cat.isActive }); setShowModal(true) }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required')
    setSaving(true)
    try {
      if (editing) {
        await adminAPI.updateCategory(editing._id, form)
        toast.success('Category updated')
      } else {
        await adminAPI.createCategory(form)
        toast.success('Category created')
      }
      setShowModal(false)
      fetchCats()
    } catch { toast.error('Failed to save category') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await adminAPI.deleteCategory(deleteId)
      toast.success('Category deleted')
      fetchCats()
    } catch { toast.error('Failed to delete') }
    setDeleteId(null)
  }

  const ICONS = ['🏥', '❤️', '🧠', '🦷', '👁️', '🦴', '🫁', '🩺', '💊', '🧪', '👶', '🤰', '🏃', '🧬', '💉', '🩻']

  return (
    <DashboardLayout title="Manage Categories">
      <div className="flex items-center justify-between mb-6">
        <p className="text-secondary-500 text-sm">{categories.length} specializations</p>
        <button onClick={openAdd} className="btn-primary">+ Add Category</button>
      </div>

      {loading ? <PageLoader /> : categories.length === 0 ? (
        <EmptyState icon="🏷️" title="No categories" description="Add specialization categories" action={<button onClick={openAdd} className="btn-primary mt-2">Add First Category</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map(cat => (
            <div key={cat._id} className="card p-4 hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{cat.icon || '🏥'}</div>
                <span className={`badge ${cat.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <h3 className="font-bold text-secondary-900 dark:text-white mb-1">{cat.name}</h3>
              {cat.description && <p className="text-xs text-secondary-500 mb-3 line-clamp-2">{cat.description}</p>}
              <div className="flex gap-2">
                <button onClick={() => openEdit(cat)} className="btn-secondary flex-1 text-xs py-1.5">Edit</button>
                <button onClick={() => setDeleteId(cat._id)} className="btn-danger text-xs py-1.5 px-3">Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Category' : 'New Category'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Name <span className="text-red-500">*</span></label>
            <input className="input" placeholder="e.g. Cardiology" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} placeholder="Brief description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Icon</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ICONS.map(icon => (
                <button key={icon} type="button" onClick={() => setForm(p => ({ ...p, icon }))} className={`text-2xl p-2 rounded-xl transition-all ${form.icon === icon ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' : 'hover:bg-secondary-100 dark:hover:bg-secondary-700'}`}>{icon}</button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
            <span className="text-sm text-secondary-700 dark:text-secondary-300">Active</span>
          </label>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Category" message="Delete this specialization category?" confirmText="Delete" danger />
    </DashboardLayout>
  )
}
