import { useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import useAuthStore from '../../store/authStore'
import { jobsApi } from '../../services/jobsApi'
import { applicationsApi } from '../../services/applicationsApi'
import { aiApi } from '../../services/aiApi'

const STEPS = ['Personal Info', 'Resume', 'Cover Letter']

function StepPersonal({ form, onChange }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First name" required>
          <input type="text" value={form.firstName} onChange={(e) => onChange('firstName', e.target.value)} placeholder="Rohit" className="input" />
        </Field>
        <Field label="Last name" required>
          <input type="text" value={form.lastName} onChange={(e) => onChange('lastName', e.target.value)} placeholder="Miyyapuram" className="input" />
        </Field>
      </div>
      <Field label="Email" required>
        <input type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} placeholder="you@example.com" className="input" />
      </Field>
      <Field label="Phone">
        <input type="tel" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="+91 98765 43210" className="input" />
      </Field>
      <Field label="LinkedIn profile URL">
        <input type="url" value={form.linkedin} onChange={(e) => onChange('linkedin', e.target.value)} placeholder="https://linkedin.com/in/your-profile" className="input" />
      </Field>
      <Field label="Portfolio / GitHub URL">
        <input type="url" value={form.portfolio} onChange={(e) => onChange('portfolio', e.target.value)} placeholder="https://github.com/your-handle" className="input" />
      </Field>
      <Field label="Years of experience" required>
        <select value={form.experience} onChange={(e) => onChange('experience', e.target.value)} className="input">
          <option value="">Select...</option>
          <option>Less than 1 year</option>
          <option>1-2 years</option>
          <option>3-5 years</option>
          <option>5-8 years</option>
          <option>8+ years</option>
        </select>
      </Field>
    </div>
  )
}

function StepResume({ form, onChange }) {
  const fileRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    onChange('resumeFile', file)
    onChange('resumeName', file.name)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    onChange('resumeFile', file)
    onChange('resumeName', file.name)
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
      >
        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">{form.resumeName ? form.resumeName : 'Drop your resume here'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{form.resumeName ? 'Click to change file' : 'PDF, DOCX up to 5MB'}</p>
        </div>
        {form.resumeName
          ? <span className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">Ready to upload</span>
          : <button type="button" className="text-xs font-medium text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors">Browse files</button>
        }
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFile} />
      </div>
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-xs font-medium text-amber-800 mb-1.5">Resume tips</p>
        <ul className="flex flex-col gap-1">
          {['Keep it 1-2 pages', 'Use clear section headers', 'Quantify achievements (e.g. "reduced load time 40%")', 'PDF format preserves formatting'].map(tip => (
            <li key={tip} className="flex items-start gap-2 text-xs text-amber-700">
              <span className="w-1 h-1 bg-amber-400 rounded-full mt-1.5 shrink-0" />{tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StepCoverLetter({ form, onChange, jobTitle }) {
  const wordCount = form.coverLetter.trim() ? form.coverLetter.trim().split(/\s+/).length : 0
  return (
    <div className="flex flex-col gap-5">
      <Field label="Cover letter" hint="Optional but recommended">
        <textarea
          value={form.coverLetter}
          onChange={(e) => onChange('coverLetter', e.target.value)}
          placeholder={`Tell us why you are excited about the ${jobTitle} role...`}
          rows={8}
          className="input resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{wordCount} words</p>
      </Field>
      <Field label="How did you hear about this role?">
        <select value={form.source} onChange={(e) => onChange('source', e.target.value)} className="input">
          <option value="">Select...</option>
          <option>LinkedIn</option>
          <option>Company website</option>
          <option>Referral from employee</option>
          <option>Job board</option>
          <option>Twitter / X</option>
          <option>Other</option>
        </select>
      </Field>
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
        <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Review your application</p>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Name',       value: `${form.firstName} ${form.lastName}`.trim() || '--' },
            { label: 'Email',      value: form.email || '--'                                   },
            { label: 'Experience', value: form.experience || '--'                              },
            { label: 'Resume',     value: form.resumeName || 'Not uploaded'                    },
            { label: 'LinkedIn',   value: form.linkedin || '--'                                },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <span className="w-24 text-gray-400 shrink-0">{label}</span>
              <span className="text-gray-700 font-medium truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, hint, children }) {
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

function StepIndicator({ current, labels }) {
  return (
    <div className="flex items-center gap-0">
      {labels.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors"
                style={{ background: done || active ? '#4f46e5' : '#f3f4f6', color: done || active ? '#fff' : '#9ca3af' }}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : step}
              </div>
              <span className="text-xs font-medium" style={{ color: active ? '#4f46e5' : '#9ca3af' }}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors" style={{ background: done ? '#4f46e5' : '#e5e7eb' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  )
}

function ApplyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)

  const { data: job } = useQuery({
    queryKey: ['jobs', id],
    queryFn: () => jobsApi.get(id),
    enabled: Boolean(id),
  })

  const jobTitle = job?.title || 'this role'

  const [form, setForm] = useState({
    firstName:   user?.name?.split(' ')[0] || '',
    lastName:    user?.name?.split(' ').slice(1).join(' ') || '',
    email:       user?.email || '',
    phone:       '',
    linkedin:    '',
    portfolio:   '',
    experience:  '',
    resumeFile:  null,
    resumeName:  '',
    coverLetter: '',
    source:      '',
  })

  function onChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function canAdvance() {
    if (step === 1) return form.firstName && form.lastName && form.email && form.experience
    if (step === 2) return Boolean(form.resumeName)
    return true
  }

  const { mutate, isPending, error: apiError } = useMutation({
    mutationFn: (fd) => applicationsApi.submit(fd),
    onSuccess: (application) => {
      if (application?._id) {
        aiApi.rankCandidate(application._id).catch(() => {})
      }
      setSubmitted(true)
    },
  })

  function handleSubmit() {
    const fd = new FormData()
    fd.append('jobId', id)
    fd.append('firstName', form.firstName)
    fd.append('lastName', form.lastName)
    fd.append('email', form.email)
    fd.append('phone', form.phone)
    fd.append('linkedin', form.linkedin)
    fd.append('portfolio', form.portfolio)
    fd.append('experience', form.experience)
    fd.append('coverLetter', form.coverLetter)
    fd.append('source', form.source)
    if (form.resumeFile) fd.append('resume', form.resumeFile)
    mutate(fd)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Application submitted!</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          You applied for <span className="font-medium text-gray-700">{jobTitle}</span>.
          Our AI is scoring your application now. The team will be in touch within 5 business days.
        </p>
        <div className="flex items-center gap-3 mt-8">
          <Link to="/candidate/applications" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
            View my applications
          </Link>
          <Link to="/candidate/jobs" className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
            Browse more jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <Link to="/candidate/jobs" className="hover:text-indigo-600 transition-colors">Jobs</Link>
          <span>/</span>
          <Link to={`/candidate/jobs/${id}`} className="hover:text-indigo-600 transition-colors">{jobTitle}</Link>
          <span>/</span>
          <span className="text-gray-600">Apply</span>
        </nav>
        <h1 className="text-xl font-bold text-gray-900">Apply for {jobTitle}</h1>
        <p className="text-sm text-gray-400 mt-0.5">Takes about 5 minutes</p>
      </div>

      <div className="mb-8">
        <StepIndicator current={step} labels={STEPS} />
      </div>

      {apiError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {apiError.response?.data?.message || 'Failed to submit application. Please try again.'}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">Step {step}: {STEPS[step - 1]}</h2>
        {step === 1 && <StepPersonal form={form} onChange={onChange} />}
        {step === 2 && <StepResume form={form} onChange={onChange} />}
        {step === 3 && <StepCoverLetter form={form} onChange={onChange} jobTitle={jobTitle} />}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
          className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          {step > 1 ? 'Back' : 'Cancel'}
        </button>
        {step < STEPS.length ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            {isPending ? <><Spinner />Submitting...</> : 'Submit application'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ApplyForm
