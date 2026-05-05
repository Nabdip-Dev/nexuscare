// SymptomChecker.jsx
import { useState } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { aiAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const COMMON_SYMPTOMS = ['Fever', 'Cough', 'Headache', 'Fatigue', 'Nausea', 'Dizziness', 'Chest Pain', 'Shortness of Breath', 'Sore Throat', 'Abdominal Pain', 'Back Pain', 'Joint Pain', 'Rash', 'Swelling', 'Frequent Urination']

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState([])
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const addSymptom = (s) => {
    const clean = s.trim()
    if (clean && !symptoms.includes(clean)) setSymptoms(p => [...p, clean])
    setInput('')
  }

  const removeSymptom = (s) => setSymptoms(p => p.filter(x => x !== s))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (input.trim()) addSymptom(input) }
  }

  const analyze = async () => {
    if (symptoms.length === 0) return toast.error('Please add at least one symptom')
    setLoading(true)
    try {
      const { data } = await aiAPI.checkSymptoms({ symptoms })
      setResult(data.data)
    } catch { toast.error('Analysis failed. Please try again.') }
    finally { setLoading(false) }
  }

  const severityColors = { emergency: 'bg-red-100 text-red-700 border-red-200', high: 'bg-orange-100 text-orange-700 border-orange-200', medium: 'bg-amber-100 text-amber-700 border-amber-200', low: 'bg-green-100 text-green-700 border-green-200' }
  const severityIcons = { emergency: '🚨', high: '⚠️', medium: '⚡', low: '✅' }

  return (
    <DashboardLayout title="AI Symptom Checker">
      <div className="max-w-3xl mx-auto">
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl">🧠</div>
            <div>
              <h2 className="font-bold text-secondary-900 dark:text-white">Symptom Checker</h2>
              <p className="text-secondary-500 text-sm">Enter your symptoms for an AI-powered health analysis</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Add Symptoms</label>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Type a symptom and press Enter..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} />
              <button onClick={() => input.trim() && addSymptom(input)} className="btn-primary px-4">Add</button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-secondary-500 mb-2">Common symptoms:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map(s => (
                <button key={s} onClick={() => addSymptom(s)} disabled={symptoms.includes(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${symptoms.includes(s) ? 'bg-primary-100 text-primary-600 border-primary-200 dark:bg-primary-900/30 dark:border-primary-700 cursor-default' : 'bg-secondary-50 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400 border-secondary-200 dark:border-secondary-600 hover:border-primary-400 hover:text-primary-600'}`}>
                  {symptoms.includes(s) ? '✓ ' : '+ '}{s}
                </button>
              ))}
            </div>
          </div>

          {symptoms.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">Selected symptoms:</p>
              <div className="flex flex-wrap gap-2">
                {symptoms.map(s => (
                  <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium">
                    {s}
                    <button onClick={() => removeSymptom(s)} className="text-primary-400 hover:text-primary-700 text-lg leading-none">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <button onClick={analyze} disabled={loading || symptoms.length === 0} className="btn-primary w-full py-3">
            {loading ? (
              <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing symptoms...</span>
            ) : 'Analyze Symptoms'}
          </button>
        </div>

        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Severity */}
            <div className={`p-4 rounded-xl border-2 ${severityColors[result.severity]}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{severityIcons[result.severity]}</span>
                <div>
                  <p className="font-bold capitalize">Severity Level: {result.severity}</p>
                  {result.shouldSeekEmergency && <p className="font-semibold text-red-700 mt-1">⚡ Please seek emergency medical care immediately!</p>}
                </div>
              </div>
            </div>

            {/* Possible conditions */}
            <div className="card p-6">
              <h3 className="font-bold text-secondary-900 dark:text-white mb-4">Possible Conditions</h3>
              <div className="space-y-3">
                {result.possibleConditions?.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-secondary-900 dark:text-white">{c.condition}</span>
                        <span className="text-sm font-bold text-primary-600">{c.probability}%</span>
                      </div>
                      <div className="w-full bg-secondary-100 dark:bg-secondary-700 rounded-full h-1.5">
                        <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${c.probability}%` }} />
                      </div>
                      {c.description && <p className="text-xs text-secondary-500 mt-1">{c.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="card p-6">
              <h3 className="font-bold text-secondary-900 dark:text-white mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {result.recommendations?.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-secondary-600 dark:text-secondary-400 text-sm">
                    <span className="text-primary-500 mt-0.5">→</span>{r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <span>⚠️</span>{result.disclaimer}
              </p>
            </div>

            <Link to="/patient/find-doctors" className="btn-primary w-full justify-center">Book Appointment with a Doctor →</Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
