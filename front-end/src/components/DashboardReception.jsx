import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Select from 'react-select'
import { useReactToPrint } from 'react-to-print'
import api from '../api/axios'
import echo from '../echo'
import TicketTemplate from './TicketTemplate'

// ─── Catalogue d'options par défaut pour le formulaire (fallback) ─────────────
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

// ─── Composant Plaque d'immatriculation haute visibilité ────────────────────────
function LicensePlate({ immat }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border-2 border-slate-900 rounded-lg shadow-sm font-mono font-black text-slate-900 tracking-wider shrink-0">
      <span className="text-[9px] font-sans font-bold bg-slate-900 text-yellow-400 px-1 py-0.5 rounded leading-none">
        MA
      </span>
      <span className="text-xs font-extrabold">{immat || 'SANS-IMMAT'}</span>
    </div>
  )
}

// ─── Badge de Statut RDV ────────────────────────────────────────────────────────
function RdvStatusBadge({ rdv }) {
  return rdv ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
      Rendez-vous
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Sans RDV
    </span>
  )
}

// ─── Badge de Statut Avancement ────────────────────────────────────────────────
// ─── Badge de Statut Avancement (Couleurs douces et texte lisible) ──────────────
function StatutBadge({ statut }) {
  const st = String(statut || '').toLowerCase()
  if (st === 'en cours' || st === 'en_cours') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200 shrink-0 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
        En cours
      </span>
    )
  }
  if (st === 'bloqué' || st === 'bloque') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 shrink-0 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
        Bloqué
      </span>
    )
  }
  if (st === 'terminé' || st === 'termine') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        Terminé
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200 shrink-0 shadow-2xs">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      En attente
    </span>
  )
}

// ─── Badge de Prestation (wrap-friendly, no truncate conflict) ────────────────
function InterventionPill({ label }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 whitespace-normal break-words leading-snug">
      {label}
    </span>
  )
}

// ─── Ligne Véhicule en Attente (Grid 12, Data Binding Dynamique Strict) ─────────
function TicketRow({ ticket, index, onDelete, onPrint }) {
  const isFirst = index === 0
  const isEnAttente = ticket.statut === 'En attente' || ticket.statut === 'en_attente'
  const isPriorityBadgeVisible = isFirst && isEnAttente
  const orderNum = index + 1

  // Extraction dynamique de la plaque d'immatriculation
  const immatDisplay = ticket.immat || ticket.immatriculation || ticket.vehicule?.matricule || 'SANS-IMMAT'

  // Extraction dynamique de la marque et du modèle sans mot codé en dur
  const marqueDisplay = ticket.marque || (ticket.vehicule ? `${ticket.vehicule.marque} ${ticket.vehicule.modele}` : 'Véhicule')

  // Extraction dynamique de l'heure d'arrivée
  const heureDisplay = ticket.heure || (ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Récent')

  // Extraction dynamique du technicien assigné
  const techNom =
    typeof ticket.technicien === 'object' && ticket.technicien !== null
      ? ticket.technicien.nom || ticket.technicien.name
      : typeof ticket.technicien === 'string'
      ? ticket.technicien
      : 'Non assigné'

  // Extraction des prestations sous forme de tableau
  const listPrestations = Array.isArray(ticket.interventions)
    ? ticket.interventions
    : Array.isArray(ticket.prestations)
    ? ticket.prestations.map((p) => p.nom || p)
    : ticket.type_intervention
    ? [ticket.type_intervention]
    : []

  return (
    <li
      className={`grid grid-cols-12 gap-x-4 gap-y-2 items-center px-5 py-4 transition-all duration-200 group border-b border-slate-100/80 ${
        isPriorityBadgeVisible
          ? 'bg-emerald-50/60 hover:bg-emerald-50/90 border-l-4 border-l-emerald-600'
          : 'hover:bg-slate-50/80'
      }`}
    >
      {/* Col 1 (col-span-1) : Numéro d'ordre */}
      <div className="col-span-1 flex items-center justify-center">
        <span
          className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
            isPriorityBadgeVisible
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {orderNum}
        </span>
      </div>

      {/* Col 2 (col-span-2) : Plaque d'immatriculation */}
      <div className="col-span-2 min-w-0 flex items-center">
        <LicensePlate immat={immatDisplay} />
      </div>

      {/* Col 3 (col-span-3) : Véhicule & Heure */}
      <div className="col-span-3 min-w-0 flex flex-col justify-center gap-0.5">
        {isPriorityBadgeVisible && (
          <span className="inline-flex items-center gap-1 bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full animate-pulse w-fit shadow-sm mb-0.5">
            <span>⚡</span>
            <span>Au tour de ce client</span>
          </span>
        )}
        <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">{marqueDisplay}</h3>
        <p className="text-xs text-slate-400 font-medium">Arrivée à {heureDisplay}</p>
      </div>

      {/* Col 4 (col-span-2) : Technicien */}
      <div className="col-span-2 min-w-0">
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60 max-w-full overflow-hidden">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-blue-600 shrink-0">
            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm-2 5V6a2 2 0 114 0v1H8z" clipRule="evenodd" />
          </svg>
          <span className="font-medium text-slate-500 truncate">
            <strong className="text-slate-900 font-bold">{techNom}</strong>
          </span>
        </div>
      </div>

      {/* Col 5 (col-span-2) : Prestations - flex-wrap pour les badges */}
      <div className="col-span-2 min-w-0 flex flex-wrap items-start gap-1.5">
        {listPrestations.length > 0
          ? listPrestations.map((prestItem, idx) => (
              <InterventionPill key={idx} label={prestItem} />
            ))
          : <span className="text-xs text-slate-400 italic">—</span>
        }
      </div>

      {/* Col 6 (col-span-2) : Badges Statut + RDV + Boutons actions, tout en colonne */}
      <div className="col-span-2 min-w-0 flex flex-col items-end gap-1.5">
        {/* Badges sur leur propre ligne, avec retour à la ligne possible */}
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <StatutBadge statut={ticket.statut} />
          <RdvStatusBadge rdv={ticket.rdv} />
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onPrint(ticket)}
            title="Imprimer le ticket physique"
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-blue-500">
              <path fillRule="evenodd" d="M7.875 1.5C6.839 1.5 6 2.34 6 3.375v2.99c-.426.053-.851.11-1.274.174-1.454.218-2.476 1.483-2.476 2.917v6.294a3 3 0 0 0 3 3h.27l-.155 1.705A1.875 1.875 0 0 0 7.232 22.5h9.536a1.875 1.875 0 0 0 1.867-2.045l-.155-1.705h.27a3 3 0 0 0 3-3V9.456c0-1.434-1.022-2.7-2.476-2.917A48.716 48.716 0 0 0 18 6.366V3.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM16.5 6.205v-2.83A.375.375 0 0 0 16.125 3h-8.25a.375.375 0 0 0-.375.375v2.83a49.353 49.353 0 0 1 9 0Zm-.217 8.265c.03.29.048.582.048.877a48.57 48.57 0 0 1-.31 5.48.75.75 0 0 1-.75.673H8.729a.75.75 0 0 1-.75-.673 48.57 48.57 0 0 1-.31-5.48c0-.295.018-.587.048-.877a49.788 49.788 0 0 0 8.556 0Zm-5.09 3.485a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75Zm2.25 1.5a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onDelete(ticket.id)}
            title="Supprimer le ticket"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  )
}

// ─── Modale de Création (Design Large max-w-4xl) ────────────────────────────────
function CreateTicketModal({
  isOpen,
  onClose,
  catalogueOptions,
  techniciensDisponibles,
  onTicketCreatedSuccess,
  setTicketToPrint,
  handlePrint,
}) {
  const [immat, setImmat] = useState('')
  const [marque, setMarque] = useState('')
  const [selectedOptions, setSelectedOptions] = useState([])
  const [isRendezVous, setIsRendezVous] = useState(false)
  const [modeAttribution, setModeAttribution] = useState('auto')
  const [selectedTechnicienId, setSelectedTechnicienId] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [ticketCreated, setTicketCreated] = useState(false)
  const [createdTicketData, setCreatedTicketData] = useState(null)

  // 1. State propre pour le catalogue issu de l'API
  const [catalogue, setCatalogue] = useState([])

  // 2. Chargement Axios du catalogue dynamique au montage / ouverture
  useEffect(() => {
    const fetchCatalogue = async () => {
      try {
        const res = await api.get('/reception/catalogue')
        const items = res.data?.catalogue || res.data?.interventions || []
        setCatalogue(items)
      } catch (err) {
        console.error('Erreur chargement catalogue modal:', err)
      }
    }
    if (isOpen) {
      fetchCatalogue()
    }
  }, [isOpen])

  // 3. Options du Select dynamique : value = ID entier strict, label = nom_intervention (temps_bareme min)
  const selectOptions = useMemo(() => {
    const list = catalogue.length > 0 ? catalogue : (catalogueOptions || [])
    return list.map((item) => {
      const idVal = item.id || item.value
      const nameVal = item.nom_intervention || item.nom || item.label || ''
      const baremeVal = item.temps_bareme
      return {
        value: idVal, // ID entier strict
        label: baremeVal ? `${nameVal} (${baremeVal} min)` : nameVal,
        nom_intervention: nameVal,
      }
    })
  }, [catalogue, catalogueOptions])

  const resetForm = () => {
    setImmat('')
    setMarque('')
    setSelectedOptions([])
    setIsRendezVous(false)
    setModeAttribution('auto')
    setSelectedTechnicienId('')
    setErrors({})
    setTicketCreated(false)
    setCreatedTicketData(null)
  }

  const handleCloseModal = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  function validate() {
    const newErrors = {}
    if (!immat.trim()) newErrors.immat = 'L\'immatriculation est obligatoire.'
    if (!marque.trim()) newErrors.marque = 'La marque et le modèle sont obligatoires.'
    if (selectedOptions.length === 0) newErrors.interventions = 'Veuillez sélectionner au moins une intervention.'
    if (modeAttribution === 'manuel' && !selectedTechnicienId) {
      newErrors.technicien = 'Veuillez choisir un technicien pour l\'attribution manuelle.'
    }
    return newErrors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    try {
      // Payload Axios envoyant les IDs d'interventions stricts [16, 2]
      const payload = {
        immatriculation: immat.toUpperCase().trim(),
        marque: marque.trim(),
        is_rdv: isRendezVous,
        interventions: selectedOptions.map((opt) => opt.value),
        mode_attribution: modeAttribution,
        technicien_id: modeAttribution === 'manuel' ? parseInt(selectedTechnicienId, 10) : null,
      }

      const response = await api.post('/reception/tickets', payload)

      const newTicket = response.data.ticket || {
        id: Date.now(),
        immat: payload.immatriculation,
        marque: payload.marque,
        interventions: selectedOptions.map((opt) => opt.nom_intervention || opt.label),
        rdv: isRendezVous,
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        technicien: 'Assigné',
        statut: 'En attente',
      }

      onTicketCreatedSuccess(newTicket)
      setTicketToPrint(newTicket)
      setCreatedTicketData(newTicket)
      setTicketCreated(true)
      setIsSubmitting(false)
    } catch (err) {
      console.error('Erreur lors de la création du ticket:', err)
      setErrors({ api: err.response?.data?.message || 'Erreur lors de l\'enregistrement du ticket.' })
      setIsSubmitting(false)
    }
  }

  const handlePrintAndFinish = () => {
    if (createdTicketData && createdTicketData.id) {
      window.open(`/print/ticket/${createdTicketData.id}`, '_blank')
    }
    handleCloseModal()
  }

  const selectCustomStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '0.75rem',
      borderColor: errors.interventions ? '#f87171' : state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      paddingTop: '2px',
      paddingBottom: '2px',
    }),
    option: (base, state) => ({
      ...base,
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'transparent',
      color: state.isSelected ? '#ffffff' : state.isFocused ? '#1d4ed8' : '#334155',
      cursor: 'pointer',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '1rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      padding: '4px',
      zIndex: 60,
    }),
  }

  const assignedTechNom =
    createdTicketData && typeof createdTicketData.technicien === 'object' && createdTicketData.technicien !== null
      ? createdTicketData.technicien.nom || createdTicketData.technicien.name
      : createdTicketData?.technicien || 'Assigné'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={handleCloseModal}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-5 bg-slate-900 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-lg text-white">
              +
            </div>
            <div>
              <h2 className="text-lg font-bold">Nouveau Ticket de Prise en Charge</h2>
              <p className="text-xs text-slate-400">Remplissez les informations du véhicule et l'attribution</p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-8">
          {!ticketCreated ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
              {errors.api && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2">
                  ⚠ {errors.api}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className={`w-full font-mono font-bold text-slate-800 text-sm px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase transition placeholder:normal-case placeholder:font-normal ${
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
                    className={`w-full text-slate-800 text-sm px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                      errors.marque ? 'border-rose-400 ring-1 ring-rose-400' : 'border-gray-300'
                    }`}
                  />
                  {errors.marque && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.marque}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Interventions à réaliser
                </label>
                <Select
                  isMulti
                  options={selectOptions}
                  value={selectedOptions}
                  onChange={(selected) => {
                    setSelectedOptions(selected || [])
                    setErrors((err) => ({ ...err, interventions: undefined }))
                  }}
                  placeholder="Rechercher et sélectionner des prestations..."
                  styles={selectCustomStyles}
                  noOptionsMessage={() => 'Aucune prestation disponible'}
                />
                {errors.interventions && (
                  <p className="text-rose-500 text-xs mt-1 font-medium">{errors.interventions}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Mode d'Attribution Technicien
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setModeAttribution('auto')
                        setErrors((err) => ({ ...err, technicien: undefined }))
                      }}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        modeAttribution === 'auto'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <span>⚡ Auto (Moins chargé)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModeAttribution('manuel')}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        modeAttribution === 'manuel'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <span>🛠️ Manuel</span>
                    </button>
                  </div>
                </div>

                {modeAttribution === 'manuel' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Technicien Assigné
                    </label>
                    <select
                      value={selectedTechnicienId}
                      onChange={(e) => {
                        setSelectedTechnicienId(e.target.value)
                        setErrors((err) => ({ ...err, technicien: undefined }))
                      }}
                      className={`w-full text-slate-800 text-sm px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition cursor-pointer ${
                        errors.technicien ? 'border-rose-400 ring-1 ring-rose-400' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Choisir un technicien --</option>
                      {techniciensDisponibles.map((tech) => {
                        const isMaint = tech.is_maintenance || (tech.pont_statut && (tech.pont_statut.toLowerCase().includes('maint') || tech.pont_statut.toLowerCase().includes('hors')))
                        return (
                          <option key={tech.id} value={tech.id} disabled={isMaint}>
                            {tech.nom || tech.name} {isMaint ? ' ⚠️ (Pont en maintenance)' : ''}
                          </option>
                        )
                      })}
                    </select>
                    {errors.technicien && (
                      <p className="text-rose-500 text-xs mt-1 font-medium">{errors.technicien}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <div
                  onClick={() => setIsRendezVous((prev) => !prev)}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer select-none"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800">Client sur Rendez-vous</p>
                    <p className="text-xs text-slate-400">
                      {isRendezVous ? 'Passage prioritaire garanti en atelier' : 'Passage selon file d\'attente standard'}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-6 p-0.5 rounded-full transition-colors duration-200 shrink-0 ${
                      isRendezVous ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        isRendezVous ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Créer le Ticket'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-6 gap-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-extrabold text-3xl shadow-inner">
                ✓
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-slate-800">Ticket Créé avec Succès !</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                  Le véhicule <strong className="text-slate-800 font-mono">{createdTicketData?.immat}</strong> ({createdTicketData?.marque}) a été enregistré et assigné au technicien <strong className="text-blue-600 font-bold">{assignedTechNom}</strong>.
                </p>
              </div>

              <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left flex flex-col gap-2 font-mono text-xs text-slate-700">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400">Immatriculation:</span>
                  <span className="font-bold text-slate-900">{createdTicketData?.immat}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400">Marque & Modèle:</span>
                  <span className="font-bold text-slate-900">{createdTicketData?.marque}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400">Technicien Assigné:</span>
                  <span className="font-bold text-blue-600">{assignedTechNom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Prestations:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">
                    {Array.isArray(createdTicketData?.interventions)
                      ? createdTicketData.interventions.join(', ')
                      : createdTicketData?.interventions}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-4">
                <button
                  type="button"
                  onClick={handlePrintAndFinish}
                  className="w-full sm:flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M7.875 1.5C6.839 1.5 6 2.34 6 3.375v2.99c-.426.053-.851.11-1.274.174-1.454.218-2.476 1.483-2.476 2.917v6.294a3 3 0 0 0 3 3h.27l-.155 1.705A1.875 1.875 0 0 0 7.232 22.5h9.536a1.875 1.875 0 0 0 1.867-2.045l-.155-1.705h.27a3 3 0 0 0 3-3V9.456c0-1.434-1.022-2.7-2.476-2.917A48.716 48.716 0 0 0 18 6.366V3.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM16.5 6.205v-2.83A.375.375 0 0 0 16.125 3h-8.25a.375.375 0 0 0-.375.375v2.83a49.353 49.353 0 0 1 9 0Zm-.217 8.265c.03.29.048.582.048.877a48.57 48.57 0 0 1-.31 5.48.75.75 0 0 1-.75.673H8.729a.75.75 0 0 1-.75-.673 48.57 48.57 0 0 1-.31-5.48c0-.295.018-.587.048-.877a49.788 49.788 0 0 0 8.556 0Zm-5.09 3.485a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75Zm2.25 1.5a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Z" clipRule="evenodd" />
                  </svg>
                  <span>Imprimer et Terminer</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Fermer sans imprimer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Composant de Pagination Dynamique ─────────────────────────────────────────
function PaginationControls({ currentPage, lastPage, onPageChange }) {
  if (!lastPage || lastPage <= 1) return null

  const pages = []
  for (let i = 1; i <= lastPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200/80 rounded-b-2xl shadow-xs mt-1">
      <p className="text-xs font-semibold text-slate-500">
        Page <span className="font-bold text-slate-900">{currentPage}</span> sur{' '}
        <span className="font-bold text-slate-900">{lastPage}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
        >
          &larr; Précédent
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                p === currentPage
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= lastPage}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
        >
          Suivant &rarr;
        </button>
      </div>
    </div>
  )
}

// ─── Composant Principal : DashboardReception ──────────────────────────────────
export default function DashboardReception() {
  const [catalogueOptions, setCatalogueOptions] = useState(DEFAULT_CATALOGUE_OPTIONS)
  const [techniciensDisponibles, setTechniciensDisponibles] = useState([])
  
  // 1. Initialisation stricte des states à vide + Pagination
  const [vehicules, setVehicules] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [kpis, setKpis] = useState({
    total: 0,
    en_attente: 0,
    en_cours: 0,
    termines: 0,
  })

  // Onglet de filtrage côté client ('Tous', 'En attente', 'En cours')
  const [filterTab, setFilterTab] = useState('Tous')
  const [sortBy, setSortBy] = useState('rdv')

  // Modale de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Impression
  const [ticketToPrint, setTicketToPrint] = useState(null)
  const printRef = useRef(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    content: () => printRef.current,
  })

  const triggerPrintTicket = (ticket) => {
    const id = typeof ticket === 'object' ? ticket?.id : ticket
    if (id) {
      window.open(`/print/ticket/${id}`, '_blank')
    }
  }

  // 3. AXIOS : GET /api/reception/file-attente (tickets actifs uniquement — Prise en Charge)
  const fetchFileAttente = useCallback(async (silent = false, page = 1) => {
    try {
      const res = await api.get(`/reception/file-attente?active_only=true&page=${page}`)
      if (res.data) {
        if (Array.isArray(res.data.vehicules)) {
          setVehicules(res.data.vehicules)
        } else if (Array.isArray(res.data.data)) {
          setVehicules(res.data.data)
        }
        if (res.data.kpis) {
          setKpis(res.data.kpis)
        }
        const cp = res.data.current_page || res.data.pagination?.current_page || page
        const lp = res.data.last_page || res.data.pagination?.last_page || 1
        setCurrentPage(cp)
        setLastPage(lp)
      }
    } catch (err) {
      console.error('Erreur chargement file d\'attente:', err)
    }
  }, [])

  // useEffect au montage
  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await api.get('/reception/interventions')
        if (catRes.data && Array.isArray(catRes.data.interventions) && catRes.data.interventions.length > 0) {
          const mapped = catRes.data.interventions.map((item) => ({
            value: item.nom,
            label: item.nom,
          }))
          setCatalogueOptions(mapped)
        }
      } catch (err) {
        console.log('Catalogue fallback utilisé:', err)
      }

      // Consommation API Back-end
      await fetchFileAttente(false)

      try {
        const techRes = await api.get('/reception/techniciens-disponibles')
        if (techRes.data && Array.isArray(techRes.data.techniciens)) {
          setTechniciensDisponibles(techRes.data.techniciens)
        }
      } catch (err) {
        console.error('Erreur chargement techniciens disponibles:', err)
      }
    }

    fetchData()
  }, [fetchFileAttente])

  // Écouteur Reverb WebSockets Temps Réel
  useEffect(() => {
    const echoInstance = echo || window.Echo

    if (echoInstance) {
      const garageChannel = echoInstance.channel('garage')
      const atelierChannel = echoInstance.channel('atelier')

      const handleWebSocketEvent = (eventData) => {
        console.log('⚡ Événement temps réel Reverb capté sur Réception:', eventData)
        fetchFileAttente(true)
      }

      garageChannel.listen('.TicketCreated', handleWebSocketEvent)
      garageChannel.listen('TicketCreated', handleWebSocketEvent)
      garageChannel.listen('.TicketStatusUpdated', handleWebSocketEvent)
      garageChannel.listen('TicketStatusUpdated', handleWebSocketEvent)

      atelierChannel.listen('InterventionStatusChanged', handleWebSocketEvent)
      atelierChannel.listen('.InterventionStatusChanged', handleWebSocketEvent)
      atelierChannel.listen('.intervention.updated', handleWebSocketEvent)
      atelierChannel.listen('intervention.updated', handleWebSocketEvent)
      atelierChannel.listen('.NewVehicleArrived', handleWebSocketEvent)
      atelierChannel.listen('NewVehicleArrived', handleWebSocketEvent)

      return () => {
        garageChannel.stopListening('.TicketCreated')
        garageChannel.stopListening('TicketCreated')
        garageChannel.stopListening('.TicketStatusUpdated')
        garageChannel.stopListening('TicketStatusUpdated')

        atelierChannel.stopListening('InterventionStatusChanged')
        atelierChannel.stopListening('.InterventionStatusChanged')
        atelierChannel.stopListening('.intervention.updated')
        atelierChannel.stopListening('intervention.updated')
        atelierChannel.stopListening('.NewVehicleArrived')
        atelierChannel.stopListening('NewVehicleArrived')

        echoInstance.leaveChannel('garage')
        echoInstance.leaveChannel('atelier')
      }
    }
  }, [fetchFileAttente])

  const handleTicketCreatedSuccess = (newTicket) => {
    setVehicules((prev) => [newTicket, ...prev])
    setKpis((prev) => ({
      ...prev,
      total: prev.total + 1,
      en_attente: prev.en_attente + 1,
    }))
  }

  // Ouvre la modale et mémorise l'ID du ticket ciblé
  const handleDelete = (id) => {
    setTicketToDelete(id)
    setIsDeleteModalOpen(true)
  }

  // Appel API réel — déclenché UNIQUEMENT depuis le bouton "Confirmer" de la modale
  const confirmDelete = async () => {
    const id = ticketToDelete

    // Fermer la modale immédiatement et vider l'état
    setIsDeleteModalOpen(false)
    setTicketToDelete(null)

    try {
      // 1. Attendre la réponse réelle du serveur (suppression en BDD)
      const response = await api.delete(`/reception/tickets/${id}`)

      // 2. Mise à jour du DOM UNIQUEMENT si le serveur confirme HTTP 200 / 204
      if (response.status === 200 || response.status === 204 || response.data?.status === 'success') {
        setVehicules((prev) => prev.filter((t) => String(t.id) !== String(id)))
        setKpis((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }))
        console.log('✅ Suppression réussie en base de données (ID:', id, ')')
      } else {
        throw new Error(response.data?.message || 'Le serveur a retourné une réponse inattendue.')
      }
    } catch (error) {
      // 3. En cas d'erreur serveur, le ticket RESTE affiché — aucun state modifié
      console.error('❌ Échec de la suppression côté serveur :', error)
      const detail =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Erreur inconnue. Regardez la console pour le détail.'
      alert(`⚠️ Erreur : Le serveur a refusé de supprimer ce ticket.\n${detail}`)
    }
  }

  // Tri dynamique local
  const sortedVehicules = [...vehicules].sort((a, b) => {
    if (sortBy === 'rdv') {
      if (a.rdv !== b.rdv) return b.rdv ? 1 : -1
      return (a.heure || '').localeCompare(b.heure || '')
    } else {
      return (a.heure || '').localeCompare(b.heure || '')
    }
  })

  // 2. Boucle de filtrage côté client pour les onglets
  const vehiculesFiltres = sortedVehicules.filter((v) => {
    const st = String(v.statut || '').toLowerCase()
    if (filterTab === 'En attente') return st === 'en attente' || st === 'en_attente'
    if (filterTab === 'En cours') return st === 'en cours' || st === 'en_cours' || st === 'bloqué' || st === 'bloque'
    return true // 'Tous'
  })

  return (
    <div className="flex flex-col gap-6 min-h-full font-sans w-full">
      {/* Page Header (100% largeur disponible) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            Prise en Charge &amp; File d'Attente
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gérez la file d'attente des véhicules et attribuez les travaux en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Réception Ouverte
          </span>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
            {vehicules.length} véhicule{vehicules.length > 1 ? 's' : ''} enregistré{vehicules.length > 1 ? 's' : ''}
          </span>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="py-3 px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center gap-2 ml-2"
          >
            <span className="text-lg leading-none">+</span>
            <span>Nouveau Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. Remplacement des statistiques par le state kpis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-400 uppercase">Total Enregistrés</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{kpis.total}</p>
        </div>
        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 shadow-xs">
          <p className="text-xs font-semibold text-amber-700 uppercase">En Attente</p>
          <p className="text-2xl font-black text-amber-800 mt-1">{kpis.en_attente}</p>
        </div>
        <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 shadow-xs">
          <p className="text-xs font-semibold text-blue-700 uppercase">En Cours</p>
          <p className="text-2xl font-black text-blue-800 mt-1">{kpis.en_cours}</p>
        </div>
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 shadow-xs">
          <p className="text-xs font-semibold text-emerald-700 uppercase">Clôturés</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{kpis.termines}</p>
        </div>
      </div>

      {/* Section Liste des Véhicules */}
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          {/* Onglets de filtrage */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'Tous', label: 'Tous', count: kpis.total },
              { id: 'En attente', label: 'En attente', count: kpis.en_attente },
              { id: 'En cours', label: 'En cours', count: kpis.en_cours },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  filterTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                  filterTab === tab.id ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tri local */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Trier par :</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setSortBy('rdv')}
                className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                  sortBy === 'rdv'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Priorité RDV
              </button>
              <button
                type="button"
                onClick={() => setSortBy('heure')}
                className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                  sortBy === 'heure'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Heure d'arrivée
              </button>
            </div>
          </div>
        </div>

        {vehiculesFiltres.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-gray-300 text-slate-400 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl font-bold mb-1">
              🚗
            </div>
            <p className="text-base font-bold text-slate-700">Aucun véhicule dans cette catégorie ({filterTab})</p>
            <p className="text-xs text-slate-400">Sélectionnez un autre onglet ou créez un nouveau ticket.</p>
          </div>
        ) : (
          /* 2. Map sur vehiculesFiltres */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full">
            <ul className="divide-y divide-gray-100 w-full">
              {vehiculesFiltres.map((ticket, index) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  index={index}
                  onDelete={handleDelete}
                  onPrint={triggerPrintTicket}
                />
              ))}
            </ul>

            <PaginationControls
              currentPage={currentPage}
              lastPage={lastPage}
              onPageChange={(p) => fetchFileAttente(false, p)}
            />
          </div>
        )}
      </div>

      {/* Modale de Création */}
      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        catalogueOptions={catalogueOptions}
        techniciensDisponibles={techniciensDisponibles}
        onTicketCreatedSuccess={handleTicketCreatedSuccess}
        setTicketToPrint={setTicketToPrint}
        handlePrint={handlePrint}
      />

      <div className="absolute left-[-9999px] top-[-9999px]">
        <TicketTemplate ref={printRef} data={ticketToPrint} />
      </div>

      {/* ─── Modale de Confirmation de Suppression ─────────────────────────────── */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setIsDeleteModalOpen(false); setTicketToDelete(null) }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5 animate-[fadeInScale_0.18s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icône + Titre */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7 text-rose-600">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Confirmer la suppression</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Êtes-vous sûr de vouloir supprimer ce ticket ?<br />
                  <span className="font-semibold text-rose-600">Cette action est irréversible.</span>
                </p>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex items-center justify-end gap-3 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setTicketToDelete(null) }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-sm font-bold shadow-lg shadow-rose-600/25 transition-all cursor-pointer flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                </svg>
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
