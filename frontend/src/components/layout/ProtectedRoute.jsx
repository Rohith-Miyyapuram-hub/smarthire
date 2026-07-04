import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

/**
 * ProtectedRoute — wraps any page that requires authentication.
 *
 * Usage:
 *   <Route path="/recruiter/dashboard" element={
 *     <ProtectedRoute allowedRole="recruiter">
 *       <Dashboard />
 *     </ProtectedRoute>
 *   } />
 *
 * Logic:
 * 1. Not logged in → redirect to /login
 * 2. Logged in but wrong role → redirect to their correct portal
 * 3. Logged in + correct role → render children
 */
function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && user?.role !== allowedRole) {
    // Send them to the right place instead of showing an error
    return <Navigate to={`/${user.role}`} replace />
  }

  return children
}

export default ProtectedRoute
