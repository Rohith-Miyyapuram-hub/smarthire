import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BriefcaseIcon } from '../../components/ui/icons'
import { jobsApi } from '../../services/jobsApi'

const DEPARTMENTS = ['All', 'Engineering', 'Infrastructure', 'Design', 'AI/ML', 'Sales', 'HR']
const TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship']

function daysAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff} days ago`
}

const TYPE_STYLE = {
  'Full-time':  { background: '#eff6ff', color: '#1d4ed8' },
  'Contract':   { background: '#fef3c7', color: '#92400e' },
  'Internship': { background: '#f0fdf4', color: '#166534' },
  'Part-time':  { background: '#fdf4ff', color: '#7e22ce' },
}

function JobCard({ job }) {
  const tags = job.requirements || []
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <BriefcaseIcon className="w-5 h-5 text-indigo-500" />
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
          style={TYPE_STYLE[job.type] || { background: '#f3f4f6', color: '#374151' }}
        >
          {job.type}
        </span>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{job.title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{job.department}</p>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{job.description}</p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-gray-400">+{tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
        <div>
          <p className="text-xs text-gray-500">{job.location}</p>
          {job.salary && <p className="text-xs text-gray-400">{job.salary}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{daysAgo(job.createdAt || job.posted)}</span>
          <Link
            to={`/candidate/jobs/${job._id || job.id}`}
            className="text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 bg-gray-100 rounded-xl" />
        <div className="w-16 h-5 bg-gray-100 rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-3 bg-gray-100 rounded" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
      </div>
    </div>
  )
}

function JobBoard() {
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('All')
  const [type, setType] = useState('All')

  const { data: jobs = [], isLoading, isError } = useQuery({
    queryKey: ['jobs', 'active'],
    queryFn: () => jobsApi.list({ status: 'active' }),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return jobs.filter((j) => {
      const matchesSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        (j.department || '').toLowerCase().includes(q) ||
        (j.requirements || []).some((t) => t.toLowerCase().includes(q))
      const matchesDept = dept === 'All' || j.department === dept
      const matchesType = type === 'All' || j.type === type
      return matchesSearch && matchesDept && matchesType
    })
  }, [jobs, search, dept, type])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Open Positions</h1>
        <p className="text-sm text-gray-400 mt-1">
          {isLoading ? 'Loading...' : `${jobs.length} roles open at SmartHire`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="1.75" />
            <path d="M21 21l-4.35-4.35" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search roles, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        {!isLoading && (
          <span className="text-sm text-gray-400 ml-auto">
            {filtered.length} {filtered.length === 1 ? 'role' : 'roles'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm font-medium text-gray-600">Could not load jobs</p>
          <p className="text-xs text-gray-400 mt-1">Make sure the backend server is running on port 5000</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((job) => <JobCard key={job._id || job.id} job={job} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <BriefcaseIcon className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No roles match your filters</p>
          <button
            onClick={() => { setSearch(''); setDept('All'); setType('All') }}
            className="mt-4 text-sm text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

export default JobBoard
