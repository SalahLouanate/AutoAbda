import { useState, useEffect } from 'react'
import api from '../../api/axios'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function formatDate(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS_OPTIONS = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR - i))

// ─────────────────────────────────────────────
// ICONS (inline SVG)
// ─────────────────────────────────────────────
function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function CarIcon({ className = 'h-8 w-8' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M3 11l2-5h14l2 5M3 11h18v6H3v-6zm3 6v1a1 1 0 002 0v-1m8 0v1a1 1 0 002 0v-1" />
    </svg>
  )
}

function WrenchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09.542-.56 1.007-1.05.77A7 7 0 1018.5 12.5c0-.282-.02-.56-.057-.832-.04-.3.228-.598.527-.558a4.5 4.5 0 01-6.627-4.17z" />
    </svg>
  )
}

function UserIcon({ className = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function TicketIcon({ className = 'h-5 w-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75M6 6v.75m0 3v.75m0 3v.75M3.75 6H15a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0115 18H3.75A2.25 2.25 0 011.5 15.75v-7.5A2.25 2.25 0 013.75 6z" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

// ─────────────────────────────────────────────
// COMPOSANT CARTE VÉHICULE (Pleine Largeur w-full)
// ─────────────────────────────────────────────
function VehicleCard({ vehicle, onClick }) {
  const count = vehicle.tickets_count ?? vehicle.interventions_count ?? 0
  const immat = vehicle.immatriculation || vehicle.matricule || 'SANS-IMMAT'

  return (
    <div
      onClick={() => onClick(vehicle)}
      className="w-full flex items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all gap-5 cursor-pointer group"
    >
      {/* Plaque à gauche avec flex-shrink-0 */}
      <div className="flex-shrink-0 bg-white border-2 border-gray-800 text-gray-900 font-mono font-bold text-sm px-3 py-1.5 rounded-md whitespace-nowrap shadow-xs">
        {immat}
      </div>

      {/* Infos au centre avec flex-1 */}
      <div className="flex-1 flex flex-col min-w-0">
        <h3 className="text-lg font-bold text-gray-800 truncate leading-tight">
          {vehicle.marque}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {count} intervention{count > 1 ? 's' : ''} enregistrée{count > 1 ? 's' : ''}
        </p>
      </div>

      {/* Flèche à droite */}
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// COMPOSANT LIGNE D'INTERVENTION
// ─────────────────────────────────────────────
function TicketRow({ ticket, onClick }) {
  const statut = ticket.statut || 'Terminé'

  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (statut === 'En cours') {
    badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'
  } else if (statut === 'Bloqué') {
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200'
  } else if (statut === 'En attente') {
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200'
  }

  return (
    <div
      onClick={() => onClick(ticket)}
      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow mb-3 cursor-pointer"
    >
      <div className="flex items-center min-w-0">
        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
          <WrenchIcon className="h-5 w-5" />
        </div>
        <div className="flex flex-col ml-4 min-w-0">
          <h4 className="text-md font-semibold text-gray-800 truncate">
            {ticket.type_intervention || ticket.type}
          </h4>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            Technicien : {ticket.technicien || 'Non assigné'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="text-sm text-gray-400 font-mono">
          {formatDate(ticket.created_at || ticket.date)}
        </span>
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${badgeColor}`}>
          {statut}
        </span>
      </div>
    </div>
  )
}

function InfoBlock({ icon, label, value, fullWidth }) {
  return (
    <div className={`p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 ${fullWidth ? 'col-span-2' : ''}`}>
      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{value || '—'}</p>
      </div>
    </div>
  )
}

function TicketModal({ ticket, vehicle, onClose, onDeclarer }) {
  if (!ticket) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TicketIcon className="text-yellow-400" />
            <h3 className="font-bold text-sm">Détail Intervention #{ticket.id}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-white border-2 border-gray-800 text-gray-900 font-mono font-bold py-2.5 px-4 rounded-xl text-center text-lg tracking-widest">
            {vehicle?.immatriculation || vehicle?.matricule}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <InfoBlock icon={<CarIcon className="h-4 w-4" />} label="Véhicule" value={vehicle?.marque} />
            <InfoBlock icon={<TicketIcon className="h-4 w-4" />} label="Date" value={formatDate(ticket.created_at || ticket.date)} />
            <InfoBlock icon={<WrenchIcon className="h-4 w-4" />} label="Prestation" value={ticket.type_intervention || ticket.type} fullWidth />
            <InfoBlock icon={<UserIcon className="h-4 w-4" />} label="Technicien" value={ticket.technicien} />
            <InfoBlock icon={<span className="w-2 h-2 rounded-full bg-emerald-500" />} label="Statut" value={ticket.statut || 'Clôturé'} />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onDeclarer}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <AlertIcon />
            <span>Déclarer un Retour SAV</span>
          </button>
          <button onClick={onClose} className="py-3 px-4 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────
export default function HistoriqueRetoursView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [day, setDay]                 = useState('')
  const [month, setMonth]             = useState('')
  const [year, setYear]               = useState('')
  const [results, setResults]         = useState([])
  const [loading, setLoading]         = useState(false)

  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [selectedTicket, setSelectedTicket]   = useState(null)

  useEffect(() => {
    setLoading(true)

    const handler = setTimeout(async () => {
      try {
        const response = await api.get('/reception/historique', {
          params: {
            plaque: searchQuery.trim(),
            jour: day,
            mois: month,
            annee: year,
          },
        })

        if (response.data && Array.isArray(response.data.vehicules)) {
          setResults(response.data.vehicules)
        } else {
          setResults([])
        }
      } catch (err) {
        console.error('Erreur lors de la recherche historique:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery, day, month, year])

  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle)
    setSelectedTicket(null)
  }

  const handleBack = () => {
    setSelectedVehicle(null)
    setSelectedTicket(null)
  }

  const handleDeclarer = () => {
    alert(`✅ Retour SAV déclaré avec succès pour le ticket #${selectedTicket?.id}`)
    setSelectedTicket(null)
  }

  const totalInterventionsCount = selectedVehicle?.tickets_count ?? selectedVehicle?.interventions_count ?? selectedVehicle?.interventions?.length ?? 0
  const immatSelected = selectedVehicle?.immatriculation || selectedVehicle?.matricule || 'SANS-IMMAT'

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Historique des Véhicules &amp; SAV
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Consultez l'historique des interventions passées et filtrez par immatriculation ou période.
            </p>
          </div>
          <span className="text-xs font-extrabold px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {results.length} véhicule{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* ── TOP BAR : Recherche + Filtres ── */}
        {!selectedVehicle && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une plaque d'immatriculation..."
                className="w-full pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 placeholder:font-normal shadow-xs uppercase"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-3 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Jour (Tous)</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>{String(d).padStart(2, '0')}</option>
                ))}
              </select>

              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-3 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Mois (Tous)</option>
                {MOIS_LABELS.map((m, i) => (
                  <option key={m} value={String(i + 1)}>{m}</option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-3 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Année (Toutes)</option>
                {YEARS_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            MASTER VIEW — Liste verticale pleine largeur
        ══════════════════════════════════════ */}
        {!selectedVehicle && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                {results.length} VÉHICULE{results.length > 1 ? 'S' : ''} TROUVÉ{results.length > 1 ? 'S' : ''}
              </p>
              {loading && (
                <span className="text-xs font-bold text-blue-600 animate-pulse flex items-center gap-1">
                  Recherche en cours...
                </span>
              )}
            </div>

            {loading && results.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Chargement de l'historique...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                <CarIcon className="h-12 w-12 text-slate-300 mb-2" />
                <p className="text-base font-bold text-slate-700">Aucun véhicule trouvé</p>
                <p className="text-xs text-slate-400 mt-1">Essayez une autre immatriculation ou réinitialisez les filtres date.</p>
              </div>
            ) : (
              /* 1. Conteneur Parent (La Liste) : Strictly vertical and full width */
              <div className="flex flex-col gap-4 w-full">
                {results.map((vehicule) => (
                  <VehicleCard key={vehicule.id} vehicle={vehicule} onClick={handleVehicleClick} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════
            DETAIL VIEW — Interventions du véhicule
        ══════════════════════════════════════ */}
        {selectedVehicle && (
          <section className="space-y-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              <ArrowLeftIcon />
              <span>Retour à la liste des véhicules</span>
            </button>

            <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="flex-shrink-0 bg-white border-2 border-gray-800 text-gray-900 font-mono font-bold text-sm px-3 py-1 rounded-md whitespace-nowrap shadow-xs">
                {immatSelected}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-800 truncate">
                  {selectedVehicle.marque}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {totalInterventionsCount} intervention{totalInterventionsCount > 1 ? 's' : ''} enregistrée{totalInterventionsCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest px-1">
                Interventions ({selectedVehicle.interventions?.length || 0})
              </p>

              {(!selectedVehicle.interventions || selectedVehicle.interventions.length === 0) ? (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-100 text-sm font-semibold text-gray-400">
                  Aucune intervention enregistrée pour ce véhicule.
                </div>
              ) : (
                selectedVehicle.interventions.map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} onClick={setSelectedTicket} />
                ))
              )}
            </div>
          </section>
        )}

      </div>

      <TicketModal
        ticket={selectedTicket}
        vehicle={selectedVehicle}
        onClose={() => setSelectedTicket(null)}
        onDeclarer={handleDeclarer}
      />
    </div>
  )
}
