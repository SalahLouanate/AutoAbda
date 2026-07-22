import { useState } from 'react'

// ─── Mock data with statut & technicien ─────────────────────────────────────
const MOCK_TICKETS = [
  {
    id: 1,
    immat: 'AB-123-CD',
    marque: 'Renault Express',
    interventions: ['Vidange', 'Plaquettes'],
    rdv: true,
    heure: '08:30',
    statut: 'en_cours',
    technicien: 'Yassir Zimi',
  },
  {
    id: 2,
    immat: 'EF-456-GH',
    marque: 'Peugeot 308',
    interventions: ['Diagnostic'],
    rdv: false,
    heure: '09:15',
    statut: 'en_attente',
    technicien: null,
  },
  {
    id: 3,
    immat: 'IJ-789-KL',
    marque: 'Dacia Sandero',
    interventions: ['Vidange', 'Diagnostic'],
    rdv: true,
    heure: '10:00',
    statut: 'termine',
    technicien: 'Meraouni Mustapha',
  },
  {
    id: 4,
    immat: '1234-A-50',
    marque: 'Volkswagen Golf 8',
    interventions: ['Révision', 'Climatisation'],
    rdv: false,
    heure: '08:45',
    statut: 'en_cours',
    technicien: 'Meraouni Mustapha',
  },
  {
    id: 5,
    immat: '5678-B-12',
    marque: 'Citroën C3',
    interventions: ['Pneumatiques'],
    rdv: false,
    heure: '11:00',
    statut: 'en_attente',
    technicien: null,
  },
  {
    id: 6,
    immat: 'MN-321-OP',
    marque: 'Hyundai Tucson',
    interventions: ['Plaquettes', 'Diagnostic'],
    rdv: true,
    heure: '09:30',
    statut: 'en_attente',
    technicien: null,
  },
]

// ─── Statut config ───────────────────────────────────────────────────────────
const STATUT_CONFIG = {
  en_attente: {
    label: 'En attente',
    dotColor: 'bg-amber-400',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  en_cours: {
    label: 'En cours',
    dotColor: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  termine: {
    label: 'Terminé',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },
}

// ─── Sorting algorithm ───────────────────────────────────────────────────────
// Priority 1: RDV tickets first
// Priority 2: Within each group, sort by earliest arrival time
function sortQueue(tickets) {
  return [...tickets].sort((a, b) => {
    // RDV tickets get absolute priority
    if (a.rdv && !b.rdv) return -1
    if (!a.rdv && b.rdv) return 1
    // Within same priority group, sort by arrival time (oldest first)
    return a.heure.localeCompare(b.heure)
  })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function LicensePlate({ immat }) {
  return (
    <div className="flex items-center justify-center min-w-[5.5rem] h-10 rounded-md bg-white border-2 border-slate-800 px-2.5 shrink-0 shadow-sm">
      <span className="whitespace-nowrap text-slate-900 font-black text-sm tracking-wider leading-none select-all">
        {immat}
      </span>
    </div>
  )
}

function StatutBadge({ statut }) {
  const config = STATUT_CONFIG[statut] || STATUT_CONFIG.en_attente
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${statut === 'en_cours' ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  )
}

function RdvBadge({ rdv }) {
  return rdv ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      Rendez-vous
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Sans RDV
    </span>
  )
}

function InterventionTag({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
      {label}
    </span>
  )
}

function TechnicienInfo({ technicien }) {
  if (!technicien) return null
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
        <span className="text-blue-700 font-bold text-xs">{technicien.charAt(0)}</span>
      </div>
      <span className="text-sm font-medium text-slate-700">{technicien}</span>
    </div>
  )
}

// ─── Ticket Card ─────────────────────────────────────────────────────────────

function QueueTicketCard({ ticket, onEdit }) {
  const borderAccent =
    ticket.statut === 'en_cours'
      ? 'border-l-blue-500'
      : ticket.statut === 'termine'
      ? 'border-l-emerald-500'
      : 'border-l-amber-400'

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${borderAccent} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group`}
    >
      {/* ── Card header ── */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <LicensePlate immat={ticket.immat} />
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-base leading-tight truncate">{ticket.marque}</p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
                <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
              </svg>
              Arrivée à {ticket.heure}
            </p>
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={() => onEdit(ticket)}
          title="Modifier le ticket"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-700 transition-all duration-150 cursor-pointer shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
            <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
          </svg>
          <span className="text-xs font-semibold hidden sm:inline">Modifier</span>
        </button>
      </div>

      {/* ── Card body ── */}
      <div className="px-5 pb-4 flex flex-col gap-3">
        {/* Interventions */}
        <div className="flex flex-wrap gap-1.5">
          {ticket.interventions.map((i) => (
            <InterventionTag key={i} label={i} />
          ))}
        </div>

        {/* Status + RDV + Technicien row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <StatutBadge statut={ticket.statut} />
          <RdvBadge rdv={ticket.rdv} />
          <span className="flex-1" />
          {ticket.statut === 'en_cours' && ticket.technicien && (
            <TechnicienInfo technicien={ticket.technicien} />
          )}
          {ticket.statut === 'termine' && ticket.technicien && (
            <TechnicienInfo technicien={ticket.technicien} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

const TECHNICIENS = ['Yassir Zimi', 'Meraouni Mustapha']
const STATUTS = ['en_attente', 'en_cours', 'termine']

function EditModal({ ticket, onClose, onSave }) {
  const [formData, setFormData] = useState({
    marque: ticket.marque,
    statut: ticket.statut,
    technicien: ticket.technicien || '',
  })

  function handleSave() {
    onSave(ticket.id, {
      ...formData,
      technicien: formData.technicien || null,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'modalIn 0.2s ease-out' }}
      >
        {/* Modal header */}
        <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-slate-900">
                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Modifier le ticket</p>
              <p className="text-slate-400 text-xs">{ticket.immat}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 flex flex-col gap-5">

          {/* License plate preview */}
          <div className="flex justify-center">
            <LicensePlate immat={ticket.immat} />
          </div>

          {/* Marque */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Marque & Modèle
            </label>
            <input
              type="text"
              value={formData.marque}
              onChange={(e) => setFormData((f) => ({ ...f, marque: e.target.value }))}
              className="w-full text-slate-800 text-sm px-4 py-2.5 rounded-xl border border-slate-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            />
          </div>

          {/* Statut */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Statut
            </label>
            <div className="flex gap-2">
              {STATUTS.map((s) => {
                const config = STATUT_CONFIG[s]
                const isActive = formData.statut === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData((f) => ({ ...f, statut: s }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-150 cursor-pointer
                      ${isActive
                        ? `${config.bgColor} ${config.textColor} ${config.borderColor} shadow-sm`
                        : 'border-slate-200 bg-gray-50 text-slate-500 hover:border-slate-300'
                      }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? config.dotColor : 'bg-slate-300'}`} />
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Technicien */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Technicien assigné
            </label>
            <select
              value={formData.technicien}
              onChange={(e) => setFormData((f) => ({ ...f, technicien: e.target.value }))}
              className="w-full text-slate-800 text-sm px-4 py-2.5 rounded-xl border border-slate-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath fill-rule='evenodd' d='M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z' clip-rule='evenodd'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', paddingRight: '2.5rem' }}
            >
              <option value="">— Non assigné —</option>
              {TECHNICIENS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-sm font-bold shadow-md shadow-yellow-400/30 transition-all duration-150 cursor-pointer active:scale-[0.98]"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { id: 'tous', label: 'Tous' },
  { id: 'en_attente', label: 'En attente' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'termine', label: 'Terminés' },
]

// ─── Main View Component ─────────────────────────────────────────────────────

export default function FileAttenteView() {
  const [tickets, setTickets] = useState(MOCK_TICKETS)
  const [activeFilter, setActiveFilter] = useState('tous')
  const [editingTicket, setEditingTicket] = useState(null)

  // ── Filter tickets ──
  const filteredTickets = activeFilter === 'tous'
    ? tickets
    : tickets.filter((t) => t.statut === activeFilter)

  // ── Sort with algorithm: RDV priority, then by heure ──
  const sortedTickets = sortQueue(filteredTickets)

  // ── Stats ──
  const countByStatut = {
    tous: tickets.length,
    en_attente: tickets.filter((t) => t.statut === 'en_attente').length,
    en_cours: tickets.filter((t) => t.statut === 'en_cours').length,
    termine: tickets.filter((t) => t.statut === 'termine').length,
  }

  // ── Handlers ──
  function handleEdit(ticket) {
    setEditingTicket(ticket)
  }

  function handleSave(id, updates) {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }

  return (
    <div className="flex flex-col gap-6 min-h-full">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            File d'Attente & Suivi
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Visualisez l'état de chaque véhicule en temps réel et gérez les affectations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Temps réel
          </span>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: countByStatut.tous, color: 'bg-slate-900', text: 'text-white', accent: 'text-yellow-400' },
          { label: 'En attente', value: countByStatut.en_attente, color: 'bg-amber-50', text: 'text-amber-700', accent: 'text-amber-600', border: 'border-amber-200' },
          { label: 'En cours', value: countByStatut.en_cours, color: 'bg-blue-50', text: 'text-blue-700', accent: 'text-blue-600', border: 'border-blue-200' },
          { label: 'Terminés', value: countByStatut.termine, color: 'bg-emerald-50', text: 'text-emerald-700', accent: 'text-emerald-600', border: 'border-emerald-200' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-2xl p-4 ${stat.border ? `border ${stat.border}` : ''} flex flex-col gap-1`}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${stat.text} opacity-70`}>{stat.label}</p>
            <p className={`text-2xl font-black ${stat.accent || stat.text}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 w-fit">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer
                ${isActive
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab.label}
              <span className={`ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-bold
                ${isActive ? 'bg-slate-900 text-yellow-400' : 'bg-slate-200 text-slate-500'}`}>
                {countByStatut[tab.id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Queue header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-800 text-lg">Véhicules</h2>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-yellow-400 text-xs font-bold">
            {sortedTickets.length}
          </span>
        </div>
        <p className="text-xs text-slate-400 italic flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M2.75 9a.75.75 0 0 1 .75.75v1.69l2.22-2.22a.75.75 0 0 1 1.06 1.06L4.56 12.5h1.69a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75v-3.5A.75.75 0 0 1 2.75 9ZM2.75 7a.75.75 0 0 0 .75-.75V4.56l2.22 2.22a.75.75 0 0 0 1.06-1.06L4.56 3.5h1.69a.75.75 0 0 0 0-1.5h-3.5a.75.75 0 0 0-.75.75v3.5c0 .414.336.75.75.75ZM13.25 9a.75.75 0 0 0-.75.75v1.69l-2.22-2.22a.75.75 0 1 0-1.06 1.06l2.22 2.22H9.75a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 .75-.75v-3.5a.75.75 0 0 0-.75-.75ZM13.25 7a.75.75 0 0 1-.75-.75V4.56l-2.22 2.22a.75.75 0 0 1-1.06-1.06l2.22-2.22H9.75a.75.75 0 0 1 0-1.5h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-.75.75Z" clipRule="evenodd" />
          </svg>
          Trié par priorité RDV puis heure d'arrivée
        </p>
      </div>

      {/* ── Empty state ── */}
      {sortedTickets.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-12 h-12 text-slate-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 1-.987-1.106v.001m10.026 0a48.524 48.524 0 0 1 1.038.02" />
          </svg>
          <p className="text-sm font-medium">Aucun véhicule pour ce filtre</p>
          <p className="text-xs">Modifiez le filtre ou ajoutez un véhicule depuis la Prise en Charge.</p>
        </div>
      )}

      {/* ── Ticket cards ── */}
      <div className="flex flex-col gap-3">
        {sortedTickets.map((ticket) => (
          <QueueTicketCard key={ticket.id} ticket={ticket} onEdit={handleEdit} />
        ))}
      </div>

      {/* ── Edit Modal ── */}
      {editingTicket && (
        <EditModal
          ticket={editingTicket}
          onClose={() => setEditingTicket(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
