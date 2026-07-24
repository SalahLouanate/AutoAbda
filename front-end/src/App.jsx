import { AuthProvider, useAuth } from './context/AuthContext'
import LoginView from './views/auth/LoginView'
import ReceptionLayout from './layouts/ReceptionLayout'
import TechnicianLayout from './layouts/TechnicianLayout'
import DirectionLayout from './layouts/DirectionLayout'

// ─── Role → Layout mapping ─────────────────────────────────────────────────────
const LAYOUT_MAP = {
  receptionniste: <ReceptionLayout />,
  reception:      <ReceptionLayout />,
  technicien:     <TechnicianLayout />,
  chef_atelier:   <DirectionLayout />,
  direction:      <DirectionLayout />,
}

// ─── Auth-aware router ─────────────────────────────────────────────────────────
function AppRouter() {
  const { user } = useAuth()

  // Not authenticated → Login page
  if (!user) return <LoginView />

  // Authenticated → render matching layout
  const layout = LAYOUT_MAP[user.role]
  if (!layout) {
    // Unknown role fallback — show error + logout button
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-400 font-bold text-lg">Rôle non reconnu : {user.role}</p>
          <p className="text-slate-500 text-sm mt-2">Contactez l'administrateur.</p>
        </div>
      </div>
    )
  }

  return layout
}

// ─── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}