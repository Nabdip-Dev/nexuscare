// ProfilePage.jsx
import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader } from '../../components/common/index'
import { useAuth } from '../../context/AuthContext'
import { userAPI, authAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    gender: user?.gender || '', bloodGroup: user?.bloodGroup || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    allergies: user?.allergies?.join(', ') || ''
  })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [activeTab, setActiveTab] = useState('profile')

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const updates = {
        name: form.name,
        phone: form.phone,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        allergies: form.allergies ? form.allergies.split(',').map(a => a.trim()).filter(Boolean) : []
      }
      const { data } = await userAPI.updateProfile(updates)
      updateUser(data.data.user)
      toast.success('Profile updated successfully')
    } catch { toast.error('Failed to update profile') }
    finally { setLoading(false) }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const { data } = await userAPI.uploadAvatar(fd)
      updateUser({ avatar: data.data.avatar })
      toast.success('Avatar updated')
    } catch { toast.error('Failed to upload avatar') }
    finally { setUploading(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match')
    if (passwords.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await authAPI.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
      toast.success('Password changed successfully')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch { toast.error('Failed to change password') }
    finally { setLoading(false) }
  }

  const tabs = [{ id: 'profile', label: 'Profile' }, { id: 'security', label: 'Security' }]

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-2xl mx-auto">
        {/* Avatar section */}
        <div className="card p-6 mb-6 flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
              {user?.avatar?.url
                ? <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-primary-600">{user?.name?.charAt(0)}</span>
              }
            </div>
            <label className={`absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors ${uploading ? 'opacity-50' : ''}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploading} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{user?.name}</h2>
            <p className="text-secondary-500 text-sm">{user?.email}</p>
            <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 capitalize mt-1">{user?.role}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-secondary-100 dark:bg-secondary-800 p-1 rounded-xl w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === t.id ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm' : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="card p-6">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" placeholder="+1 555 000 0000" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select className="input" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Blood Group</label>
                  <select className="input" value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))}>
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date of Birth</label>
                  <input type="date" className="input" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Allergies (comma-separated)</label>
                  <input className="input" placeholder="Penicillin, Peanuts..." value={form.allergies} onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? 'Saving...' : 'Save Profile'}</button>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="card p-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="font-bold text-secondary-900 dark:text-white mb-2">Change Password</h3>
              <div>
                <label className="label">Current Password</label>
                <input type="password" className="input" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} required />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" placeholder="Min. 6 characters" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} required minLength={6} />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? 'Changing...' : 'Change Password'}</button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
