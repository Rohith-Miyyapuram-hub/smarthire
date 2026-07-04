import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import {
  DashboardIcon, BriefcaseIcon, PipelineIcon,
  ChartIcon, SettingsIcon, BellIcon, LogOutIcon,
} from '../ui/icons'

// Navigation items for the sidebar
// `end: true` means only match exactly /recruiter (not /recruiter/jobs etc.)
const NAV_ITEMS = [
  { to: '/recruiter',           end: true,  label: 'Dashboard', Icon: DashboardIcon },
  { to: '/recruiter/jobs',      end: false, label: 'Jobs',       Icon: BriefcaseIcon },
  { to: '/recruiter/pipeline',  end: false, label: 'Pipeline',   Icon: PipelineIcon  },
  { to: '/recruiter/analytics', end: false, label: 'Analytics',  Icon: ChartIcon     },
  { to: '/recruiter/settings',  end: false, label: 'Settings',   Icon: SettingsIcon  },
]

function RecruiterLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Generate initials from name (e.g. "Rohit M" -> "RM")
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0">

        {/* Brand */}
        <div className="px-5 h-14 flex items-center border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <BriefcaseIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">SmartHire</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
              Beta
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, end, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all select-none',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 border-t border-gray-100 pt-3 shrink-0">
          <div className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-default">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold shrink-0">
              {initials}
            </div>
            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate leading-tight">
                {user?.name || 'Recruiter'}
              </p>
              <p className="text-xs text-gray-400 truncate leading-tight">
                {user?.email || ''}
              </p>
            </div>
            {/* Logout — appears on hover */}
            <button
              onClick={handleLogout}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
              title="Sign out"
            >
              <LogOutIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          {/* Left — breadcrumb placeholder (Phase 3+ will populate this) */}
          <div />

          {/* Right — actions */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
              <BellIcon className="w-4.5 h-4.5" />
              {/* Red dot — unread indicator */}
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold cursor-default">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content — Outlet renders the child route here */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

    </div>
  )
}

export default RecruiterLayout
