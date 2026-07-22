import { useState } from 'react'
import TicketPrintTemplate from './TicketPrintTemplate'

// ─── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_TICKETS = [
  {
    id: 1,
    immat: 'AB-123-CD',
    marque: 'Renault Express',
    interventions: ['Vidange', 'Plaquettes'],
    rdv: true,
    heure: '08:30',
    technicien: 'Yassir Zimi',
  },
  {
    id: 2,
    immat: 'EF-456-GH',
    marque: 'Peugeot 308',
    interventions: ['Diagnostic'],
    rdv: false,
    heure: '09:15',
    technicien: 'Karim Benaissa',
  },
  {
    id: 3,
    immat: 'IJ-789-KL',
    marque: 'Dacia Sandero',
    interventions: ['Vidange', 'Diagnostic'],
    rdv: true,
    heure: '10:00',
    technicien: 'Hamid El Fassi',
  },
]

const INTERVENTIONS_LIST = ['Vidange', 'Plaquettes', 'Diagnostic', 'Révision', 'Pneumatiques', 'Climatisation']

// ─── Sub-components ───────────────────────────────────────────────────────────

function RdvBadge({ rdv }) {
  return rdv ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      Rendez-vous
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Sans rendez-vous
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

// PrintButton – small icon placed on each card
function PrintButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Imprimer le ticket"
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 shrink-0 cursor-pointer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M7.875 1.5C6.839 1.5 6 2.34 6 3.375v2.99c-.426.053-.851.11-1.274.174-1.454.218-2.476 1.483-2.476 2.917v6.294a3 3 0 0 0 3 3h.27l-.155 1.705A1.875 1.875 0 0 0 7.232 22.5h9.536a1.875 1.875 0 0 0 1.867-2.045l-.155-1.705h.27a3 3 0 0 0 3-3V9.456c0-1.434-1.022-2.7-2.476-2.917A48.716 48.716 0 0 0 18 6.366V3.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM16.5 6.205v-2.83A.375.375 0 0 0 16.125 3h-8.25a.375.375 0 0 0-.375.375v2.83a49.353 49.353 0 0 1 9 0Zm-.217 8.265c.03.29.048.582.048.877a48.57 48.57 0 0 1-.31 5.48.75.75 0 0 1-.75.673H8.729a.75.75 0 0 1-.75-.673 48.57 48.57 0 0 1-.31-5.48c0-.295.018-.587.048-.877a49.788 49.788 0 0 0 8.556 0Zm-5.09 3.485a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75Zm2.25 1.5a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Z" clipRule="evenodd" />
      </svg>
    </button>
  )
}

function TicketCard({ ticket, onDelete, onPrint }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
      {/* Card header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Immat badge */}
          <div className="flex items-center justify-center min-w-[5.5rem] h-10 rounded-md bg-white border-2 border-slate-800 px-2.5 shrink-0 shadow-sm">
            <span className="whitespace-nowrap text-slate-900 font-black text-sm tracking-wider leading-none">
              {ticket.immat}
            </span>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-base leading-tight">{ticket.marque}</p>
            <p className="text-xs text-slate-400 mt-0.5">Arrivée · {ticket.heure}</p>
          </div>
        </div>

        {/* Action buttons – visible on hover */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Print button */}
          <PrintButton onClick={() => onPrint(ticket)} />

          {/* Delete button */}
          <button
            onClick={() => onDelete(ticket.id)}
            title="Supprimer le ticket"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 shrink-0 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ticket.interventions.map((i) => (
            <InterventionTag key={i} label={i} />
          ))}
        </div>
        <RdvBadge rdv={ticket.rdv} />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardReception() {
  // Form state
  const [immat, setImmat] = useState('')
  const [marque, setMarque] = useState('')
  const [selectedInterventions, setSelectedInterventions] = useState([])
  const [isRendezVous, setIsRendezVous] = useState(false)
  const [errors, setErrors] = useState({})

  // Queue state
  const [tickets, setTickets] = useState(INITIAL_TICKETS)
  const [nextId, setNextId] = useState(4)
  const [successMsg, setSuccessMsg] = useState(false)

  // Print state – holds the specific ticket to print
  const [ticketToPrint, setTicketToPrint] = useState(null)

  // ── Handlers ───────────────────────────────────────────────────────────────

  function toggleIntervention(label) {
    setSelectedInterventions((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    )
  }

  function validate() {
    const newErrors = {}
    if (!immat.trim()) newErrors.immat = 'L\'immatriculation est requise.'
    if (!marque.trim()) newErrors.marque = 'La marque est requise.'
    if (selectedInterventions.length === 0) newErrors.interventions = 'Sélectionnez au moins une intervention.'
    return newErrors
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const now = new Date()
    const heure = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newTicket = {
      id: nextId,
      immat: immat.toUpperCase().trim(),
      marque: marque.trim(),
      interventions: [...selectedInterventions],
      rdv: isRendezVous,
      heure,
      technicien: 'Non assigné',
    }

    setTickets((prev) => [newTicket, ...prev])
    setNextId((n) => n + 1)

    // Reset form
    setImmat('')
    setMarque('')
    setSelectedInterventions([])
    setIsRendezVous(false)
    setErrors({})

    // Show success flash
    setSuccessMsg(true)
    setTimeout(() => setSuccessMsg(false), 3000)
  }

  function handleDelete(id) {
    setTickets((prev) => prev.filter((t) => t.id !== id))
  }

  /**
   * handlePrint – set the ticket to print, then wait 100 ms for React to
   * render the hidden TicketPrintTemplate before calling window.print().
   */
  function handlePrint(ticket) {
    // Calculate how many vehicles are ahead in the queue
    const sortedTickets = [
      ...tickets.filter((t) => t.rdv),
      ...tickets.filter((t) => !t.rdv).sort((a, b) => a.heure.localeCompare(b.heure)),
    ]
    const position = sortedTickets.findIndex((t) => t.id === ticket.id)
    const vehiclesBefore = position > 0 ? position : 0

    setTicketToPrint({
      ...ticket,
      immatriculation: ticket.immat || ticket.immatriculation,
      vehiclesBefore,
    })

    // On attend 300ms pour être sûr à 100% que React a mis à jour le DOM
    setTimeout(() => {
      window.print()
    }, 300)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 min-h-full">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Réception — Flux du jour
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Enregistrez les entrées et consultez la file d'attente en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ouvert
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
            </svg>
            {tickets.length} en attente
          </span>
        </div>
      </div>

      {/* ── 2-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── LEFT: Form ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Card header */}
            <div className="px-6 py-4 bg-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-900">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Nouveau ticket</p>
                <p className="text-slate-400 text-xs">Enregistrer un véhicule</p>
              </div>
            </div>

            {/* Success toast */}
            {successMsg && (
              <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
                Ticket créé avec succès !
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5" noValidate>

              {/* Immatriculation */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Immatriculation
                </label>
                <input
                  type="text"
                  value={immat}
                  onChange={(e) => { setImmat(e.target.value); setErrors((err) => ({ ...err, immat: undefined })) }}
                  placeholder="ex: 1234-A-50"
                  className={`w-full font-mono font-bold text-slate-800 text-sm px-4 py-2.5 rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 ${errors.immat ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}
                />
                {errors.immat && <p className="text-rose-500 text-xs mt-1">{errors.immat}</p>}
              </div>

              {/* Marque / Modèle */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Marque &amp; Modèle
                </label>
                <input
                  type="text"
                  value={marque}
                  onChange={(e) => { setMarque(e.target.value); setErrors((err) => ({ ...err, marque: undefined })) }}
                  placeholder="ex: Renault Express"
                  className={`w-full text-slate-800 text-sm px-4 py-2.5 rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition ${errors.marque ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}
                />
                {errors.marque && <p className="text-rose-500 text-xs mt-1">{errors.marque}</p>}
              </div>

              {/* Interventions */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Interventions prévues
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {INTERVENTIONS_LIST.map((label) => {
                    const checked = selectedInterventions.includes(label)
                    return (
                      <label
                        key={label}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 select-none text-sm
                          ${checked
                            ? 'border-yellow-400 bg-yellow-50 text-yellow-800 font-semibold shadow-sm'
                            : 'border-slate-200 bg-gray-50 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        {/* Custom checkbox */}
                        <span className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 transition-colors duration-150 ${checked ? 'border-yellow-400 bg-yellow-400' : 'border-slate-300 bg-white'}`}>
                          {checked && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3 text-slate-900">
                              <path fillRule="evenodd" d="M10.53 2.47a.75.75 0 0 1 0 1.06L4.5 9.56 1.47 6.53a.75.75 0 0 1 1.06-1.06l1.97 1.97 5.97-5.97a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => { toggleIntervention(label); setErrors((err) => ({ ...err, interventions: undefined })) }}
                        />
                        {label}
                      </label>
                    )
                  })}
                </div>
                {errors.interventions && <p className="text-rose-500 text-xs mt-1.5">{errors.interventions}</p>}
              </div>

              {/* RDV Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsRendezVous((prev) => !prev)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-gray-50 hover:bg-slate-100 transition-all duration-150 select-none text-left cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Client sur Rendez-vous</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isRendezVous ? 'Passage sur rendez-vous' : 'Passage sans rendez-vous'}
                    </p>
                  </div>
                  {/* Toggle pill */}
                  <div
                    className={`w-11 h-6 p-0.5 rounded-full transition-colors duration-200 shrink-0 ${
                      isRendezVous ? 'bg-yellow-400' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        isRendezVous ? 'translate-x-full' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </button>
              </div>

              {/* Submit – Créer le Ticket only, no print button here */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 active:scale-[0.98] text-slate-900 font-bold text-sm py-3.5 rounded-xl shadow-md shadow-yellow-400/30 transition-all duration-150 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm13-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" clipRule="evenodd" />
                </svg>
                Créer le Ticket
              </button>

            </form>
          </div>
        </div>

        {/* ── RIGHT: Queue ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Queue header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-lg">Véhicules en attente</h2>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-yellow-400 text-xs font-bold">
                {tickets.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 italic">
              Survolez une carte pour supprimer ou imprimer son ticket
            </p>
          </div>

          {/* Empty state */}
          {tickets.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-12 h-12 text-slate-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 1-.987-1.106v.001m10.026 0a48.524 48.524 0 0 1 1.038.02" />
              </svg>
              <p className="text-sm font-medium">Aucun véhicule en attente</p>
              <p className="text-xs">Créez un ticket depuis le formulaire.</p>
            </div>
          )}

          {/* Ticket cards – sorted: RDV first, then by arrival time */}
          {[
            ...tickets.filter((t) => t.rdv),
            ...tickets.filter((t) => !t.rdv).sort((a, b) => a.heure.localeCompare(b.heure)),
          ].map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onDelete={handleDelete}
              onPrint={handlePrint}
            />
          ))}

        </div>
      </div>

      {/* ── Hidden thermal ticket – rendered outside normal flow ── */}
      {ticketToPrint && (
        <TicketPrintTemplate data={ticketToPrint} />
      )}

    </div>
  )
}
