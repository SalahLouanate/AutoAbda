import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import DashboardDirectionView      from '../views/direction/DashboardDirectionView'
import SupervisionQuotidienneView  from '../views/direction/SupervisionQuotidienneView'
import CatalogueInterventionsView  from '../views/direction/CatalogueInterventionsView'
import GestionRessourcesView       from '../views/direction/GestionRessourcesView'
import PerformancesRentabiliteView from '../views/direction/PerformancesRentabiliteView'
import MonProfilView               from '../views/direction/MonProfilView'
import GestionInterventions        from '../views/direction/GestionInterventions'

const PAGE_LABELS = {
  '/direction/dashboard': 'Dashboard Temps Réel',
  '/direction/supervision': 'Supervision Quotidienne',
  '/direction/gestion-interventions': 'Gestion des Interventions',
  '/direction/catalogue': 'Catalogue & Barèmes',
  '/direction/bilan': 'Bilan Mensuel & Primes',
  '/direction/ressources': 'Gestion des Ressources',
  '/direction/profil': 'Mon Profil',
}

export default function DirectionLayout() {
  const location = useLocation()
  const pageLabel = PAGE_LABELS[location.pathname] || 'Dashboard Temps Réel'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar navigation (Fixe sur Desktop, Tiroir modale sur Tablette/Mobile) */}
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area — ml-0 sur tablette, ml-64 verrouillé sur desktop */}
      <main className="ml-0 lg:ml-64 flex-1 overflow-y-auto w-full">
        {/* Topbar */}
        <div className="sticky top-0 z-30 bg-gray-50/90 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Bouton Menu Tablette / Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-2 shadow-sm"
              aria-label="Ouvrir le menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-slate-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <span className="text-xs font-bold">Menu</span>
            </button>

            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-yellow-500 text-xs uppercase tracking-widest">Direction</span>
              <span className="text-slate-400">/</span>
              <span className="font-semibold text-slate-700">{pageLabel}</span>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardDirectionView />} />
            <Route path="supervision" element={<SupervisionQuotidienneView />} />
            <Route path="gestion-interventions" element={<GestionInterventions />} />
            <Route path="catalogue" element={<CatalogueInterventionsView />} />
            <Route path="bilan" element={<PerformancesRentabiliteView />} />
            <Route path="ressources" element={<GestionRessourcesView />} />
            <Route path="profil" element={<MonProfilView />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
