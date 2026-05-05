import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function VerifyOTPPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const refs = useRef([])

  const email = state?.email

  useEffect(() => {
    if (!email) navigate('/register')
  }, [email, navigate])

  useEffect(() => {
    const timer = countdown > 0 && setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      setOtp(paste.split(''))
      refs.current[5]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) return toast.error('Please enter the 6-digit OTP')
    setLoading(true)
    try {
      const { data } = await authAPI.verifyOTP({ email, otp: code })
      localStorage.setItem('nc_token', data.data.token)
      toast.success('Email verified! Welcome to Nexus Care.')
      const routes = { admin: '/admin', doctor: '/doctor', receptionist: '/receptionist', patient: '/patient' }
      navigate(routes[data.data.user.role] || '/patient')
    } catch (err) {
      toast.error(err.message || 'Invalid OTP')
      setOtp(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await authAPI.resendOTP({ email })
      toast.success('New OTP sent to your email')
      setCountdown(60)
      setOtp(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } catch (err) {
      toast.error(err.message || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-secondary-900 p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📧</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">Check your email</h1>
          <p className="text-secondary-500 text-sm mb-1">We sent a 6-digit code to</p>
          <p className="font-semibold text-primary-600 mb-8">{email}</p>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => refs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl bg-secondary-50 dark:bg-secondary-700 border-secondary-200 dark:border-secondary-600 text-secondary-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button type="submit" disabled={loading || otp.join('').length !== 6} className="btn-primary w-full py-3 mb-4">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : 'Verify Email'}
            </button>
          </form>

          <p className="text-secondary-500 text-sm">
            Didn't receive it?{' '}
            {countdown > 0 ? (
              <span className="text-secondary-400">Resend in {countdown}s</span>
            ) : (
              <button onClick={handleResend} disabled={resending} className="text-primary-600 font-semibold hover:text-primary-700 disabled:opacity-50">
                {resending ? 'Sending...' : 'Resend code'}
              </button>
            )}
          </p>

          <Link to="/login" className="block mt-4 text-sm text-secondary-400 hover:text-secondary-600">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
