import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import DashboardDirectionView      from '../views/direction/DashboardDirectionView'
import CatalogueInterventionsView  from '../views/direction/CatalogueInterventionsView'
import GestionRessourcesView       from '../views/direction/GestionRessourcesView'
import PerformancesRentabiliteView from '../views/direction/PerformancesRentabiliteView'

const NAV_ITEMS = [
  {
    id: 'dashboard',
    step: '01',
    label: 'Dashboard Temps Réel',
    desc: 'KPIs & flux en direct',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684Z" />
      </svg>
    ),
  },
  {
    id: 'catalogue',
    step: '02',
    label: 'Catalogue & Barèmes',
    desc: 'Tarifs & prestations',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'bilan',
    step: '03',
    label: 'Bilan Mensuel & Primes',
    desc: 'Performance & rémunération',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.615Z" />
        <path fillRule="evenodd" d="M9.99 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM10 4a6 6 0 1 1 0 12A6 6 0 0 1 10 4Zm-.75 2a.75.75 0 0 1 .75.75V7h.25a1.75 1.75 0 0 1 0 3.5h-.25v2.25a3.13 3.13 0 0 0 1.138-.432c.482-.315.612-.648.612-.875a.75.75 0 0 1 1.5 0c0 .83-.498 1.482-1.108 1.868A4.63 4.63 0 0 1 10 13.75v.5a.75.75 0 0 1-1.5 0v-.625a4.447 4.447 0 0 1-1.624-.684C6.175 12.48 5.75 11.795 5.75 11c0-.83.498-1.482 1.108-1.868A4.63 4.63 0 0 1 8.5 8.25v-.5a.75.75 0 0 1 0-1.5v.5H10V6.75A.75.75 0 0 1 9.25 6Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'ressources',
    step: '04',
    label: 'Gestion des Ressources',
    desc: 'Personnel & infrastructures',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
      </svg>
    ),
  },
]

// ─── Placeholder view ────────────────────────────────────────────────────────
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
  dashboard:   <DashboardDirectionView />,
  catalogue:   <CatalogueInterventionsView />,
  bilan:       <PerformancesRentabiliteView />,
  ressources:  <GestionRessourcesView />,
}

// ─── Layout ────────────────────────────────────────────────────────────────────
export default function DirectionLayout() {
  const { user, logout } = useAuth()
  const [activeView, setActiveView] = useState('dashboard')

  const activeItem = NAV_ITEMS.find((n) => n.id === activeView)

  return (
    <div className="flex h-screen bg-gray-50 font-sans">

      {/* ── Sidebar ── */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-slate-900 flex flex-col z-40 border-r border-slate-700/50">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0 shadow-lg shadow-yellow-400/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-900">
                <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684Z" />
              </svg>
            </div>
            <div>
              <p className="text-yellow-400 font-bold text-sm tracking-wide">AUTO ABDA</p>
              <p className="text-slate-500 text-xs">Direction</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1 overflow-y-auto">
          <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest px-3 mb-3">
            Module Direction
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer
                  ${isActive ? 'bg-yellow-400/15 text-yellow-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
              >
                <span className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 font-black text-xs transition-colors
                  ${isActive ? 'bg-yellow-400/20 text-yellow-400' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'}`}>
                  {item.step}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs leading-tight">{item.label}</span>
                  <span className={`text-xs leading-tight mt-0.5 ${isActive ? 'text-yellow-400/60' : 'text-slate-600 group-hover:text-slate-400'}`}>{item.desc}</span>
                </div>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />}
              </button>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-slate-700/50 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
              <span className="text-slate-900 font-black text-xs">{user?.name?.charAt(0) ?? 'D'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-slate-200 text-xs font-semibold truncate">{user?.name ?? 'Chef d\'Atelier'}</p>
              <p className="text-yellow-400/70 text-xs truncate">Direction</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-700 text-slate-500 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-400/5 text-xs font-medium transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6 10a.75.75 0 0 1 .75-.75h9.546l-1.048-.943a.75.75 0 1 1 1.004-1.114l2.5 2.25a.75.75 0 0 1 0 1.114l-2.5 2.25a.75.75 0 1 1-1.004-1.114l1.048-.943H6.75A.75.75 0 0 1 6 10Z" clipRule="evenodd" />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="ml-64 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 bg-gray-50/90 backdrop-blur-sm border-b border-slate-200/80 px-8 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-yellow-500 text-xs uppercase tracking-widest">Direction</span>
            <span className="text-slate-400">/</span>
            <span className="font-semibold text-slate-700">{activeItem?.label}</span>
          </div>
        </div>
        <div className="px-8 py-8 max-w-6xl mx-auto">
          {VIEWS[activeView]}
        </div>
      </main>
    </div>
  )
}
