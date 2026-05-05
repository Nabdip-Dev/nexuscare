// HealthRisk.jsx
import { useState } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { aiAPI } from '../../services/api'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function HealthRisk() {
  const [form, setForm] = useState({ age: '', weight: '', height: '', bloodPressure: '', bloodSugar: '', cholesterol: '', smokingStatus: 'never', exerciseFrequency: 'sometimes', familyHistory: [] })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const analyze = async (e) => {
    e.preventDefault()
    if (!form.age) return toast.error('Please enter your age')
    setLoading(true)
    try {
      const { data } = await aiAPI.analyzeHealthRisk({ ...form, age: Number(form.age), weight: form.weight ? Number(form.weight) : undefined, height: form.height ? Number(form.height) : undefined, bloodSugar: form.bloodSugar ? Number(form.bloodSugar) : undefined })
      setResult(data.data)
    } catch { toast.error('Analysis failed') }
    finally { setLoading(false) }
  }

  const riskColors = { low: { bar: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' }, medium: { bar: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' }, high: { bar: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' } }

  return (
    <DashboardLayout title="Health Risk Analysis">
      <div className="max-w-3xl mx-auto">
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl">📊</div>
            <div>
              <h2 className="font-bold text-secondary-900 dark:text-white">Health Risk Calculator</h2>
              <p className="text-secondary-500 text-sm">Enter your health parameters for a risk assessment</p>
            </div>
          </div>
          <form onSubmit={analyze} className="grid grid-cols-2 gap-4">
            {[['age', 'Age', 'text', 'Years'], ['weight', 'Weight (kg)', 'number', 'e.g. 75'], ['height', 'Height (cm)', 'number', 'e.g. 175'], ['bloodSugar', 'Blood Sugar (mg/dL)', 'number', 'e.g. 95'], ['bloodPressure', 'Blood Pressure', 'text', '120/80'], ['cholesterol', 'Cholesterol (mg/dL)', 'number', 'e.g. 180']].map(([key, label, type, ph]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input type={type} className="input" placeholder={ph} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="label">Smoking Status</label>
              <select className="input" value={form.smokingStatus} onChange={e => setForm(p => ({ ...p, smokingStatus: e.target.value }))}>
                <option value="never">Never smoked</option>
                <option value="former">Former smoker</option>
                <option value="current">Current smoker</option>
              </select>
            </div>
            <div>
              <label className="label">Exercise Frequency</label>
              <select className="input" value={form.exerciseFrequency} onChange={e => setForm(p => ({ ...p, exerciseFrequency: e.target.value }))}>
                <option value="daily">Daily</option>
                <option value="sometimes">3-4x/week</option>
                <option value="rarely">Rarely</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Family History</label>
              <div className="flex flex-wrap gap-2">
                {['heart_disease', 'diabetes', 'hypertension', 'cancer', 'stroke'].map(c => (
                  <button type="button" key={c} onClick={() => setForm(p => ({ ...p, familyHistory: p.familyHistory.includes(c) ? p.familyHistory.filter(x => x !== c) : [...p.familyHistory, c] }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.familyHistory.includes(c) ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700' : 'bg-secondary-50 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400 border-secondary-200 dark:border-secondary-600'}`}>
                    {c.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</span> : 'Analyze Health Risk'}
              </button>
            </div>
          </form>
        </div>

        {result && (
          <div className="space-y-4 animate-fade-in">
            <div className={`p-5 rounded-2xl border-2 ${riskColors[result.riskLevel]?.bg} ${riskColors[result.riskLevel]?.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-secondary-500">Overall Risk Score</p>
                  <p className={`text-4xl font-bold ${riskColors[result.riskLevel]?.text}`}>{result.riskScore}/100</p>
                </div>
                <div className={`px-4 py-2 rounded-xl font-bold capitalize ${riskColors[result.riskLevel]?.bg} ${riskColors[result.riskLevel]?.text}`}>
                  {result.riskLevel} risk
                </div>
              </div>
              <div className="w-full bg-white/50 dark:bg-black/20 rounded-full h-3">
                <div className={`${riskColors[result.riskLevel]?.bar} h-3 rounded-full transition-all`} style={{ width: `${result.riskScore}%` }} />
              </div>
            </div>
            {result.riskFactors?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-bold text-secondary-900 dark:text-white mb-3">Risk Factors Identified</h3>
                <div className="space-y-2">
                  {result.riskFactors.map((rf, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-xl">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rf.severity === 'high' ? 'bg-red-500' : rf.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
                      <span className="font-medium text-sm text-secondary-800 dark:text-secondary-200 flex-1">{rf.factor}</span>
                      <span className="text-xs text-secondary-500">{rf.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="card p-5">
              <h3 className="font-bold text-secondary-900 dark:text-white mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {result.recommendations?.map((r, i) => <li key={i} className="flex items-start gap-2 text-sm text-secondary-600 dark:text-secondary-400"><span className="text-primary-500 mt-0.5">→</span>{r}</li>)}
              </ul>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">⚠️ {result.disclaimer}</p>
            </div>
            <Link to="/patient/find-doctors" className="btn-primary w-full justify-center">Consult a Doctor →</Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
