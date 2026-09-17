import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Select from 'react-select'
import { useReactToPrint } from 'react-to-print'
import api from '../api/axios'
import echo from '../echo'
import TicketTemplate from './TicketTemplate'
import ModifierInterventionModal from './ModifierInterventionModal'

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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
      Rendez-vous
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
      Sans RDV
    </span>
  )
}

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
      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
      En attente
    </span>
  )
}

// ─── Badge de Prestation (wrap-friendly, no truncate conflict) ────────────────
function InterventionPill({ label }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 whitespace-normal break-words leading-snug">
      {label}
    </span>
  )
}

// ─── Ligne Véhicule en Attente (Grid 12, Data Binding Dynamique Strict) ─────────
function TicketRow({ ticket, index, onDelete, onPrint, onEdit }) {
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
      className={`flex flex-col gap-3 px-3 sm:px-5 py-4 transition-all duration-200 group border-b border-slate-200 ${
        isPriorityBadgeVisible
          ? 'bg-emerald-50/70 hover:bg-emerald-50 border-l-4 border-l-emerald-600'
          : 'bg-white hover:bg-slate-50'
      }`}
    >
      {/* Ligne 1 : Numéro + Plaque + Boutons actions */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 ${
              isPriorityBadgeVisible
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {orderNum}
          </span>
          <LicensePlate immat={immatDisplay} />
        </div>

        {/* Boutons d'action — toujours visibles à droite */}
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(ticket)}
              title="Modifier l'intervention"
              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 bg-white transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-600">
                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => onPrint(ticket)}
            title="Imprimer le ticket physique"
            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 bg-white transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-600">
              <path fillRule="evenodd" d="M7.875 1.5C6.839 1.5 6 2.34 6 3.375v2.99c-.426.053-.851.11-1.274.174-1.454.218-2.476 1.483-2.476 2.917v6.294a3 3 0 0 0 3 3h.27l-.155 1.705A1.875 1.875 0 0 0 7.232 22.5h9.536a1.875 1.875 0 0 0 1.867-2.045l-.155-1.705h.27a3 3 0 0 0 3-3V9.456c0-1.434-1.022-2.7-2.476-2.917A48.716 48.716 0 0 0 18 6.366V3.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM16.5 6.205v-2.83A.375.375 0 0 0 16.125 3h-8.25a.375.375 0 0 0-.375.375v2.83a49.353 49.353 0 0 1 9 0Zm-.217 8.265c.03.29.048.582.048.877a48.57 48.57 0 0 1-.31 5.48.75.75 0 0 1-.75.673H8.729a.75.75 0 0 1-.75-.673 48.57 48.57 0 0 1-.31-5.48c0-.295.018-.587.048-.877a49.788 49.788 0 0 0 8.556 0Zm-5.09 3.485a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75Zm2.25 1.5a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onDelete(ticket.id)}
            title="Supprimer le ticket"
            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 bg-white transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-rose-600">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Ligne 2 : Véhicule & Heure */}
      <div className="flex flex-col gap-0.5 min-w-0 w-full">
        {isPriorityBadgeVisible && (
          <span className="inline-flex items-center gap-1 bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full animate-pulse w-fit shadow-sm mb-0.5">
            <span>⚡</span>
            <span>Au tour de ce client</span>
          </span>
        )}
        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">{marqueDisplay}</h3>
        <p className="text-xs text-slate-500 font-medium">Arrivée à {heureDisplay}</p>
      </div>

      {/* Ligne 3 : Technicien + Prestations */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 w-full">
        <div className="min-w-0 shrink-0">
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 max-w-full overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-blue-600 shrink-0">
              <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm-2 5V6a2 2 0 114 0v1H8z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-slate-600 truncate">
              <strong className="text-slate-900 font-bold">{techNom}</strong>
            </span>
          </div>
        </div>

        <div className="min-w-0 flex flex-wrap items-start gap-1.5 flex-1">
          {listPrestations.length > 0
            ? listPrestations.map((prestItem, idx) => (
                <InterventionPill key={idx} label={prestItem} />
              ))
            : <span className="text-xs text-slate-400 italic">—</span>
          }
        </div>
      </div>

      {/* Ligne 4 : Badges Statut + RDV */}
      <div className="flex flex-wrap items-center gap-1.5">
        <StatutBadge statut={ticket.statut} />
        <RdvStatusBadge rdv={ticket.rdv} />
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
  const [selectedTechnicienId, setSelectedTechnicienId] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-complétion transparente en arrière-plan
  const [searchingVehicule, setSearchingVehicule] = useState(false)
  const [vehiculeReconnu, setVehiculeReconnu] = useState(null)

  const [ticketCreated, setTicketCreated] = useState(false)
  const [createdTicketData, setCreatedTicketData] = useState(null)

  // 1. State propre pour le catalogue issu de l'API
  const [catalogue, setCatalogue] = useState([])

  // 2. Chargement Axios du catalogue dynamique au montage / ouverture
  useEffect(() => {
    const fetchCatalogue = async () => {
      try {
        const res = await api.get('/reception/catalogue')
        const items = res.data?.prestations || res.data?.catalogue || res.data?.interventions || []
        setCatalogue(items)
      } catch (err) {
        console.error('Erreur chargement catalogue modal:', err)
      }
    }
    if (isOpen) {
      fetchCatalogue()
    }
  }, [isOpen])

  const selectOptions = useMemo(() => {
    const list = catalogue.length > 0 ? catalogue : (catalogueOptions || [])
    return list.map((item) => {
      const rawId = item.id || item.value
      const idVal = parseInt(rawId, 10) || rawId
      const nameVal = item.nom_intervention || item.nom || item.label || ''
      const baremeVal = item.temps_bareme
      const isVar = item.est_variable

      let labelDisplay = nameVal
      if (isVar) {
        labelDisplay += ' (Durée variable)'
      } else if (baremeVal) {
        labelDisplay += ` (${baremeVal} min)`
      }

      return {
        value: idVal, // ID entier strict
        id: idVal,
        label: labelDisplay,
        nom_intervention: nameVal,
      }
    })
  }, [catalogue, catalogueOptions])

  const handleImmatBlur = async () => {
    const cleanImmat = immat.trim().toUpperCase()
    if (!cleanImmat || cleanImmat.length < 2) return

    setSearchingVehicule(true)
    try {
      const res = await api.get('/reception/vehicules/search', {
        params: { plaque: cleanImmat },
      })
      if (res.data?.found && res.data?.vehicule) {
        const v = res.data.vehicule
        if (v.nom_complet || v.marque) {
          setMarque(v.nom_complet || `${v.marque} ${v.modele || ''}`.trim())
        }
        setVehiculeReconnu(v)
      } else {
        setVehiculeReconnu(null)
      }
    } catch (err) {
      console.error('Erreur recherche véhicule:', err)
    } finally {
      setSearchingVehicule(false)
    }
  }

  const resetForm = () => {
    setImmat('')
    setMarque('')
    setSelectedOptions([])
    setSelectedTechnicienId('')
    setErrors({})
    setTicketCreated(false)
    setCreatedTicketData(null)
    setVehiculeReconnu(null)
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
    if (!selectedTechnicienId) {
      newErrors.technicien = 'Veuillez choisir un technicien.'
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

    // 1. Extraction et formatage des IDs d'interventions sélectionnées (entiers valides)
    const interventionsIds = selectedOptions
      .map((item) => {
        const raw = typeof item === 'object' && item !== null ? (item.value ?? item.id) : item
        const parsed = parseInt(raw, 10)
        return !isNaN(parsed) ? parsed : raw
      })
      .filter((val) => val !== null && val !== undefined && val !== '')

    // 2. Vérification préventive côté client : empêcher la requête si le tableau est vide
    if (!interventionsIds || interventionsIds.length === 0) {
      setErrors({ interventions: 'Veuillez sélectionner au moins une intervention valide.' })
      return
    }

    setIsSubmitting(true)
    try {
      // 3. Préparation du payload Axios
      const payload = {
        immatriculation: immat.toUpperCase().trim(),
        marque: marque.trim(),
        interventions: interventionsIds,
        mode_attribution: 'manuel',
        technicien_id: parseInt(selectedTechnicienId, 10),
      }

      // 4. Log de débogage de la structure exacte envoyée
      console.log('Payload avant envoi:', payload)

      const response = await api.post('/reception/tickets', payload)

      const newTicket = response.data.ticket || {
        id: Date.now(),
        immat: payload.immatriculation,
        marque: payload.marque,
        interventions: selectedOptions.map((opt) => opt.nom_intervention || opt.label),
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
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.immatriculation?.[0] ||
        'Erreur lors de l\'enregistrement du ticket.'

      // Interception de l'erreur 422 (ticket déjà actif) : Affichage visible sous l'immatriculation sans vider le formulaire
      setErrors({
        api: serverMessage,
        immat: err.response?.status === 422 ? serverMessage : undefined,
      })
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
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
      onClick={handleCloseModal}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-2xl md:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-slate-200 animate-in my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-4 sm:px-8 sm:py-5 bg-slate-900 flex items-center justify-between text-white sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-base sm:text-lg text-white shrink-0">
              +
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold leading-snug truncate">Nouveau Ticket de Prise en Charge</h2>
              <p className="text-xs text-slate-400 hidden sm:block">Remplissez les informations du véhicule et l'attribution</p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-8">
          {!ticketCreated ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
              {errors.api && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2">
                  ⚠ {errors.api}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Immatriculation
                    </label>
                    {searchingVehicule && (
                      <span className="text-[11px] text-blue-600 animate-pulse font-semibold">Recherche...</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={immat}
                    onChange={(e) => {
                      setImmat(e.target.value)
                      setErrors((err) => ({ ...err, immat: undefined }))
                      if (vehiculeReconnu && e.target.value.toUpperCase() !== vehiculeReconnu.matricule) {
                        setVehiculeReconnu(null)
                      }
                    }}
                    onBlur={handleImmatBlur}
                    placeholder="ex: 14582-A-26"
                    className={`w-full font-mono font-bold text-slate-800 text-sm px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase transition placeholder:normal-case placeholder:font-normal ${
                      errors.immat ? 'border-rose-400 ring-1 ring-rose-400' : 'border-gray-300'
                    }`}
                  />
                  {errors.immat && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.immat}</p>}

                  {vehiculeReconnu && (
                    <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">✅</span>
                        <div>
                          <span className="font-bold uppercase">Véhicule reconnu : </span>
                          <span>{vehiculeReconnu.nom_complet || vehiculeReconnu.marque}</span>
                          {vehiculeReconnu.client_nom && (
                            <span className="text-emerald-700 font-normal"> ({vehiculeReconnu.client_nom})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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

              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition cursor-pointer text-center"
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
    <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-t border-slate-200/80 rounded-b-2xl shadow-xs mt-1 gap-2 flex-wrap">
      <p className="text-xs font-semibold text-slate-500">
        Page <span className="font-bold text-slate-900">{currentPage}</span> sur{' '}
        <span className="font-bold text-slate-900">{lastPage}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 sm:px-3.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
        >
          ← Préc.
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
          className="px-3 py-1.5 sm:px-3.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
        >
          Suiv. →
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

  // Modale de modification
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedInterventionToEdit, setSelectedInterventionToEdit] = useState(null)

  const handleOpenEditModal = (ticket) => {
    setSelectedInterventionToEdit(ticket)
    setIsEditModalOpen(true)
  }

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

      // Gestion de l'annulation d'une intervention (suppression instantanée du state)
      const handleInterventionAnnulee = (e) => {
        const annuleeId = e?.intervention_id || e?.id
        if (annuleeId) {
          setVehicules((prev) => prev.filter((v) => String(v.id) !== String(annuleeId)))
          // Rafraîchissement silencieux pour mettre à jour les KPIs
          fetchFileAttente(true)
        }
      }

      garageChannel.listen('.TicketCreated', handleWebSocketEvent)
      garageChannel.listen('TicketCreated', handleWebSocketEvent)
      garageChannel.listen('.TicketStatusUpdated', handleWebSocketEvent)
      garageChannel.listen('TicketStatusUpdated', handleWebSocketEvent)
      garageChannel.listen('.InterventionAnnulee', handleInterventionAnnulee)
      garageChannel.listen('InterventionAnnulee', handleInterventionAnnulee)

      atelierChannel.listen('InterventionStatusChanged', handleWebSocketEvent)
      atelierChannel.listen('.InterventionStatusChanged', handleWebSocketEvent)
      atelierChannel.listen('.intervention.updated', handleWebSocketEvent)
      atelierChannel.listen('intervention.updated', handleWebSocketEvent)
      atelierChannel.listen('.NewVehicleArrived', handleWebSocketEvent)
      atelierChannel.listen('NewVehicleArrived', handleWebSocketEvent)
      atelierChannel.listen('.InterventionAnnulee', handleInterventionAnnulee)
      atelierChannel.listen('InterventionAnnulee', handleInterventionAnnulee)

      return () => {
        garageChannel.stopListening('.TicketCreated')
        garageChannel.stopListening('TicketCreated')
        garageChannel.stopListening('.TicketStatusUpdated')
        garageChannel.stopListening('TicketStatusUpdated')
        garageChannel.stopListening('.InterventionAnnulee')
        garageChannel.stopListening('InterventionAnnulee')

        atelierChannel.stopListening('InterventionStatusChanged')
        atelierChannel.stopListening('.InterventionStatusChanged')
        atelierChannel.stopListening('.intervention.updated')
        atelierChannel.stopListening('intervention.updated')
        atelierChannel.stopListening('.NewVehicleArrived')
        atelierChannel.stopListening('NewVehicleArrived')
        atelierChannel.stopListening('.InterventionAnnulee')
        atelierChannel.stopListening('InterventionAnnulee')

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
    <div className="flex flex-col gap-4 sm:gap-6 min-h-full font-sans w-full p-2 sm:p-0 bg-slate-50 text-slate-900">
      {/* Page Header (100% largeur disponible, responsive) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm text-slate-900">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Prise en Charge &amp; File d'Attente
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Gérez la file d'attente des véhicules et attribuez les travaux en temps réel.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-wrap">
          <span className="inline-flex items-center justify-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Réception Ouverte
          </span>

          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold border border-slate-200">
            {vehicules.length} véhicule{vehicules.length > 1 ? 's' : ''}
          </span>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="py-2.5 px-4 sm:py-3 sm:px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <span className="text-lg leading-none">+</span>
            <span>Nouveau Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. Remplacement des statistiques par le state kpis */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enregistrés</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{kpis.total}</p>
        </div>
        <div className="bg-amber-50 p-3.5 sm:p-4 rounded-xl border border-amber-200 shadow-xs">
          <p className="text-[10px] sm:text-xs font-bold text-amber-800 uppercase tracking-wider">En Attente</p>
          <p className="text-xl sm:text-2xl font-black text-amber-900 mt-1">{kpis.en_attente}</p>
        </div>
        <div className="bg-blue-50 p-3.5 sm:p-4 rounded-xl border border-blue-200 shadow-xs">
          <p className="text-[10px] sm:text-xs font-bold text-blue-800 uppercase tracking-wider">En Cours</p>
          <p className="text-xl sm:text-2xl font-black text-blue-900 mt-1">{kpis.en_cours}</p>
        </div>
        <div className="bg-emerald-50 p-3.5 sm:p-4 rounded-xl border border-emerald-200 shadow-xs">
          <p className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">Clôturés</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">{kpis.termines}</p>
        </div>
      </div>

      {/* Section Liste des Véhicules */}
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          {/* Onglets de filtrage */}
          <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto overflow-x-auto pb-0.5">
            {[
              { id: 'Tous', label: 'Tous', count: kpis.total },
              { id: 'En attente', label: 'En attente', count: kpis.en_attente },
              { id: 'En cours', label: 'En cours', count: kpis.en_cours },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3.5 py-2 shrink-0 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  filterTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                  filterTab === tab.id ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tri local */}
          <div className="flex items-center gap-2 text-xs w-full lg:w-auto">
            <span className="text-slate-600 font-semibold whitespace-nowrap shrink-0">Trier par :</span>
            <div className="flex flex-1 lg:flex-none p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setSortBy('rdv')}
                className={`flex-1 lg:flex-none px-3 py-2 sm:py-1.5 rounded-md font-bold transition cursor-pointer text-center ${
                  sortBy === 'rdv'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Priorité RDV
              </button>
              <button
                type="button"
                onClick={() => setSortBy('heure')}
                className={`flex-1 lg:flex-none px-3 py-2 sm:py-1.5 rounded-md font-bold transition cursor-pointer text-center ${
                  sortBy === 'heure'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Heure d'arrivée
              </button>
            </div>
          </div>
        </div>

        {vehiculesFiltres.length === 0 ? (
          <div className="p-8 sm:p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 flex flex-col items-center justify-center gap-2 mx-0">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xl font-bold mb-1">
              🚗
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-800">Aucun véhicule dans cette catégorie ({filterTab})</p>
            <p className="text-xs text-slate-500">Sélectionnez un autre onglet ou créez un nouveau ticket.</p>
          </div>
        ) : (
          /* 2. Map sur vehiculesFiltres */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
            <ul className="divide-y divide-slate-100 w-full">
              {vehiculesFiltres.map((ticket, index) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  index={index}
                  onDelete={handleDelete}
                  onPrint={triggerPrintTicket}
                  onEdit={handleOpenEditModal}
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

      {/* Modale de Modification Dynamique */}
      <ModifierInterventionModal
        isOpen={isEditModalOpen}
        intervention={selectedInterventionToEdit}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedInterventionToEdit(null)
        }}
        onSaved={() => {
          fetchFileAttente(true, currentPage)
        }}
      />

      <div className="absolute left-[-9999px] top-[-9999px]">
        <TicketTemplate ref={printRef} data={ticketToPrint} />
      </div>

      {/* ─── Modale de Confirmation de Suppression ─────────────────────────────── */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={() => { setIsDeleteModalOpen(false); setTicketToDelete(null) }}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 flex flex-col gap-4 sm:gap-5 animate-[fadeInScale_0.18s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icône + Titre */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800">Confirmer la suppression</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Êtes-vous sûr de vouloir supprimer ce ticket ?<br />
                  <span className="font-semibold text-rose-600">Cette action est irréversible.</span>
                </p>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-1 border-t border-slate-100 w-full">
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setTicketToDelete(null) }}
                className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition cursor-pointer text-center"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-sm font-bold shadow-lg shadow-rose-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
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
