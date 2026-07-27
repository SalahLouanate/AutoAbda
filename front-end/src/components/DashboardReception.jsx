import { useState, useEffect, useRef } from 'react'
import Select from 'react-select'
import { useReactToPrint } from 'react-to-print'
import api from '../api/axios'
import TicketTemplate from './TicketTemplate'

// ─── Catalogue d'options fictives pour react-select (fallback) ─────────────────
const DEFAULT_CATALOGUE_OPTIONS = [
  { value: 'Vidange & Filtres', label: 'Vidange & Filtres' },
  { value: 'Remplacement Plaquettes de Frein', label: 'Remplacement Plaquettes de Frein' },
  { value: 'Diagnostic Électronique', label: 'Diagnostic Électronique' },
  { value: 'Révision Complète', label: 'Révision Complète' },
  { value: 'Recharge Climatisation', label: 'Recharge Climatisation' },
  { value: 'Changement Amortisseurs', label: 'Changement Amortisseurs' },
  { value: 'Kit de Distribution', label: 'Kit de Distribution' },
  { value: 'Activation Options Cachées', label: 'Activation Options Cachées' },
  { value: 'Contrôle & Parallélisme', label: 'Contrôle & Parallélisme' },
]

// ─── Mock initial des véhicules en attente ─────────────────────────────────────
const INITIAL_TICKETS = [
  {
    id: 1,
    immat: '14582-A-26',
    marque: 'Renault Express',
    interventions: ['Vidange & Filtres', 'Remplacement Plaquettes de Frein'],
    rdv: true,
    heure: '08:30',
    technicien: 'Yassir Zimi',
  },
  {
    id: 2,
    immat: '98214-B-6',
    marque: 'Peugeot 308',
    interventions: ['Diagnostic Électronique'],
    rdv: false,
    heure: '09:15',
    technicien: 'Karim Benaissa',
  },
  {
    id: 3,
    immat: '54120-D-1',
    marque: 'Dacia Sandero',
    interventions: ['Vidange & Filtres', 'Diagnostic Électronique'],
    rdv: true,
    heure: '10:00',
    technicien: 'Hamid El Fassi',
  },
]

// ─── Composant Plaque d'immatriculation ─────────────────────────────────────────
function LicensePlate({ immat }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-lg shadow-sm font-mono font-black text-slate-900 tracking-wider">
      <span className="text-[10px] font-sans font-bold bg-slate-900 text-yellow-400 px-1 py-0.5 rounded leading-none">
        MA
      </span>
      <span className="text-sm font-extrabold">{immat || 'SANS-IMMAT'}</span>
    </div>
  )
}

// ─── Badge de Statut RDV ────────────────────────────────────────────────────────
function RdvStatusBadge({ rdv }) {
  return rdv ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
      Rendez-vous
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Sans RDV
    </span>
  )
}

// ─── Badge de Prestation (Pill discret) ──────────────────────────────────────────
function InterventionPill({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100/80">
      {label}
    </span>
  )
}

// ─── Carte Véhicule en Attente ──────────────────────────────────────────────────
function TicketCard({ ticket, onDelete, onPrint }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col gap-3 group relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <LicensePlate immat={ticket.immat} />
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-snug">{ticket.marque}</h3>
            <p className="text-xs text-slate-400 font-medium">Arrivée à {ticket.heure}</p>
          </div>
        </div>

        <RdvStatusBadge rdv={ticket.rdv} />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {ticket.interventions.map((i) => (
            <InterventionPill key={i} label={i} />
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onPrint(ticket)}
            title="Imprimer le ticket physique"
            className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-600">
              <path fillRule="evenodd" d="M7.875 1.5C6.839 1.5 6 2.34 6 3.375v2.99c-.426.053-.851.11-1.274.174-1.454.218-2.476 1.483-2.476 2.917v6.294a3 3 0 0 0 3 3h.27l-.155 1.705A1.875 1.875 0 0 0 7.232 22.5h9.536a1.875 1.875 0 0 0 1.867-2.045l-.155-1.705h.27a3 3 0 0 0 3-3V9.456c0-1.434-1.022-2.7-2.476-2.917A48.716 48.716 0 0 0 18 6.366V3.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM16.5 6.205v-2.83A.375.375 0 0 0 16.125 3h-8.25a.375.375 0 0 0-.375.375v2.83a49.353 49.353 0 0 1 9 0Zm-.217 8.265c.03.29.048.582.048.877a48.57 48.57 0 0 1-.31 5.48.75.75 0 0 1-.75.673H8.729a.75.75 0 0 1-.75-.673 48.57 48.57 0 0 1-.31-5.48c0-.295.018-.587.048-.877a49.788 49.788 0 0 0 8.556 0Zm-5.09 3.485a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75Zm2.25 1.5a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Z" clipRule="evenodd" />
            </svg>
            <span>Imprimer</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(ticket.id)}
            title="Supprimer le ticket"
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Composant Principal : DashboardReception ──────────────────────────────────
export default function DashboardReception() {
  const [catalogueOptions, setCatalogueOptions] = useState(DEFAULT_CATALOGUE_OPTIONS)
  const [selectedOptions, setSelectedOptions] = useState([])

  const [immat, setImmat] = useState('')
  const [marque, setMarque] = useState('')
  const [isRendezVous, setIsRendezVous] = useState(false)
  const [errors, setErrors] = useState({})

  const [tickets, setTickets] = useState(INITIAL_TICKETS)
  const [nextId, setNextId] = useState(4)
  const [successMsg, setSuccessMsg] = useState(false)

  // ── GESTION DE L'IMPRESSION REACT-TO-PRINT ASYNCHRONE ──────────────────────
  const [isPrinting, setIsPrinting] = useState(false)
  const [ticketToPrint, setTicketToPrint] = useState(null)
  const printRef = useRef(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    content: () => printRef.current,
    onAfterPrint: () => setIsPrinting(false),
  })

  // Au clic sur 'Imprimer' : Mise à jour du véhicule + isPrinting à true
  const triggerPrintTicket = (ticket) => {
    setTicketToPrint(ticket)
    setIsPrinting(true)
  }

  // Effect pour déclencher l'impression dès que les données du ticket sont prêtes
  useEffect(() => {
    if (isPrinting && ticketToPrint && printRef.current) {
      if (handlePrint) {
        handlePrint()
      }
    }
  }, [isPrinting, ticketToPrint])

  // ── AXIOS : Chargement des prestations depuis /api/reception/interventions ──
  useEffect(() => {
    const fetchCatalogue = async () => {
      try {
        const response = await api.get('/reception/interventions')
        if (response.data && Array.isArray(response.data.interventions) && response.data.interventions.length > 0) {
          const mapped = response.data.interventions.map((item) => ({
            value: item.nom,
            label: item.nom,
          }))
          setCatalogueOptions(mapped)
        }
      } catch (err) {
        console.log('Utilisation du catalogue par défaut pour React-Select:', err)
      }
    }
    fetchCatalogue()
  }, [])

  function validate() {
    const newErrors = {}
    if (!immat.trim()) newErrors.immat = 'L\'immatriculation est obligatoire.'
    if (!marque.trim()) newErrors.marque = 'La marque et le modèle sont obligatoires.'
    if (selectedOptions.length === 0) newErrors.interventions = 'Veuillez sélectionner au moins une intervention.'
    return newErrors
  }

  // ── AXIOS : Enregistrement du nouveau ticket via /api/reception/tickets ─────
  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      const payload = {
        immatriculation: immat.toUpperCase().trim(),
        marque: marque.trim(),
        is_rdv: isRendezVous,
        interventions: selectedOptions.map((opt) => opt.label),
      }

      const response = await api.post('/reception/tickets', payload)

      const newTicket = response.data.ticket || {
        id: nextId,
        immat: payload.immatriculation,
        marque: payload.marque,
        interventions: payload.interventions,
        rdv: isRendezVous,
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        technicien: 'Non assigné',
      }

      setTickets((prev) => [newTicket, ...prev])
      setTicketToPrint(newTicket)
      setNextId((n) => n + 1)
      setImmat('')
      setMarque('')
      setSelectedOptions([])
      setIsRendezVous(false)
      setErrors({})

      setSuccessMsg(true)
      setTimeout(() => setSuccessMsg(false), 3000)
    } catch (err) {
      console.error('Erreur lors de la création du ticket:', err)
      setErrors({ api: err.response?.data?.message || 'Erreur lors de l\'enregistrement du ticket.' })
    }
  }

  function handleDelete(id) {
    setTickets((prev) => prev.filter((t) => t.id !== id))
  }

  // Styles sur-mesure pour React-Select
  const selectCustomStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '0.75rem',
      borderColor: errors.interventions ? '#f87171' : state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      paddingTop: '2px',
      paddingBottom: '2px',
      '&:hover': {
        borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
      },
    }),
    option: (base, state) => ({
      ...base,
      borderRadius: '0.5rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'transparent',
      color: state.isSelected ? '#ffffff' : state.isFocused ? '#1d4ed8' : '#334155',
      cursor: 'pointer',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '1rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      padding: '4px',
      zIndex: 50,
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '0.5rem',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1d4ed8',
      fontSize: '0.75rem',
      fontWeight: '600',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#3b82f6',
      ':hover': {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
      },
    }),
  }

  return (
    <div className="flex flex-col gap-6 min-h-full font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Prise en Charge — Réception
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Enregistrez les entrées et imprimez les tickets physiques instantanément.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Réception Ouverte
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
            {tickets.length} véhicule{tickets.length > 1 ? 's' : ''} en attente
          </span>
        </div>
      </div>

      {/* Grille 2 Colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Formulaire Nouveau Ticket */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                +
              </div>
              <div>
                <p className="text-white font-bold text-sm">Nouveau Ticket</p>
                <p className="text-slate-400 text-xs">Enregistrer un véhicule</p>
              </div>
            </div>

            {successMsg && (
              <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                ✓ Ticket créé et prêt pour impression !
              </div>
            )}

            {errors.api && (
              <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                ⚠ {errors.api}
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Immatriculation
                </label>
                <input
                  type="text"
                  value={immat}
                  onChange={(e) => {
                    setImmat(e.target.value)
                    setErrors((err) => ({ ...err, immat: undefined }))
                  }}
                  placeholder="ex: 14582-A-26"
                  className={`w-full font-mono font-bold text-slate-800 text-sm px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 ${
                    errors.immat ? 'border-rose-400 ring-1 ring-rose-400' : 'border-gray-300'
                  }`}
                />
                {errors.immat && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.immat}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Marque &amp; Modèle
                </label>
                <input
                  type="text"
                  value={marque}
                  onChange={(e) => {
                    setMarque(e.target.value)
                    setErrors((err) => ({ ...err, marque: undefined }))
                  }}
                  placeholder="ex: Renault Express 2021"
                  className={`w-full text-slate-800 text-sm px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition placeholder:text-slate-400 ${
                    errors.marque ? 'border-rose-400 ring-1 ring-rose-400' : 'border-gray-300'
                  }`}
                />
                {errors.marque && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.marque}</p>}
              </div>

              {/* REACT-SELECT */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Interventions (React-Select)
                </label>
                <Select
                  isMulti
                  options={catalogueOptions}
                  value={selectedOptions}
                  onChange={(selected) => {
                    setSelectedOptions(selected || [])
                    setErrors((err) => ({ ...err, interventions: undefined }))
                  }}
                  placeholder="Rechercher des prestations..."
                  styles={selectCustomStyles}
                  noOptionsMessage={() => 'Aucune prestation trouvée'}
                />
                {errors.interventions && (
                  <p className="text-rose-500 text-xs mt-1 font-medium">{errors.interventions}</p>
                )}
              </div>

              {/* Toggle Switch RDV */}
              <div className="pt-1">
                <div
                  onClick={() => setIsRendezVous((prev) => !prev)}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer select-none"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">Client sur Rendez-vous</p>
                    <p className="text-[11px] text-slate-400">
                      {isRendezVous ? 'Passage prioritaire garanti' : 'Passage selon file sans RDV'}
                    </p>
                  </div>
                  <div
                    className={`w-11 h-6 p-0.5 rounded-full transition-colors duration-200 shrink-0 ${
                      isRendezVous ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        isRendezVous ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Créer le Ticket</span>
              </button>
            </form>
          </div>
        </div>

        {/* Liste des Véhicules en attente */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Véhicules en attente
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold">
                {tickets.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">Impression via React-To-Print</p>
          </div>

          {tickets.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 text-slate-400">
              <p className="text-sm font-bold text-slate-600">Aucun véhicule en attente</p>
              <p className="text-xs mt-1">Utilisez le formulaire pour enregistrer une arrivée.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {[
                ...tickets.filter((t) => t.rdv),
                ...tickets.filter((t) => !t.rdv).sort((a, b) => a.heure.localeCompare(b.heure)),
              ].map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onDelete={handleDelete}
                  onPrint={triggerPrintTicket}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MASQUAGE ACCESSIBLE HORS ÉCRAN SANS HIDDEN / OPACITY-0 / H-0 / DISPLAY:NONE */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <TicketTemplate ref={printRef} data={ticketToPrint} />
      </div>
    </div>
  )
}
