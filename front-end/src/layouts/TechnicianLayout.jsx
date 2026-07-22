import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// ─── Mock work orders ──────────────────────────────────────────────────────────
const WORK_ORDERS = [
  {
    id: 'OT-001',
    immat: 'AB-123-CD',
    vehicule: 'Renault Clio IV',
    taches: ['Changement amortisseurs AV', 'Équilibrage roues'],
    priorite: 'haute',
    avancement: 65,
  },
  {
    id: 'OT-002',
    immat: 'EF-456-GH',
    vehicule: 'Peugeot 308',
    taches: ['Diagnostic injection', 'Reset voyant'],
    priorite: 'normale',
    avancement: 30,
  },
  {
    id: 'OT-003',
    immat: 'IJ-789-KL',
    vehicule: 'Dacia Sandero',
    taches: ['Vidange moteur', 'Filtre à huile', 'Filtre air'],
    priorite: 'basse',
    avancement: 90,
  },
]

const PRIORITY_STYLES = {
  haute:    'bg-rose-100 text-rose-700 border border-rose-200',
  normale:  'bg-blue-100 text-blue-700 border border-blue-200',
  basse:    'bg-slate-100 text-slate-500 border border-slate-200',
}
const PRIORITY_LABELS = { haute: '🔴 Haute', normale: '🔵 Normale', basse: '⚪ Basse' }

function ProgressRing({ pct }) {
  const r = 26
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-slate-100" />
      <circle
        cx="32" cy="32" r={r} fill="none" strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        className={`transition-all duration-700 ${pct >= 80 ? 'stroke-emerald-400' : pct >= 50 ? 'stroke-yellow-400' : 'stroke-blue-400'}`}
      />
    </svg>
  )
}

function WorkOrderCard({ order, onUpdate }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card top accent by priority */}
      <div className={`h-1 w-full ${order.priorite === 'haute' ? 'bg-rose-400' : order.priorite === 'normale' ? 'bg-blue-400' : 'bg-slate-300'}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-xs text-slate-400">{order.id}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_STYLES[order.priorite]}`}>
                {PRIORITY_LABELS[order.priorite]}
              </span>
            </div>
            <p className="font-bold text-slate-800 text-base leading-tight">{order.vehicule}</p>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{order.immat}</p>
          </div>
          {/* Progress ring */}
          <div className="relative shrink-0">
            <ProgressRing pct={order.avancement} />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-700 rotate-90">
              {order.avancement}%
            </span>
          </div>
        </div>

        {/* Tasks */}
        <ul className="flex flex-col gap-1.5 mb-4">
          {order.taches.map((t) => (
            <li key={t} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
              {t}
            </li>
          ))}
        </ul>

        {/* Progress slider */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Avancement</span>
            <span className="font-bold text-slate-600">{order.avancement}%</span>
          </div>
          <input
            type="range"
            min={0} max={100} step={5}
            value={order.avancement}
            onChange={(e) => onUpdate(order.id, Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-yellow-400"
          />
        </div>

        {/* Done CTA */}
        {order.avancement === 100 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
            Travaux terminés — Prêt pour restitution
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Layout ────────────────────────────────────────────────────────────────────
export default function TechnicianLayout() {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState(WORK_ORDERS)

  function handleUpdate(id, newPct) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, avancement: newPct } : o))
  }

  const done = orders.filter((o) => o.avancement === 100).length

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">

      {/* ── Fixed top header (Mobile-First) ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-700/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Left: logo + name */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-900">
                <path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 0 1 6.775-5.025.75.75 0 0 1 .313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.641l3.318-3.319a.75.75 0 0 1 1.248.313 5.25 5.25 0 0 1-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 1 1 2.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.306Z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">
                {user?.name ?? 'Technicien'}
              </p>
              <p className="text-slate-500 text-xs">Atelier · Auto Abda</p>
            </div>
          </div>

          {/* Right: status + logout */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              En service
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-600 text-slate-400 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-400/5 text-xs font-medium transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6 10a.75.75 0 0 1 .75-.75h9.546l-1.048-.943a.75.75 0 1 1 1.004-1.114l2.5 2.25a.75.75 0 0 1 0 1.114l-2.5 2.25a.75.75 0 1 1-1.004-1.114l1.048-.943H6.75A.75.75 0 0 1 6 10Z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main scroll area ── */}
      <main className="flex-1 pt-16 pb-8">
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Assignés', value: orders.length, color: 'text-slate-400' },
              { label: 'En cours', value: orders.filter((o) => o.avancement > 0 && o.avancement < 100).length, color: 'text-yellow-400' },
              { label: 'Terminés', value: done, color: 'text-emerald-400' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800 rounded-2xl border border-slate-700/50 p-4 text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Section title */}
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-base">Mes Ordres de Travail</h2>
            <span className="text-slate-500 text-xs">{done}/{orders.length} terminés</span>
          </div>

          {/* Work order cards */}
          {orders.map((order) => (
            <WorkOrderCard key={order.id} order={order} onUpdate={handleUpdate} />
          ))}

        </div>
      </main>
    </div>
  )
}
