import { useState, useEffect } from 'react'
import {
  Bell, Play, CheckCircle2, AlertTriangle, Clock, Wrench,
  ListTodo, TrendingUp, User, ShieldAlert, X, LogOut, RefreshCw, Calendar, PauseCircle, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ConfirmModal from '../../components/ConfirmModal'
import api from '../../api/axios'
import echo from '../../echo'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function formatChrono(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function calculateMinutes(startStr, endStr) {
  if (!startStr || !endStr) return 0
  const start = new Date(startStr)
  const end = new Date(endStr)
  return Math.max(1, Math.floor((end - start) / 60000))
}

/** Composant Plaque d'immatriculation haute visibilité */
function LicensePlate({ immat, size = 'normal' }) {
  return (
    <div className={`w-full bg-yellow-400 border-2 border-slate-900 rounded-xl shadow-sm flex items-center justify-center gap-2 font-mono font-black text-slate-900 tracking-widest ${
      size === 'large' ? 'py-3 text-2xl sm:text-3xl' : 'py-2 text-xl'
    }`}>
      <span className="text-xs font-sans font-bold bg-slate-900 text-yellow-400 px-1.5 py-0.5 rounded">
        MA
      </span>
      <span>{immat || 'SANS-IMMAT'}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL (Mobile-First)
// ─────────────────────────────────────────────────────────────────────────────
export default function TechnicienDashboardView() {
  const auth = useAuth()
  const currentUser = auth?.user

  // États principaux : Tableau de toutes les interventions attribuées au technicien
  const [tasks, setTasks] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState(null)

  // Tâche active (index 0) et tâches suivantes dans la file
  const activeTask = tasks[0] || null
  const upcomingTasks = tasks.slice(1)

  // Chronomètre visuel pour la tâche active 'En cours'
  const [seconds, setSeconds] = useState(0)

  // Navigation onglets mobile
  const [activeTab, setActiveTab] = useState('queue') // 'queue' | 'bilan' | 'profil'
  const [modalProblemOpen, setModalProblemOpen] = useState(false)
  const [customMotif, setCustomMotif] = useState('')

  // 1. Récupération de TOUTES les interventions du technicien en attente/en cours
  const fetchCurrentTask = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/technicien/tache')

      if (response.data && Array.isArray(response.data.interventions)) {
        setTasks(response.data.interventions)
      } else if (response.data && response.data.intervention) {
        setTasks([response.data.intervention])
      } else {
        setTasks([])
      }
    } catch (err) {
      console.error('Erreur chargement tâches technicien:', err)
      setError(err.response?.data?.message || 'Erreur lors de la récupération de vos tâches.')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  // 2. Récupération de l'historique (Bilan)
  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await api.get('/technicien/historique')
      if (response.data && response.data.history) {
        setHistory(response.data.history)
      }
    } catch (err) {
      console.error('Erreur chargement historique:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Hook principal : Récupération initiale au montage + Écoute WebSockets nettoyée ([] strictement constant)
  useEffect(() => {
    fetchCurrentTask()
    fetchHistory()

    const echoInstance = echo || window.Echo

    if (!echoInstance) return

    const atelierChannel = echoInstance.channel('atelier')
    const garageChannel = echoInstance.channel('garage')

    let wsTimer = null
    const handleWebSocketEvent = (e) => {
      if (wsTimer) clearTimeout(wsTimer)
      wsTimer = setTimeout(() => {
        fetchCurrentTask()
        fetchHistory()
      }, 500)
    }

    const handleTicketCreated = (e) => {
      handleWebSocketEvent(e)
    }

    const handleTicketDeleted = (e) => {
      const deletedId = e?.ticket_id || e?.id
      if (deletedId) {
        setTasks((prevTasks) => prevTasks.filter((t) => String(t.id) !== String(deletedId)))
      }
    }

    atelierChannel.listen('.InterventionStatusChanged', handleWebSocketEvent)
    atelierChannel.listen('InterventionStatusChanged', handleWebSocketEvent)
    atelierChannel.listen('.intervention.updated', handleWebSocketEvent)
    atelierChannel.listen('intervention.updated', handleWebSocketEvent)
    atelierChannel.listen('.TicketDeleted', handleTicketDeleted)
    atelierChannel.listen('TicketDeleted', handleTicketDeleted)

    garageChannel.listen('.TicketCreated', handleTicketCreated)
    garageChannel.listen('TicketCreated', handleTicketCreated)
    garageChannel.listen('.TicketStatusUpdated', handleWebSocketEvent)
    garageChannel.listen('TicketStatusUpdated', handleWebSocketEvent)
    garageChannel.listen('.TicketDeleted', handleTicketDeleted)
    garageChannel.listen('TicketDeleted', handleTicketDeleted)

    return () => {
      if (wsTimer) clearTimeout(wsTimer)
      atelierChannel.stopListening('.InterventionStatusChanged')
      atelierChannel.stopListening('InterventionStatusChanged')
      atelierChannel.stopListening('.intervention.updated')
      atelierChannel.stopListening('intervention.updated')
      atelierChannel.stopListening('.TicketDeleted')
      atelierChannel.stopListening('TicketDeleted')

      garageChannel.stopListening('.TicketCreated')
      garageChannel.stopListening('TicketCreated')
      garageChannel.stopListening('.TicketStatusUpdated')
      garageChannel.stopListening('TicketStatusUpdated')
      garageChannel.stopListening('.TicketDeleted')
      garageChannel.stopListening('TicketDeleted')

      echoInstance.leaveChannel('atelier')
      echoInstance.leaveChannel('garage')
    }
  }, []) // 👈 Strictement constant []

  // Charger l'historique au changement d'onglet vers 'bilan'
  useEffect(() => {
    if (activeTab === 'bilan') {
      fetchHistory()
    }
  }, [activeTab])

  // ⏱️ CHRONOMÈTRE RESISTANT A LA MISE EN VEILLE (SUR LA TÂCHE ACTIVE)
  useEffect(() => {
    let interval = null
    const isEnCours = activeTask?.statut === 'En cours'
    const dateDebut = activeTask?.date_debut

    if (isEnCours && dateDebut) {
      const calculateSeconds = () => {
        const startTime = new Date(dateDebut).getTime()
        const now = Date.now()
        return Math.max(0, Math.floor((now - startTime) / 1000))
      }

      setSeconds(calculateSeconds())

      interval = setInterval(() => {
        setSeconds(calculateSeconds())
      }, 1000)
    } else {
      setSeconds(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTask?.id, activeTask?.statut, activeTask?.date_debut])

  // 3. Action API : Démarrer / Reprendre l'intervention (Instantané et Sécurisé)
  const handleStart = async (targetId = activeTask?.id) => {
    if (!targetId || actionLoading) return
    try {
      setActionLoading(true)
      const res = await api.post(`/technicien/tache/${targetId}/start`)
      if (res.data?.intervention) {
        const updated = res.data.intervention
        setTasks((prevTasks) =>
          prevTasks.map((t) => (String(t.id) === String(targetId) ? { ...t, ...updated } : t))
        )
      } else {
        fetchCurrentTask()
      }
    } catch (err) {
      console.error('Erreur lors du démarrage:', err)
      alert(err.response?.data?.message || 'Impossible de démarrer l\'intervention.')
    } finally {
      setActionLoading(false)
    }
  }

  // 4. Action API : Signaler un blocage (Instantané et Sécurisé)
  const handleBlock = async (motif) => {
    if (!activeTask || actionLoading) return
    const targetId = activeTask.id
    const finalMotif = motif || customMotif || 'Problème technique / En attente'
    try {
      setActionLoading(true)
      setModalProblemOpen(false)
      setCustomMotif('')
      const res = await api.post(`/technicien/tache/${targetId}/block`, { motif: finalMotif })
      if (res.data?.intervention) {
        const updated = res.data.intervention
        setTasks((prevTasks) =>
          prevTasks.map((t) => (String(t.id) === String(targetId) ? { ...t, ...updated } : t))
        )
      } else {
        fetchCurrentTask()
      }
    } catch (err) {
      console.error('Erreur lors du signalement de blocage:', err)
      alert(err.response?.data?.message || 'Impossible de marquer l\'intervention comme bloquée.')
    } finally {
      setActionLoading(false)
    }
  }

  // 5. Action API : Terminer l'intervention active (Instantané et Sécurisé)
  const handleFinish = async () => {
    if (!activeTask || actionLoading) return
    const targetId = activeTask.id
    const finishedTask = activeTask
    try {
      setActionLoading(true)
      await api.post(`/technicien/tache/${targetId}/finish`)
      setTasks((prevTasks) => prevTasks.filter((t) => String(t.id) !== String(targetId)))
      setHistory((prevHistory) => [{ ...finishedTask, statut: 'Terminé', date_fin: new Date().toISOString() }, ...prevHistory])
    } catch (err) {
      console.error('Erreur lors de la clôture:', err)
      alert(err.response?.data?.message || 'Impossible de terminer l\'intervention.')
    } finally {
      setActionLoading(false)
    }
  }

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  // 6. Action : Déconnexion propre
  const handleLogout = () => {
    setIsLogoutModalOpen(true)
  }

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false)
    if (auth?.logout) {
      await auth.logout()
    } else {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
  }

  // Nom et pont du technicien connecté
  const technicienNom = currentUser?.name || 'Technicien'
  const pontNom = activeTask?.pont?.nom || (currentUser?.pont_id ? `Pont ${currentUser.pont_id}` : 'Atelier')

  // UI : Indicateur de chargement initial
  if (loading && tasks.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto h-screen flex flex-col items-center justify-center bg-slate-100 p-6 font-sans">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-600 animate-pulse">
            Chargement de votre espace technicien...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen flex flex-col bg-slate-100 shadow-2xl relative overflow-hidden font-sans">

      {/* ─────────────────────────────────────────────────────────────
          1. EN-TÊTE MOBILE (Slate-900)
      ───────────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-inner">
            {technicienNom.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm leading-tight text-white">{technicienNom}</h1>
              <span className="text-[10px] uppercase tracking-wider bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                {pontNom}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Technicien Atelier</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge du nombre total de véhicules attribués */}
          <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
            {tasks.length} {tasks.length > 1 ? 'véhicules' : 'véhicule'}
          </span>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            className="text-slate-400 hover:text-rose-400 p-1.5 transition rounded-lg hover:bg-slate-800 cursor-pointer ml-1"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. ZONE CENTRALE (Scrollable)
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col justify-start gap-5">

        {/* ERREUR EVENTUELLE */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── ONGLET INTERVENTION EN COURS / FILE D'ATTENTE ── */}
        {activeTab === 'queue' && (
          <>
            {/* SI AUCUNE TÂCHE ASSIGNÉE */}
            {!activeTask ? (
              <div className="my-auto bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Pont Libre</h2>
                  <p className="text-sm font-bold text-emerald-600 mt-1">En attente de véhicule</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Aucun véhicule assigné pour le moment. Vous serez notifié dès qu'une intervention vous sera attribuée.
                  </p>
                </div>
                <button
                  onClick={fetchCurrentTask}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualiser la file</span>
                </button>
              </div>
            ) : (

              /* SECTION 1 : TÂCHE ACTUELLE (activeTask) */
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    Tâche Actuelle à Traiter
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    1 / {tasks.length}
                  </span>
                </div>

                {/* Carte de la tâche principale */}
                <div className="bg-white rounded-3xl p-5 border-2 border-blue-500/30 shadow-md space-y-4">
                  {/* Badge Statut */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs ${
                      activeTask.statut === 'En cours'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : activeTask.statut === 'Bloqué'
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        activeTask.statut === 'En cours'
                          ? 'bg-blue-600 animate-ping'
                          : activeTask.statut === 'Bloqué'
                          ? 'bg-red-600 animate-pulse'
                          : 'bg-amber-500'
                      }`} />
                      {activeTask.statut === 'En cours'
                        ? 'En cours'
                        : activeTask.statut === 'Bloqué'
                        ? 'Bloqué'
                        : 'En attente'}
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {activeTask.pont?.nom || 'Pont'}
                    </span>
                  </div>

                  {/* Plaque d'immatriculation GRAND FORMAT */}
                  <LicensePlate immat={activeTask.vehicule?.matricule} size="large" />

                  {/* Détails du véhicule & intervention */}
                  <div className="space-y-2 pt-1">
                    <h2 className="text-xl font-black text-slate-800">
                      {activeTask.vehicule ? `${activeTask.vehicule.marque} ${activeTask.vehicule.modele}` : 'Véhicule'}
                    </h2>

                    <div className="flex items-start gap-2 text-xs font-bold text-slate-700 pt-2 border-t border-slate-100">
                      <Wrench className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{activeTask.type_intervention}</span>
                    </div>

                    {/* ALERTE BLOCAGE SI STATUT BLOQUÉ */}
                    {activeTask.statut === 'Bloqué' && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold space-y-1 mt-2">
                        <div className="flex items-center gap-1.5 text-red-700">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                          <span className="uppercase tracking-wider">Motif du blocage :</span>
                        </div>
                        <p className="text-slate-800 font-semibold pl-5">
                          {activeTask.motif_blocage || 'En attente de pièces / validation'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Chronomètre visuel si 'En cours' */}
                  {activeTask.statut === 'En cours' && (
                    <div className="hidden bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" /> Temps d'intervention
                      </p>
                      <div className="text-4xl font-extrabold font-mono text-slate-800 tracking-wider">
                        {formatChrono(seconds)}
                      </div>
                    </div>
                  )}

                  {/* LOGIQUE DES BOUTONS */}
                  {activeTask.statut === 'En attente' && (
                    <button
                      onClick={() => handleStart(activeTask.id)}
                      disabled={actionLoading}
                      className="w-full h-14 text-base font-black bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>{actionLoading ? 'Démarrage...' : 'Démarrer l\'intervention'}</span>
                    </button>
                  )}

                  {activeTask.statut === 'En cours' && (
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        onClick={handleFinish}
                        disabled={actionLoading}
                        className="w-full h-14 text-base font-black bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{actionLoading ? 'Clôture en cours...' : 'Terminer l\'intervention'}</span>
                      </button>

                      <button
                        onClick={() => setModalProblemOpen(true)}
                        disabled={actionLoading}
                        className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <PauseCircle className="w-4 h-4 text-red-500" />
                        <span>Signaler un blocage</span>
                      </button>
                    </div>
                  )}

                  {activeTask.statut === 'Bloqué' && (
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        onClick={() => handleStart(activeTask.id)}
                        disabled={actionLoading}
                        className="w-full h-14 text-base font-black bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>{actionLoading ? 'Reprise en cours...' : 'Reprendre l\'intervention'}</span>
                      </button>

                      <button
                        onClick={handleFinish}
                        disabled={actionLoading}
                        className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{actionLoading ? 'Clôture en cours...' : 'Terminer l\'intervention'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* SECTION 2 : PROCHAINES INTERVENTIONS EN ATTENTE (upcomingTasks) */}
                {upcomingTasks.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        Prochaines Interventions en Attente
                      </h3>
                      <span className="bg-slate-200 text-slate-700 font-extrabold text-[11px] px-2 py-0.5 rounded-full">
                        {upcomingTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {upcomingTasks.map((t, idx) => {
                        const nextOrderNum = idx + 2
                        return (
                          <div
                            key={t.id}
                            className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                                #{nextOrderNum}
                              </span>
                              <div className="min-w-0">
                                <p className="font-mono font-bold text-slate-900 text-xs tracking-wider">
                                  {t.vehicule?.matricule || 'SANS-IMMAT'}
                                </p>
                                <p className="text-xs font-bold text-slate-700 truncate leading-tight mt-0.5">
                                  {t.vehicule ? `${t.vehicule.marque} ${t.vehicule.modele}` : 'Véhicule'}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {t.type_intervention}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end shrink-0 gap-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                En attente
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Arrivée {t.heure || 'récente'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── ONGLET MON BILAN (HISTORIQUE DES INTERVENTIONS TERMINÉES) ── */}
        {activeTab === 'bilan' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Mon Bilan & Historique
              </h2>
              <button
                onClick={fetchHistory}
                className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Actualiser
              </button>
            </div>

            {/* Statistiques synthétiques */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                <p className="text-xs font-semibold text-slate-400 uppercase">Total Clôturées</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{history.length}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                <p className="text-xs font-semibold text-slate-400 uppercase">En Attente / Cours</p>
                <p className="text-2xl font-black text-blue-600 mt-1">
                  {tasks.length}
                </p>
              </div>
            </div>

            {/* Liste de l'historique */}
            {historyLoading ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-200">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-bold">Chargement de l'historique...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-2">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">Aucune intervention enregistrée dans l'historique</p>
                <p className="text-xs text-slate-400">Vos interventions clôturées s'afficheront ici.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => {
                  const minutes = calculateMinutes(item.date_debut, item.date_fin)
                  return (
                    <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase">
                          Terminé
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {formatDate(item.date_fin)}
                        </span>
                      </div>

                      <LicensePlate immat={item.vehicule?.matricule} size="normal" />

                      <div className="pt-1">
                        <h4 className="font-extrabold text-slate-800 text-sm">
                          {item.vehicule ? `${item.vehicule.marque} ${item.vehicule.modele}` : 'Véhicule'}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                          <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{item.type_intervention}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Durée : <strong className="text-slate-700 font-mono">{minutes} min</strong></span>
                        </span>
                        <span className="font-mono font-semibold">{item.pont?.nom || 'Pont'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET PROFIL & DÉCONNEXION ── */}
        {activeTab === 'profil' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
              Profil Technicien
            </h2>

            {/* Carte Identité Technicien */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white text-2xl font-black flex items-center justify-center mx-auto shadow-md">
                {technicienNom.charAt(0)}
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">{technicienNom}</h3>
                <p className="text-xs font-bold text-blue-600 mt-0.5 uppercase tracking-wider">
                  Rôle : {currentUser?.role || 'Technicien'}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-mono">{currentUser?.email}</p>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  Affectation principale : {pontNom}
                </p>
              </div>

              {/* Récapitulatif rapide des performances */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Clôturées</p>
                  <p className="text-lg font-black text-slate-800">{history.length} réalisées</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Statut API</p>
                  <p className="text-lg font-black text-emerald-600">Connecté</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600">Session Sanctum Active</span>
              </div>
            </div>

            {/* BOUTON MASSIF : Fin de journée & Déconnexion */}
            <button
              onClick={handleLogout}
              className="w-full py-4 px-4 bg-red-50 hover:bg-red-100 active:scale-[0.98] border border-red-200 rounded-2xl text-red-600 font-bold text-base flex items-center justify-center gap-2.5 shadow-sm transition cursor-pointer mt-6"
            >
              <LogOut className="w-5 h-5 text-red-600" />
              <span>🚪 Déconnexion de la session</span>
            </button>
          </div>
        )}

      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. BOTTOM BAR FIXE (Navigation Mobile)
      ───────────────────────────────────────────────────────────── */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2.5 z-30 shadow-lg">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeTab === 'queue' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ListTodo className="w-6 h-6" />
          <span className="text-[10px] leading-none">Tâches ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bilan')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeTab === 'bilan' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <TrendingUp className="w-6 h-6" />
          <span className="text-[10px] leading-none">Mon Bilan</span>
        </button>

        <button
          onClick={() => setActiveTab('profil')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeTab === 'profil' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] leading-none">Profil</span>
        </button>
      </nav>

      {/* MODALE SIGNALEMENT DE BLOCAGE */}
      {modalProblemOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setModalProblemOpen(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Signaler un blocage</span>
              </div>
              <button onClick={() => setModalProblemOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Sélectionnez ou saisissez le motif du blocage pour la plaque{' '}
              <strong className="text-slate-800 font-mono">{activeTask?.vehicule?.matricule}</strong> :
            </p>

            <div className="flex flex-col gap-2">
              {[
                'Pièce de rechange manquante',
                'Attente de validation du client',
                'Problème mécanique imprévu / Bloqué',
                'Assistance technique requise',
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleBlock(reason)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition cursor-pointer"
                >
                  {reason}
                </button>
              ))}
            </div>

            {/* Champ motif personnalisé */}
            <div className="pt-2">
              <input
                type="text"
                placeholder="Autre motif spécifique..."
                value={customMotif}
                onChange={(e) => setCustomMotif(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-red-500 mb-2"
              />
              {customMotif.trim() && (
                <button
                  onClick={() => handleBlock(customMotif)}
                  className="w-full py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition cursor-pointer"
                >
                  Valider ce motif
                </button>
              )}
            </div>

            <button
              onClick={() => setModalProblemOpen(false)}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION DE DÉCONNEXION */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Déconnexion"
        message="Voulez-vous clôturer votre session et vous déconnecter ?"
        confirmText="Se déconnecter"
        cancelText="Annuler"
        confirmColor="blue"
        onConfirm={confirmLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

    </div>
  )
}
