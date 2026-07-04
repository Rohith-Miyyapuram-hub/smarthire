import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../../services/jobsApi'
import { aiApi } from '../../services/aiApi'

// ─── Regex bias engine (instant, no API cost) ─────────────────────────────────

const BIAS_PATTERNS = [
  { regex: /\b(ninja|rockstar|guru|wizard|superhero|unicorn)\b/gi, type: 'jargon',      level: 'error',   suggestion: 'Use "experienced engineer" or "skilled developer"',          why: 'Informal masculine-coded terms exclude many candidates' },
  { regex: /\b(young|energetic|digital native|fresh graduate only)\b/gi, type: 'age',   level: 'error',   suggestion: 'Describe the skill level needed, not age',                    why: 'Age-related language is discriminatory' },
  { regex: /\b(he|him|his|she|her|hers)\b/gi,                           type: 'gender', level: 'error',   suggestion: 'Use "they/them" or rewrite without pronouns',                 why: 'Gendered pronouns exclude non-binary candidates' },
  { regex: /\b(strong|aggressive|dominate|competitive|killer)\b/gi,     type: 'coded',  level: 'warning', suggestion: 'Try "collaborative", "high-impact", or "results-driven"',     why: 'Research shows masculine-coded words lower female applicant rates' },
  { regex: /\b(must have \d+ years|requires? \d+ years)\b/gi,           type: 'exp',    level: 'warning', suggestion: 'State the skills needed, not specific years',                  why: 'Hard year requirements filter out talented career-changers' },
  { regex: /\b(native speaker|born in|citizen only|local only)\b/gi,    type: 'origin', level: 'error',   suggestion: 'State required language proficiency level instead',            why: 'Nationality/origin requirements are often illegal and exclude talent' },
  { regex: /\b(fast-paced|hustle|work hard play hard|always on)\b/gi,   type: 'culture',level: 'warning', suggestion: 'Describe culture with specific behaviors, not coded phrases',  why: 'These phrases signal poor work-life balance and deter caregivers' },
]

function checkBiasRegex(text) {
  const flags = []
  const seen = new Set()
  BIAS_PATTERNS.forEach(({ regex, type, level, suggestion, why }) => {
    const matches = [...text.matchAll(regex)]
    matches.forEach(m => {
      const key = `${type}-${m[0].toLowerCase()}`
      if (!seen.has(key)) {
        seen.add(key)
        flags.push({ type, level, match: m[0], suggestion, why })
      }
    })
  })
  return flags
}

// ─── Tag input ────────────────────────────────────────────────────────────────

function TagInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  function addTag(tag) {
    const t = tag.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className="min-h-[42px] flex flex-wrap gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl cursor-text focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, i) => (
        <span key={i} className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-indigo-400 hover:text-indigo-700 leading-none">x</button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addTag(input)}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder-gray-400"
      />
    </div>
  )
}

// ─── Bias checker sidebar ─────────────────────────────────────────────────────

function BiasCheckerSidebar({ description, title, requirements }) {
  const [mode, setMode]           = useState('regex')   // 'regex' | 'ai'
  const [aiResult, setAiResult]   = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState(null)

  // Instant regex flags (always computed)
  const regexFlags = checkBiasRegex(description)
  const errors     = regexFlags.filter(f => f.level === 'error').length
  const warnings   = regexFlags.filter(f => f.level === 'warning').length
  const regexScore = Math.max(0, 100 - errors * 20 - warnings * 10)

  // Use AI result score if available
  const score      = mode === 'ai' && aiResult ? aiResult.score : regexScore
  const flags      = mode === 'ai' && aiResult ? aiResult.flags : regexFlags
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'

  async function runAiAnalysis() {
    if (!description.trim() || description.trim().length < 30) {
      setAiError('Write at least a sentence or two before running AI analysis.')
      return
    }
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await aiApi.analyzeJD({ description, title, requirements })
      setAiResult(result)
      setMode('ai')
    } catch (err) {
      setAiError(err.response?.data?.message || 'AI analysis failed. Check your OpenAI API key in backend/.env')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-900">Inclusivity score</h3>
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('regex')}
            className="text-xs px-2 py-1 rounded-md transition-colors"
            style={mode === 'regex' ? { background: '#fff', color: '#4f46e5', fontWeight: 600 } : { color: '#6b7280' }}
          >
            Quick
          </button>
          <button
            type="button"
            onClick={mode === 'ai' ? () => setMode('ai') : runAiAnalysis}
            className="text-xs px-2 py-1 rounded-md transition-colors"
            style={mode === 'ai' ? { background: '#fff', color: '#4f46e5', fontWeight: 600 } : { color: '#6b7280' }}
          >
            AI
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        {mode === 'regex' ? 'Pattern-based. Switch to AI for deeper analysis.' : 'GPT-4o analysis active.'}
      </p>

      {/* Score */}
      <div className="flex items-end gap-2 mb-2">
        <span className="text-3xl font-bold" style={{ color: scoreColor }}>{score}</span>
        <span className="text-sm text-gray-400 mb-0.5">/100</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full mb-5">
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${score}%`, background: scoreColor }} />
      </div>

      {/* AI loading */}
      {aiLoading && (
        <div className="flex items-center gap-2 text-indigo-600 mb-3">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
          <span className="text-xs">Analyzing with GPT-4o...</span>
        </div>
      )}

      {/* AI error */}
      {aiError && <p className="text-xs text-red-500 mb-3">{aiError}</p>}

      {/* AI extras */}
      {mode === 'ai' && aiResult && (
        <>
          {aiResult.overallFeedback && (
            <div className="bg-indigo-50 rounded-xl p-3 mb-3">
              <p className="text-xs font-semibold text-indigo-700 mb-1">AI feedback</p>
              <p className="text-xs text-indigo-600 leading-relaxed">{aiResult.overallFeedback}</p>
            </div>
          )}
          {aiResult.missingElements && aiResult.missingElements.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Missing elements</p>
              <div className="flex flex-wrap gap-1">
                {aiResult.missingElements.map((el, i) => (
                  <span key={i} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{el}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Flags */}
      {flags.length === 0 ? (
        <div className="flex items-center gap-2 text-green-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-medium">No issues detected</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {flags.slice(0, 6).map((flag, i) => (
            <div
              key={i}
              className="rounded-xl p-3 flex flex-col gap-1"
              style={{
                background: flag.level === 'error' ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${flag.level === 'error' ? '#fecaca' : '#fde68a'}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: flag.level === 'error' ? '#991b1b' : '#92400e' }}>
                  "{flag.text || flag.match}"
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full capitalize" style={{ background: flag.level === 'error' ? '#fee2e2' : '#fef3c7', color: flag.level === 'error' ? '#b91c1c' : '#b45309' }}>
                  {flag.level}
                </span>
              </div>
              <p className="text-xs text-gray-500">{flag.why}</p>
              <p className="text-xs font-medium text-gray-700">Try: {flag.suggestion}</p>
            </div>
          ))}
        </div>
      )}

      {/* AI analyse button (when in regex mode) */}
      {mode === 'regex' && !aiLoading && (
        <button
          type="button"
          onClick={runAiAnalysis}
          className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-medium text-indigo-600 border border-indigo-200 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Analyze with GPT-4o
        </button>
      )}
    </div>
  )
}

// ─── Main form page ───────────────────────────────────────────────────────────

function JobForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    title: '', department: '', location: '', type: 'Full-time',
    salary: '', description: '', requirements: [], status: 'active',
  })

  const { data: existingJob } = useQuery({
    queryKey: ['jobs', id],
    queryFn: () => jobsApi.get(id),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existingJob) {
      setForm({
        title: existingJob.title || '',
        department: existingJob.department || '',
        location: existingJob.location || '',
        type: existingJob.type || 'Full-time',
        salary: existingJob.salary || '',
        description: existingJob.description || '',
        requirements: existingJob.requirements || [],
        status: existingJob.status || 'active',
      })
    }
  }, [existingJob])

  const { mutate, isPending, error: apiError } = useMutation({
    mutationFn: (data) =>
      isEdit ? jobsApi.update({ id, ...data }) : jobsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] })
      navigate('/recruiter/jobs')
    },
  })

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.department || !form.location || !form.description) return
    mutate(form)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/recruiter/jobs" className="text-sm text-gray-400 hover:text-indigo-600 transition-colors">Jobs</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">{isEdit ? 'Edit job' : 'Post new job'}</h1>
      </div>

      {apiError && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {apiError.response?.data?.message || 'Failed to save job. Please try again.'}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-5 gap-6">

          {/* Main form */}
          <div className="col-span-3 flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-gray-900">Job details</h2>
              <FieldRow label="Job title" required>
                <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Senior React Developer" className="input" required />
              </FieldRow>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Department" required>
                  <input value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="Engineering" className="input" required />
                </FieldRow>
                <FieldRow label="Location" required>
                  <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Remote" className="input" required />
                </FieldRow>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Type">
                  <select value={form.type} onChange={(e) => set('type', e.target.value)} className="input">
                    {['Full-time','Part-time','Contract','Internship'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </FieldRow>
                <FieldRow label="Salary range">
                  <input value={form.salary} onChange={(e) => set('salary', e.target.value)} placeholder="$80k - $120k" className="input" />
                </FieldRow>
              </div>
              <FieldRow label="Status">
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input">
                  {['active','draft','paused','closed'].map(s => <option key={s}>{s}</option>)}
                </select>
              </FieldRow>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-gray-900">Description</h2>
              <FieldRow label="Job description" required hint="Instant bias check below. Use AI tab for deeper analysis">
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe the role, team, and what success looks like..."
                  rows={8}
                  className="input resize-none"
                  required
                />
              </FieldRow>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-gray-900">Requirements</h2>
              <FieldRow label="Requirements" hint="Press Enter or comma to add">
                <TagInput
                  value={form.requirements}
                  onChange={(v) => set('requirements', v)}
                  placeholder="e.g. React, TypeScript, 3+ years experience..."
                />
              </FieldRow>
            </div>

            <div className="flex items-center justify-between">
              <Link to="/recruiter/jobs" className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isPending}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
              >
                {isPending ? 'Saving...' : isEdit ? 'Save changes' : 'Post job'}
              </button>
            </div>
          </div>

          {/* Bias checker sidebar */}
          <div className="col-span-2">
            <BiasCheckerSidebar
              description={form.description}
              title={form.title}
              requirements={form.requirements}
            />
          </div>

        </div>
      </form>
    </div>
  )
}

function FieldRow({ label, required, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-700">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="font-normal text-gray-400 ml-1.5">({hint})</span>}
      </label>
      {children}
    </div>
  )
}

export default JobForm
