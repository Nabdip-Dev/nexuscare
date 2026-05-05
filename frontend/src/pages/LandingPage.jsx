import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const features = [
  { icon: '🔍', title: 'Find Doctors', desc: 'Search thousands of verified specialists by specialty, location and rating.' },
  { icon: '📅', title: 'Easy Booking', desc: 'Book appointments instantly with real-time slot availability.' },
  { icon: '💻', title: 'Video Consult', desc: 'Connect with doctors remotely from the comfort of your home.' },
  { icon: '💊', title: 'Prescriptions', desc: 'Digital prescriptions with PDF download and pharmacy integration.' },
  { icon: '🧠', title: 'AI Symptom Checker', desc: 'Get an instant AI-powered health assessment before your visit.' },
  { icon: '📊', title: 'Health Records', desc: 'Securely store and access all your medical reports anytime.' }
]

const stats = [
  { value: '500+', label: 'Verified Doctors' },
  { value: '50K+', label: 'Happy Patients' },
  { value: '30+', label: 'Specializations' },
  { value: '99%', label: 'Satisfaction Rate' }
]

export default function LandingPage() {
  const { dark, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md border-b border-secondary-100 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white text-lg">⚕</span>
            </div>
            <span className="font-bold text-xl text-secondary-900 dark:text-white">Nexus Care</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="p-2 rounded-xl text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
              {dark ? '☀️' : '🌙'}
            </button>
            <Link to="/login" className="btn-secondary text-sm py-2">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white dark:from-secondary-900 dark:to-secondary-800 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-100 dark:bg-primary-900/20 rounded-full filter blur-3xl opacity-60" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-primary-200 dark:bg-primary-900/10 rounded-full filter blur-3xl opacity-40" />
        <div className="max-w-4xl mx-auto text-center relative">
          <span className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full text-sm font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            Modern Healthcare Platform
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-secondary-900 dark:text-white leading-tight mb-6">
            Your Health,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Our Priority</span>
          </h1>
          <p className="text-xl text-secondary-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect with verified doctors, book appointments, manage prescriptions, and take control of your health — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary py-4 px-10 text-base">Book Your First Appointment →</Link>
            <Link to="/login" className="btn-secondary py-4 px-10 text-base">Sign In to Dashboard</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary-600 dark:bg-primary-900">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold text-white">{s.value}</p>
              <p className="text-primary-200 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">Everything You Need</h2>
            <p className="text-secondary-500 text-lg max-w-2xl mx-auto">A complete healthcare ecosystem for patients, doctors, and administrators.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="card p-6 hover:shadow-card-hover transition-all duration-200 group">
                <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="font-bold text-secondary-900 dark:text-white text-lg mb-2">{f.title}</h3>
                <p className="text-secondary-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles section */}
      <section className="py-20 px-4 sm:px-6 bg-secondary-50 dark:bg-secondary-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">Built for Everyone</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: 'Patient', icon: '🤒', color: 'from-blue-500 to-blue-700', desc: 'Book appointments, view prescriptions, manage your health records.' },
              { role: 'Doctor', icon: '👨‍⚕️', color: 'from-green-500 to-green-700', desc: 'Manage patients, issue prescriptions, track appointments.' },
              { role: 'Admin', icon: '🛡️', color: 'from-purple-500 to-purple-700', desc: 'Full platform control — users, doctors, analytics.' },
              { role: 'Receptionist', icon: '🏥', color: 'from-amber-500 to-amber-700', desc: 'Manage walk-ins, queue, and appointment bookings.' }
            ].map(r => (
              <div key={r.role} className="card p-6 text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center text-3xl mx-auto mb-4`}>{r.icon}</div>
                <h3 className="font-bold text-secondary-900 dark:text-white text-lg mb-2">{r.role}</h3>
                <p className="text-secondary-500 text-sm">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center bg-gradient-to-br from-primary-600 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-64 h-64 border-2 border-white rounded-full" />
          <div className="absolute bottom-10 right-1/4 w-40 h-40 border border-white rounded-full" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold text-white mb-4">Start Your Health Journey Today</h2>
          <p className="text-primary-200 text-lg mb-10">Join thousands of patients and doctors on Nexus Care.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold px-10 py-4 rounded-2xl hover:bg-primary-50 transition-colors text-lg shadow-lg">
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-secondary-400 py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center text-white text-sm">⚕</div>
          <span className="font-bold text-white">Nexus Care</span>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} Nexus Care. Modern Healthcare Platform.</p>
      </footer>
    </div>
  )
}
