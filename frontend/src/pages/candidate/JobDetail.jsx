import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BriefcaseIcon, CalendarIcon, UsersIcon } from '../../components/ui/icons'
import { jobsApi } from '../../services/jobsApi'

const TYPE_STYLE = {
  'Full-time':  { background: '#eff6ff', color: '#1d4ed8' },
  'Contract':   { background: '#fef3c7', color: '#92400e' },
  'Internship': { background: '#f0fdf4', color: '#166534' },
  'Part-time':  { background: '#fdf4ff', color: '#7e22ce' },
}

function daysAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

function BulletList({ items, color = '#6366f1' }) {
  if (!items || items.length === 0) return null
  return (
    <ul className="flex flex-col gap-2">
      {items.map((r, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
          {r}
        </li>
      ))}
    </ul>
  )
}

function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['jobs', id],
    queryFn: () => jobsApi.get(id),
    enabled: Boolean(id),
  })

  if (isLoading) {
    return (
      <div className="animate-pulse max-w-4xl mx-auto">
        <div className="h-4 bg-gray-100 rounded w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
                <div className="h-3 bg-gray-100 rounded mb-2" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-40" />
        </div>
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-sm font-medium text-gray-600">Job not found</p>
        <Link to="/candidate/jobs" className="mt-3 text-sm text-indigo-600 hover:underline">
          Back to job board
        </Link>
      </div>
    )
  }

  const jobId = job._id || job.id

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link to="/candidate/jobs" className="hover:text-indigo-600 transition-colors">Browse Jobs</Link>
        <span>/</span>
        <span className="text-gray-600">{job.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <BriefcaseIcon className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{job.department}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="text-xs text-gray-500">{job.location}</span>
                  {job.salary && <><span className="text-gray-200">|</span><span className="text-xs text-gray-500">{job.salary}</span></>}
                  <span className="text-gray-200">|</span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={TYPE_STYLE[job.type] || { background: '#f3f4f6', color: '#374151' }}
                  >
                    {job.type}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">The role</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{job.description}</p>
          </div>

          {job.requirements && job.requirements.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Requirements</h2>
              <BulletList items={job.requirements} color="#94a3b8" />
            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:sticky lg:top-20">
            <Link
              to={`/candidate/jobs/${jobId}/apply`}
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-3 rounded-xl transition-colors"
            >
              Apply now
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 w-full mt-3 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              Back to jobs
            </button>

            <div className="mt-5 pt-5 border-t border-gray-50 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-700">Posted</p>
                  <p className="text-xs text-gray-400">{daysAgo(job.createdAt || job.posted)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <UsersIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-700">Applicants</p>
                  <p className="text-xs text-gray-400">{job.applicationCount || 0} applied</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <BriefcaseIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-700">Department</p>
                  <p className="text-xs text-gray-400">{job.department}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default JobDetail
