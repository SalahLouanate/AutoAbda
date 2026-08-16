import { Routes, Route, Navigate } from 'react-router-dom'
import TechnicienDashboardView from '../views/technicien/TechnicienDashboardView'

export default function TechnicianLayout() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<TechnicienDashboardView />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  )
}
