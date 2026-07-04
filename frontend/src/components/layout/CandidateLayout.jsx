import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { BriefcaseIcon, FileTextIcon, LogOutIcon } from '../ui/icons'

function CandidateLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'C'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top navigation bar */}
      <header className="bg-white border-b border-gray-100 shrink-0 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <BriefcaseIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">SmartHire</span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            <NavLink
              to="/candidate/jobs"
              className={({ isActive }) =>
                [
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50',
                ].join(' ')
              }
            >
              <BriefcaseIcon className="w-4 h-4" />
              Browse Jobs
            </NavLink>
            <NavLink
              to="/candidate/applications"
              className={({ isActive }) =>
                [
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50',
                ].join(' ')
              }
            >
              <FileTextIcon className="w-4 h-4" />
              My Applications
            </NavLink>
          </nav>

          {/* User area */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name || 'Candidate'}</p>
              <p className="text-xs text-gray-400 leading-tight">{user?.email || ''}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold shrink-0">
              {initials}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Sign out"
            >
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <Outlet />
      </main>

    </div>
  )
}

export default CandidateLayout
