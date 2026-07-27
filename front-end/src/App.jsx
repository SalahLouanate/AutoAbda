import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginView from './views/auth/LoginView'
import ReceptionLayout from './layouts/ReceptionLayout'
import TechnicianLayout from './layouts/TechnicianLayout'
import DirectionLayout from './layouts/DirectionLayout'

// Helper function to resolve dashboard path by user role
function getRoleDashboardPath(role) {
  const normalizedRole = role?.toLowerCase()
  if (normalizedRole === 'technicien') {
    return '/technicien/dashboard'
  }
  if (normalizedRole === 'reception' || normalizedRole === 'receptionniste') {
    return '/reception/dashboard'
  }
  return '/direction/dashboard'
}

// Protected Route Guard Component
function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/" replace />
  }

  const userRole = user.role?.toLowerCase()
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const targetDashboard = getRoleDashboardPath(user.role)
    return <Navigate to={targetDashboard} replace />
  }

  return children
}

// Root / Home Route Component: Renders LoginView or redirects authenticated user
function RootRoute() {
  const { user } = useAuth()

  if (user) {
    const targetDashboard = getRoleDashboardPath(user.role)
    return <Navigate to={targetDashboard} replace />
  }

  return <LoginView />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Route racine / et /login -> LoginView */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<RootRoute />} />

      {/* Routes Espace Direction */}
      <Route
        path="/direction/*"
        element={
          <ProtectedRoute allowedRoles={['direction', 'chef_atelier']}>
            <DirectionLayout />
          </ProtectedRoute>
        }
      />

      {/* Routes Espace Technicien */}
      <Route
        path="/technicien/*"
        element={
          <ProtectedRoute allowedRoles={['technicien']}>
            <TechnicianLayout />
          </ProtectedRoute>
        }
      />

      {/* Routes Espace Réception */}
      <Route
        path="/reception/*"
        element={
          <ProtectedRoute allowedRoles={['reception', 'receptionniste']}>
            <ReceptionLayout />
          </ProtectedRoute>
        }
      />

      {/* Redirection fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}