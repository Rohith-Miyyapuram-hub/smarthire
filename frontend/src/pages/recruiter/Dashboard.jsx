import {
  BriefcaseIcon, UsersIcon, CalendarIcon, CheckCircleIcon,
  TrendUpIcon, TrendDownIcon, PlusIcon, ChevronRightIcon,
  FileTextIcon, PipelineIcon,
} from '../../components/ui/icons'
import { Link } from 'react-router-dom'

// ─── Mock data (replaced with real API data in Phase 6) ─────────────────────

const METRICS = [
  {
    label: 'Open Jobs',
    value: 8,
    change: '+2 this week',
    up: true,
    Icon: BriefcaseIcon,
    color: 'indigo',
  },
  {
    label: 'Total Applications',
    value: 124,
    change: '+18 this week',
    up: true,
    Icon: UsersIcon,
    color: 'violet',
  },
  {
    label: 'Interviews This Week',
    value: 6,
    change: '1 fewer than last week',
    up: false,
    Icon: CalendarIcon,
    color: 'amber',
  },
  {
    label: 'Hired This Month',
    value: 3,
    change: '+1 from last month',
    up: true,
    Icon: CheckCircleIcon,
    color: 'green',
  },
]

const ACTIVITY = [
  {
    id: 1,
    text: 'Sarah Chen applied for Senior React Developer',
    time: '2h ago',
    type: 'application',
    initials: 'SC',
  },
  {
    id: 2,
    text: 'Interview scheduled with Marcus Johnson for DevOps Lead',
    time: '4h ago',
    type: 'interview',
    initials: 'MJ',
  },
  {
    id: 3,
    text: "Job posting 'Product Designer' was published",
    time: '6h ago',
    type: 'job',
    initials: 'PD',
  },
  {
    id: 4,
    text: 'Alex Kumar moved to offer stage for Backend Engineer',
    time: '1d ago',
    type: 'stage',
    initials: 'AK',
  },
  {
    id: 5,
    text: 'Priya Patel applied for Full Stack Developer',
    time: '1d ago',
    type: 'application',
    initials: 'PP',
  },
  {
    id: 6,
    text: 'Interview feedback added for Tom Wilson',
    time: '2d ago',
    type: 'feedback',
    initials: 'TW',
  },
]

const OPEN_JOBS = [
  { id: 1, title: 'Senior React Developer', applications: 28, stage: 'Interviewing' },
  { id: 2, title: 'DevOps Lead',            applications: 14, stage: 'Screening'    },
  { id: 3, title: 'Product Designer',       applications: 31, stage: 'Applied'      },
  { id: 4, title: 'Backend Engineer',       applications: 19, stage: 'Offer'        },
]

// ─── Color maps ─────────────────────────────────────────────────────────────

const COLOR = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'text-indigo-500' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'text-violet-500' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  icon: 'text-amber-500'  },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  icon: 'text-green-500'  },
}

const ACTIVITY_COLOR = {
  application: 'bg-indigo-100 text-indigo-700',
  interview:   'bg-amber-100  text-amber-700',
  job:         'bg-green-100  text-green-700',
  stage:       'bg-violet-100 text-violet-700',
  feedback:    'bg-gray-100   text-gray-600',
}

const STAGE_COLOR = {
  Applied:      'bg-gray-100    text-gray-600',
  Screening:    'bg-blue-100    text-blue-700',
  Interviewing: 'bg-amber-100   text-amber-700',
  Offer:        'bg-green-100   text-green-700',
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MetricCard({ label, value, change, up, Icon, color }) {
  const c = COLOR[color]
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {up
          ? <TrendUpIcon className="w-3.5 h-3.5 text-green-500 shrink-0" />
          : <TrendDownIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
        }
        <span className={`text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
          {change}
        </span>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

function Dashboard() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="max-w-6xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{today}</p>
        </div>
        <Link
          to="/recruiter/jobs"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Post a job
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        {METRICS.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Bottom section — two columns */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* Recent activity — wider column */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent activity</h2>
            <button className="text-xs text-indigo-600 hover:underline">View all</button>
          </div>
          <div className="flex flex-col gap-0.5">
            {ACTIVITY.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
              >
                {/* Avatar circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 ${ACTIVITY_COLOR[item.type]}`}>
                  {item.initials}
                </div>
                {/* Text + time */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open jobs — narrower column */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Open jobs</h2>
            <Link to="/recruiter/jobs" className="text-xs text-indigo-600 hover:underline">
              Manage
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            {OPEN_JOBS.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer group transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <BriefcaseIcon className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{job.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{job.applications} applicants</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${STAGE_COLOR[job.stage]}`}>
                      {job.stage}
                    </span>
                  </div>
                </div>
                <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-1">
            <Link
              to="/recruiter/pipeline"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <PipelineIcon className="w-4 h-4 text-gray-400" />
              View candidate pipeline
            </Link>
            <Link
              to="/recruiter/analytics"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <FileTextIcon className="w-4 h-4 text-gray-400" />
              Hiring analytics
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard
