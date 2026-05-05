// RegisterPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await authAPI.register(form)
      toast.success('Account created! Please verify your email.')
      navigate('/verify-otp', { state: { email: form.email } })
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-secondary-900 p-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white">⚕</span>
            </div>
            <span className="font-bold text-lg text-secondary-900 dark:text-white">Nexus Care</span>
          </Link>

          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-1">Create Account</h1>
          <p className="text-secondary-500 text-sm mb-6">Join thousands of patients and doctors</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="John Smith" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
            </div>
            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {['patient', 'doctor'].map(role => (
                  <button type="button" key={role}
                    onClick={() => setForm(p => ({ ...p, role }))}
                    className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all capitalize ${form.role === role ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'border-secondary-200 dark:border-secondary-600 text-secondary-600 dark:text-secondary-400 hover:border-primary-300'}`}>
                    {role === 'patient' ? '🤒' : '👨‍⚕️'} {role}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-secondary-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
