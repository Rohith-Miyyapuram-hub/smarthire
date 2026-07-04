import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BriefcaseIcon, CalendarIcon } from '../../components/ui/icons'
import { applicationsApi } from '../../services/applicationsApi'

const STAGE_ORDER = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected']

const STAGE_STYLE = {
  Applied:   { bg: '#f1f5f9', color: '#475569' },
  Screening: { bg: '#eff6ff', color: '#1d4ed8' },
  Interview: { bg: '#fef3c7', color: '#92400e' },
  Offer:     { bg: '#f0fdf4', color: '#166534' },
  Rejected:  { bg: '#fef2f2', color: '#991b1b' },
}

const STAGE_DOT = {
  Applied:   '#94a3b8',
  Screening: '#3b82f6',
  Interview: '#f59e0b',
  Offer:     '#22c55e',
  Rejected:  '#ef4444',
}

function daysAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff} days ago`
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Timeline({ events }) {
  return (
    <div className="flex flex-col gap-0">
      {events.map((ev, i) => {
        const isLast = i === events.length - 1
        return (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" style={{ background: STAGE_DOT[ev.stage] || '#94a3b8' }} />
              {!isLast && <div className="w-0.5 h-5 bg-gray-100 my-0.5" />}
            </div>
            <div className="pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-700">{ev.stage}</span>
                <span className="text-xs text-gray-400">{formatDate(ev.movedAt || ev.date)}</span>
              </div>
              {ev.note && <p className="text-xs text-gray-500 mt-0.5">{ev.note}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ApplicationCard({ app }) {
  const [expanded, setExpanded] = useState(false)
  const stage = app.stage || 'Applied'
  const style = STAGE_STYLE[stage] || STAGE_STYLE.Applied
  const job = app.job || {}
  const history = app.stageHistory || []

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
          <BriefcaseIcon className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{job.title || 'Unknown job'}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{job.department || ''}</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ background: style.bg, color: style.color }}>
              {stage}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <CalendarIcon className="w-3.5 h-3.5" />
              Applied {daysAgo(app.createdAt)}
            </div>
            {job._id && (
              <Link to={`/candidate/jobs/${job._id}`} className="text-xs text-indigo-600 hover:underline">
                View job
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-1">
          {STAGE_ORDER.filter(s => s !== 'Rejected').map((s) => {
            const stageIdx = STAGE_ORDER.indexOf(stage)
            const thisIdx  = STAGE_ORDER.indexOf(s)
            const isRejected = stage === 'Rejected'
            const filled = !isRejected && thisIdx <= stageIdx
            return (
              <div key={s} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-1.5 rounded-full transition-colors" style={{ background: filled ? '#4f46e5' : '#e5e7eb' }} />
                <span className="text-xs text-gray-400 hidden sm:block">{s}</span>
              </div>
            )
          })}
        </div>
        {stage === 'Rejected' && (
          <p className="text-xs text-red-500 mt-2">This application was not moved forward.</p>
        )}
      </div>

      {history.length > 0 && (
        <div className="border-t border-gray-50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
          >
            <span>Activity timeline</span>
            <svg className="w-4 h-4 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {expanded && (
            <div className="px-5 pb-5 pt-1">
              <Timeline events={history} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MyApplications() {
  const { data: applications = [], isLoading, isError } = useQuery({
    queryKey: ['applications', 'mine'],
    queryFn: () => applicationsApi.list(),
  })

  const active   = applications.filter(a => a.stage !== 'Rejected')
  const rejected = applications.filter(a => a.stage === 'Rejected')

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-7 bg-gray-100 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-32 mb-8" />
        {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 mb-4" />)}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-sm text-gray-400 mt-1">{applications.length} applications total</p>
        </div>
        <Link to="/candidate/jobs" className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-colors">
          Browse jobs
        </Link>
      </div>

      {isError && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          Could not load applications. Make sure the backend is running.
        </div>
      )}

      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Active ({active.length})</h2>
          <div className="flex flex-col gap-4">{active.map(app => <ApplicationCard key={app._id} app={app} />)}</div>
        </div>
      )}

      {rejected.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Not moving forward ({rejected.length})</h2>
          <div className="flex flex-col gap-4">{rejected.map(app => <ApplicationCard key={app._id} app={app} />)}</div>
        </div>
      )}

      {!isLoading && applications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <BriefcaseIcon className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No applications yet</p>
          <Link to="/candidate/jobs" className="mt-4 text-sm font-medium text-indigo-600 hover:underline">Browse jobs</Link>
        </div>
      )}
    </div>
  )
}

export default MyApplications
