import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import DashboardReception from '../components/DashboardReception'
import FileAttenteView from '../components/FileAttenteView'
import HistoriqueRetoursView from '../views/reception/HistoriqueRetoursView'
import CatalogueInterventionsView from '../views/direction/CatalogueInterventionsView'

const NAV_ITEMS = [
  {
    id: 'prise_en_charge',
    step: '01',
    label: 'Prise en Charge',
    desc: 'Enregistrer un véhicule',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'file_attente',
    step: '02',
    label: "File d'Attente & Suivi",
    desc: 'Statut en temps réel',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm13-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'historique',
    step: '03',
    label: 'Historique & SAV',
    desc: 'Retours et réclamations',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'catalogue',
    step: '04',
    label: 'Catalogue & Barèmes',
    desc: 'Tarifs & prestations',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
]

// ─── Placeholder views ─────────────────────────────────────────────────────────
function PlaceholderView({ title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-slate-400">
      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-600 text-base">{title}</p>
        <p className="text-sm text-slate-400 mt-1">{desc}</p>
        <span className="inline-block mt-3 px-3 py-1 rounded-full bg-slate-100 text-slate-400 text-xs font-medium">En construction</span>
      </div>
    </div>
  )
}

const VIEWS = {
  prise_en_charge: <DashboardReception />,
  file_attente: <FileAttenteView />,
  historique: <HistoriqueRetoursView />,
  catalogue: <CatalogueInterventionsView />,
}

// ─── Layout ────────────────────────────────────────────────────────────────────
export default function ReceptionLayout() {
  const { user, logout } = useAuth()
  const [activeView, setActiveView] = useState('prise_en_charge')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const activeItem = NAV_ITEMS.find((n) => n.id === activeView)

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">

      {/* ── Overlay backdrop (mobile uniquement) ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 h-[100dvh] w-64 bg-slate-900 flex flex-col z-40 border-r border-slate-700/50 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0`}
      >

        {/* Brand + Bouton fermeture mobile */}
        <div className="px-5 py-5 border-b border-slate-700/50 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0 shadow-lg shadow-yellow-400/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-900">
                <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
                <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
                <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
              </svg>
            </div>
            <div>
              <p className="text-yellow-400 font-bold text-sm tracking-wide">AUTO ABDA</p>
              <p className="text-slate-500 text-xs">Réception</p>
            </div>
          </div>

          {/* Bouton X — visible uniquement sur mobile */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            aria-label="Fermer le menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 min-h-0 px-3 py-5 flex flex-col gap-1 overflow-y-auto">
          <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest px-3 mb-3">
            Module Réception
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id)
                  setIsSidebarOpen(false)
                }}
                className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer
                  ${isActive ? 'bg-yellow-400/15 text-yellow-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
              >
                <span className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors font-black text-xs
                  ${isActive ? 'bg-yellow-400/20 text-yellow-400' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'}`}>
                  {item.step}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs leading-tight">{item.label}</span>
                  <span className={`text-xs leading-tight mt-0.5 ${isActive ? 'text-yellow-400/60' : 'text-slate-600 group-hover:text-slate-400'}`}>
                    {item.desc}
                  </span>
                </div>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />}
              </button>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-slate-700/50 flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center shrink-0">
              <span className="text-yellow-400 font-bold text-xs">{user?.name?.charAt(0) ?? 'R'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-slate-200 text-xs font-semibold truncate">{user?.name ?? 'Réceptionniste'}</p>
              <p className="text-slate-500 text-xs truncate">Réception</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-700 text-slate-500 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-400/5 text-xs font-medium transition-all duration-150 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6 10a.75.75 0 0 1 .75-.75h9.546l-1.048-.943a.75.75 0 1 1 1.004-1.114l2.5 2.25a.75.75 0 0 1 0 1.114l-2.5 2.25a.75.75 0 1 1-1.004-1.114l1.048-.943H6.75A.75.75 0 0 1 6 10Z" clipRule="evenodd" />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto md:ml-64 w-full min-w-0">
        {/* Topbar */}
        <div className="sticky top-0 z-30 bg-gray-50/90 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-8 py-3 sm:py-4 flex items-center gap-3">
          {/* Bouton Hamburger — visible uniquement sur mobile */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer shrink-0"
            aria-label="Ouvrir le menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="flex items-center gap-2 text-slate-400 text-sm min-w-0">
            <span className="font-medium text-yellow-500 text-xs uppercase tracking-widest shrink-0">Réception</span>
            <span className="shrink-0">/</span>
            <span className="font-semibold text-slate-700 truncate">{activeItem?.label}</span>
          </div>
        </div>

        <div className="px-3 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 max-w-6xl mx-auto">
          {VIEWS[activeView]}
        </div>
      </main>
    </div>
  )
}

