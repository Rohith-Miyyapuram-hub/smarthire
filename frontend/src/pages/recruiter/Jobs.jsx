import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, BriefcaseIcon } from '../../components/ui/icons'
import { jobsApi } from '../../services/jobsApi'

const TABS = ['all', 'active', 'paused', 'draft', 'closed']

const STATUS_STYLE = {
  active: { bg: '#f0fdf4', color: '#166534', dot: '#22c55e' },
  paused: { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  draft:  { bg: '#f8fafc', color: '#475569', dot: '#94a3b8' },
  closed: { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444' },
}

function daysAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

function Jobs() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  const { data: jobs = [], isLoading, isError } = useQuery({
    queryKey: ['recruiter-jobs'],
    queryFn: () => jobsApi.list({ status: tab === 'all' ? undefined : tab }),
    refetchOnWindowFocus: false,
  })

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, status }) => jobsApi.update({ id, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] }),
  })

  const { mutate: deleteJob, isPending: deleteLoading } = useMutation({
    mutationFn: (id) => jobsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] })
      setDeleting(null)
    },
  })

  // Client-side filter for search + tab (server already filters by status when tab != 'all')
  const filtered = jobs.filter((j) => {
    const matchesTab = tab === 'all' || j.status === tab
    const matchesSearch = !search || j.title.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'all' ? jobs.length : jobs.filter(j => j.status === t).length
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Job Postings</h1>
          <p className="text-sm text-gray-400 mt-0.5">{jobs.length} total roles</p>
        </div>
        <Link
          to="/recruiter/jobs/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          New job
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
            style={
              tab === t
                ? { background: '#fff', color: '#1e1b4b', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
                : { color: '#6b7280' }
            }
          >
            {t}
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={tab === t ? { background: '#eef2ff', color: '#4f46e5' } : { background: '#e5e7eb', color: '#6b7280' }}
            >
              {counts[t] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" strokeWidth="1.75" />
          <path d="M21 21l-4.35-4.35" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Error */}
      {isError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          Could not load jobs. Make sure the backend is running.
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col divide-y divide-gray-50">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-100 rounded-xl shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="w-16 h-6 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
              <BriefcaseIcon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No jobs found</p>
            <Link to="/recruiter/jobs/new" className="mt-3 text-sm text-indigo-600 hover:underline">
              Post your first job
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {filtered.map((job) => {
              const st = STATUS_STYLE[job.status] || STATUS_STYLE.draft
              return (
                <div key={job._id} className="group flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <BriefcaseIcon className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {job.department} &middot; {job.location} &middot; Posted {daysAgo(job.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 hidden sm:flex">
                    <span>{job.applicationCount || 0} applicants</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ background: st.bg, color: st.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                    {job.status}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => navigate(`/recruiter/jobs/${job._id}/edit`)}
                      className="text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleStatus({ id: job._id, status: job.status === 'active' ? 'paused' : 'active' })}
                      className="text-xs text-gray-500 hover:text-amber-600 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      {job.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setDeleting(job)}
                      className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleting && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setDeleting(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 max-w-sm w-full">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Delete job?</h3>
              <p className="text-sm text-gray-500 mb-5">
                Are you sure you want to delete <span className="font-medium text-gray-700">{deleting.title}</span>? This cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => deleteJob(deleting._id)}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setDeleting(null)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Jobs
