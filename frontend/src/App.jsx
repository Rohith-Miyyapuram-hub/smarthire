import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ProtectedRoute from './components/layout/ProtectedRoute'
import RecruiterLayout from './components/layout/RecruiterLayout'
import CandidateLayout from './components/layout/CandidateLayout'
import Dashboard from './pages/recruiter/Dashboard'
import Jobs from './pages/recruiter/Jobs'
import JobForm from './pages/recruiter/JobForm'
import Pipeline from './pages/recruiter/Pipeline'
import JobBoard from './pages/candidate/JobBoard'
import JobDetail from './pages/candidate/JobDetail'
import ApplyForm from './pages/candidate/ApplyForm'
import MyApplications from './pages/candidate/MyApplications'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Recruiter portal - nested routing */}
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <RecruiterLayout />
            </ProtectedRoute>
          }
        >
          <Route index                element={<Dashboard />} />
          <Route path="jobs"          element={<Jobs />} />
          <Route path="jobs/new"      element={<JobForm />} />
          <Route path="jobs/:id/edit" element={<JobForm />} />
          <Route path="pipeline"      element={<Pipeline />} />
          <Route path="analytics"     element={<ComingSoon label="Analytics - Phase 8" />} />
          <Route path="settings"      element={<ComingSoon label="Settings - Phase 8" />} />
        </Route>

        {/* Candidate portal - nested routing */}
        <Route
          path="/candidate"
          element={
            <ProtectedRoute allowedRole="candidate">
              <CandidateLayout />
            </ProtectedRoute>
          }
        >
          <Route index                          element={<Navigate to="/candidate/jobs" replace />} />
          <Route path="jobs"                    element={<JobBoard />} />
          <Route path="jobs/:id"                element={<JobDetail />} />
          <Route path="jobs/:id/apply"          element={<ApplyForm />} />
          <Route path="applications"            element={<MyApplications />} />
        </Route>

        {/* Fallback */}
        <Route path="/"  element={<Navigate to="/login" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

function ComingSoon({ label }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-xs text-gray-400 mt-1">This page is being built</p>
      </div>
    </div>
  )
}

export default App
