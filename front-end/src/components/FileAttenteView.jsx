import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import echo from '../echo'
import ModifierInterventionModal from './ModifierInterventionModal'

// ─── Statut config ───────────────────────────────────────────────────────────
const STATUT_CONFIG = {
  'En attente': {
    label: 'En attente',
    dotColor: 'bg-amber-400',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  'En cours': {
    label: 'En cours',
    dotColor: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  'Bloqué': {
    label: 'Bloqué',
    dotColor: 'bg-rose-500',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
  },
  'Terminé': {
    label: 'Terminé',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function LicensePlate({ immat }) {
  return (
    <div className="flex items-center justify-center min-w-[5.5rem] h-10 rounded-md bg-white border-2 border-slate-800 px-2.5 shrink-0 shadow-sm font-mono font-black text-slate-900 tracking-wider">
      <span className="whitespace-nowrap text-sm leading-none select-all">
        {immat || 'SANS-IMMAT'}
      </span>
    </div>
  )
}

function StatutBadge({ statut }) {
  const config = STATUT_CONFIG[statut] || STATUT_CONFIG['En attente']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${statut === 'En cours' ? 'animate-pulse' : ''}`} />
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
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
      {label}
    </span>
  )
}

function TechnicienInfo({ technicien }) {
  if (!technicien) return null
  const techNom = typeof technicien === 'object' ? (technicien.nom || technicien.name) : technicien
  if (!techNom) return null

  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
        <span className="text-blue-700 font-bold text-xs">{techNom.charAt(0)}</span>
      </div>
      <span className="text-sm font-medium text-slate-700">{techNom}</span>
    </div>
  )
}

// ─── Ticket Card ─────────────────────────────────────────────────────────────

function QueueTicketCard({ ticket, onEdit, onDelete }) {
  const borderAccent =
    ticket.statut === 'En cours'
      ? 'border-l-blue-500'
      : ticket.statut === 'Bloqué'
      ? 'border-l-rose-500'
      : ticket.statut === 'Terminé'
      ? 'border-l-emerald-500'
      : 'border-l-amber-400'

  const immatDisplay = ticket.immat || ticket.immatriculation || ticket.vehicule?.matricule || 'SANS-IMMAT'
  const marqueDisplay = ticket.marque || (ticket.vehicule ? `${ticket.vehicule.marque} ${ticket.vehicule.modele}` : 'Véhicule')
  const heureDisplay = ticket.heure || (ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Récent')

  const listPrestations = Array.isArray(ticket.interventions)
    ? ticket.interventions
    : Array.isArray(ticket.prestations)
    ? ticket.prestations.map((p) => p.nom || p)
    : ticket.type_intervention
    ? [ticket.type_intervention]
    : []

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${borderAccent} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group`}
    >
      {/* ── Card header ── */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <LicensePlate immat={immatDisplay} />
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-base leading-tight truncate">{marqueDisplay}</p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
                <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
              </svg>
              Arrivée à {heureDisplay}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(ticket)}
              title="Modifier le ticket"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-700 transition-all duration-150 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
              </svg>
              <span className="text-xs font-semibold hidden sm:inline">Modifier</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(ticket.id)}
              title="Supprimer le ticket"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition-all duration-150 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.75 1.75 0 0 0 5.607 15h4.786a1.75 1.75 0 0 0 1.742-1.35L12.95 5.5h.3a.75.75 0 0 0 0-1.5H11v-.75A1.75 1.75 0 0 0 9.25 1.5h-2.5A1.75 1.75 0 0 0 5 3.25Zm1.5 0c0-.138.112-.25.25-.25h2.5c.138 0 .25.112.25.25V4h-3v-.75Z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-semibold hidden sm:inline">Supprimer</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="px-5 pb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {listPrestations.map((i, idx) => (
            <InterventionTag key={idx} label={i} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <StatutBadge statut={ticket.statut} />
          <RdvBadge rdv={ticket.rdv} />
          <span className="flex-1" />
          {ticket.technicien && (
            <TechnicienInfo technicien={ticket.technicien} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { id: 'Tous', label: 'Tous' },
  { id: 'En attente', label: 'En attente' },
  { id: 'En cours', label: 'En cours' },
  { id: 'Terminés', label: 'Terminés' },
]

// ─── Main View Component ─────────────────────────────────────────────────────

export default function FileAttenteView() {
  // 1. Initialisation stricte des states à vide
  const [vehicules, setVehicules] = useState([])
  const [kpis, setKpis] = useState({
    total: 0,
    en_attente: 0,
    en_cours: 0,
    termines: 0,
  })

  const [activeFilter, setActiveFilter] = useState('Tous')
  const [loading, setLoading] = useState(true)

  // Modale de modification
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedInterventionToEdit, setSelectedInterventionToEdit] = useState(null)

  const handleOpenEdit = (ticket) => {
    setSelectedInterventionToEdit(ticket)
    setIsEditModalOpen(true)
  }

  // 3. Appel API GET /api/reception/file-attente (tous les statuts, y compris Terminé)
  const fetchFileAttente = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await api.get('/reception/file-attente')
      if (res.data) {
        if (Array.isArray(res.data.vehicules)) {
          setVehicules(res.data.vehicules)
        }
        if (res.data.kpis) {
          setKpis(res.data.kpis)
        }
      }
    } catch (err) {
      console.error('Erreur chargement file d\'attente:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // 4. Suppression de ticket sécurisée (mise à jour du state UNIQUEMENT après succès API 200)
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce ticket ?')) return

    try {
      // 1. Envoi de la requête HTTP DELETE au serveur
      const response = await api.delete(`/reception/tickets/${ticketId}`)

      // 2. Vérification stricte du succès HTTP (200 OK / status success)
      if (response.status === 200 || response.data?.status === 'success') {
        // 3. Mise à jour du state local UNIQUEMENT après confirmation du serveur
        setVehicules((prevVehicules) =>
          prevVehicules.filter((v) => String(v.id) !== String(ticketId))
        )

        // Rafraîchissement discret des statistiques KPIs
        fetchFileAttente(true)
      } else {
        throw new Error(response.data?.message || 'Erreur lors de la suppression du ticket.')
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du ticket:', err)
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Erreur lors de la suppression du ticket en base de données.'
      alert(`⚠️ Échec de la suppression : ${errorMsg}`)
    }
  }

  // useEffect au montage
  useEffect(() => {
    fetchFileAttente(false)
  }, [fetchFileAttente])

  // Écouteur Reverb WebSockets Temps Réel
  useEffect(() => {
    const echoInstance = echo || window.Echo

    if (echoInstance) {
      const garageChannel = echoInstance.channel('garage')
      const atelierChannel = echoInstance.channel('atelier')

      const handleWebSocketEvent = (eventData) => {
        console.log('⚡ Événement Reverb capté sur FileAttenteView:', eventData)
        fetchFileAttente(true)
      }

      const handleTicketDeleted = (e) => {
        console.log('⚡ Événement TicketDeleted capté sur FileAttenteView:', e)
        const deletedId = e?.ticket_id || e?.id
        if (deletedId) {
          setVehicules((prev) => prev.filter((v) => String(v.id) !== String(deletedId)))
          fetchFileAttente(true)
        }
      }

      garageChannel.listen('.TicketCreated', handleWebSocketEvent)
      garageChannel.listen('TicketCreated', handleWebSocketEvent)
      garageChannel.listen('.TicketStatusUpdated', handleWebSocketEvent)
      garageChannel.listen('TicketStatusUpdated', handleWebSocketEvent)
      garageChannel.listen('.TicketDeleted', handleTicketDeleted)
      garageChannel.listen('TicketDeleted', handleTicketDeleted)

      atelierChannel.listen('InterventionStatusChanged', handleWebSocketEvent)
      atelierChannel.listen('.InterventionStatusChanged', handleWebSocketEvent)
      atelierChannel.listen('.intervention.updated', handleWebSocketEvent)
      atelierChannel.listen('intervention.updated', handleWebSocketEvent)
      atelierChannel.listen('.NewVehicleArrived', handleWebSocketEvent)
      atelierChannel.listen('NewVehicleArrived', handleWebSocketEvent)
      atelierChannel.listen('.TicketDeleted', handleTicketDeleted)
      atelierChannel.listen('TicketDeleted', handleTicketDeleted)

      return () => {
        garageChannel.stopListening('.TicketCreated')
        garageChannel.stopListening('TicketCreated')
        garageChannel.stopListening('.TicketStatusUpdated')
        garageChannel.stopListening('TicketStatusUpdated')
        garageChannel.stopListening('.TicketDeleted')
        garageChannel.stopListening('TicketDeleted')

        atelierChannel.stopListening('InterventionStatusChanged')
        atelierChannel.stopListening('.InterventionStatusChanged')
        atelierChannel.stopListening('.intervention.updated')
        atelierChannel.stopListening('intervention.updated')
        atelierChannel.stopListening('.NewVehicleArrived')
        atelierChannel.stopListening('NewVehicleArrived')
        atelierChannel.stopListening('.TicketDeleted')
        atelierChannel.stopListening('TicketDeleted')

        echoInstance.leaveChannel('garage')
        echoInstance.leaveChannel('atelier')
      }
    }
  }, [fetchFileAttente])

  // 2. Boucle de tri et de filtrage dynamique côté client
  const sortedVehicules = [...vehicules].sort((a, b) => {
    if (a.rdv !== b.rdv) return b.rdv ? 1 : -1
    return (a.heure || '').localeCompare(b.heure || '')
  })

  const vehiculesFiltres = sortedVehicules.filter((v) => {
    const st = String(v.statut || '').toLowerCase()
    if (activeFilter === 'En attente') return st === 'en attente' || st === 'en_attente'
    if (activeFilter === 'En cours') return st === 'en cours' || st === 'en_cours' || st === 'bloqué' || st === 'bloque'
    if (activeFilter === 'Terminés') return st === 'terminé' || st === 'termine'
    return true // 'Tous'
  })

  return (
    <div className="flex flex-col gap-6 min-h-full font-sans">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            File d'Attente &amp; Suivi
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Visualisez l'état de chaque véhicule en temps réel et gérez les affectations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Temps Réel Actif
          </span>
        </div>
      </div>

      {/* ── 2. Stat cards dynamique via state kpis ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Enregistrés</p>
          <p className="text-2xl font-black text-yellow-400">{kpis.total}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">En attente</p>
          <p className="text-2xl font-black text-amber-800">{kpis.en_attente}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">En cours</p>
          <p className="text-2xl font-black text-blue-800">{kpis.en_cours}</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Terminés</p>
          <p className="text-2xl font-black text-emerald-800">{kpis.termines}</p>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 w-fit">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id
          let tabCount = kpis.total
          if (tab.id === 'En attente') tabCount = kpis.en_attente
          if (tab.id === 'En cours') tabCount = kpis.en_cours
          if (tab.id === 'Terminés') tabCount = kpis.termines

          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-black ${
                isActive ? 'bg-slate-900 text-yellow-400' : 'bg-slate-200 text-slate-600'
              }`}>
                {tabCount}
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
            {vehiculesFiltres.length}
          </span>
        </div>
        <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
          <span>⚡ Trié par priorité RDV puis heure d'arrivée</span>
        </p>
      </div>

      {/* ── Empty state ── */}
      {loading ? (
        <div className="py-16 bg-white rounded-2xl border border-slate-200 text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500">Chargement de la file d'attente...</p>
        </div>
      ) : vehiculesFiltres.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <p className="text-base font-bold text-slate-700">Aucun véhicule pour le filtre ({activeFilter})</p>
          <p className="text-xs text-slate-400">Sélectionnez un autre onglet ou enregistrez un véhicule depuis la Prise en Charge.</p>
        </div>
      ) : (
        /* 2. Map sur vehiculesFiltres */
        <div className="flex flex-col gap-3">
          {vehiculesFiltres.map((vehicule) => (
            <QueueTicketCard
              key={vehicule.id}
              ticket={vehicule}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteTicket}
            />
          ))}
        </div>
      )}

      {/* Modale de Modification Dynamique */}
      <ModifierInterventionModal
        isOpen={isEditModalOpen}
        intervention={selectedInterventionToEdit}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedInterventionToEdit(null)
        }}
        onSaved={() => {
          fetchFileAttente(true)
        }}
      />

    </div>
  )
}
