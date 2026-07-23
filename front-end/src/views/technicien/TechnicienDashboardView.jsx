import { useState, useEffect } from 'react'
import {
  Bell, Play, CheckCircle2, AlertTriangle, Clock, Wrench,
  ListTodo, TrendingUp, User, ShieldAlert, X, LogOut, Award, Check
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA INITIAL
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_TECHNICIEN = {
  nom: 'Yassir Zimi',
  pont: 'Pont 1',
  efficacite: '108%',
}

const INITIAL_FILE_ATTENTE = [
  {
    id: 1,
    immat: 'MQ-096-HI',
    modele: 'Renault Express (2021)',
    intervention: 'Vidange complète & remplacement des filtres',
    client: 'SOCIÉTÉ AGRO',
    priorite: 'Haute',
  },
  {
    id: 2,
    immat: '78432-A-50',
    modele: 'Dacia Sandero',
    intervention: 'Changement Plaquettes de frein AV',
    client: 'M. Alami',
    priorite: 'Normale',
  },
  {
    id: 3,
    immat: 'AB-456-CD',
    modele: 'Renault Clio 5',
    intervention: 'Diagnostic Moteur & Système Injection',
    client: 'Mme Bennani',
    priorite: 'Normale',
  },
]

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

/** Composant Plaque d'immatriculation d'haute visibilité */
function LicensePlate({ immat, size = 'normal' }) {
  return (
    <div className={`w-full bg-yellow-400 border-2 border-slate-900 rounded-xl shadow-sm flex items-center justify-center gap-2 font-mono font-black text-slate-900 tracking-widest ${
      size === 'large' ? 'py-3 text-2xl sm:text-3xl' : 'py-2 text-xl'
    }`}>
      <span className="text-xs font-sans font-bold bg-slate-900 text-yellow-400 px-1.5 py-0.5 rounded">
        MA
      </span>
      <span>{immat}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL (100% Mobile-Fit)
// ─────────────────────────────────────────────────────────────────────────────
export default function TechnicienDashboardView() {
  const auth = useAuth()

  const [technicien]                 = useState(INITIAL_TECHNICIEN)
  const [fileAttente, setFile]       = useState(INITIAL_FILE_ATTENTE)
  const [tacheActive, setTacheActive] = useState(null)
  const [seconds, setSeconds]         = useState(0)

  const [activeTab, setActiveTab]             = useState('queue') // 'queue' | 'bilan' | 'profil'
  const [modalProblemOpen, setModalProblemOpen] = useState(false)
  const [problemReported, setProblemReported]   = useState(null)

  // Chronomètre en continu pendant l'intervention active
  useEffect(() => {
    let interval = null
    if (tacheActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      setSeconds(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [tacheActive])

  // Démarrer l'intervention
  const handleStartTask = (task) => {
    setTacheActive(task)
    setFile((prev) => prev.filter((t) => t.id !== task.id))
    setSeconds(0)
    setProblemReported(null)
  }

  // Terminer l'intervention (AUCUN bouton Pause)
  const handleFinishTask = () => {
    if (!tacheActive) return
    const minSpent = Math.round(seconds / 60) || 1
    alert(`✅ Intervention terminée pour la plaque [${tacheActive.immat}] !\nTemps enregistré : ${minSpent} minute(s).`)
    setTacheActive(null)
    setSeconds(0)
    setProblemReported(null)
  }

  // Signaler un problème
  const handleReportProblem = (reason) => {
    setProblemReported(reason)
    setModalProblemOpen(false)
  }

  // Fin de journée / Déconnexion
  const handleLogout = () => {
    if (window.confirm('Voulez-vous clôturer votre journée et vous déconnecter ?')) {
      if (auth?.logout) {
        auth.logout()
      } else {
        window.location.reload()
      }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen flex flex-col bg-slate-100 shadow-2xl relative overflow-hidden font-sans">

      {/* ─────────────────────────────────────────────────────────────
          1. EN-TÊTE MOBILE (Slate-900 avec raccourci déconnexion)
      ───────────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-inner">
            {technicien.nom.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm leading-tight text-white">{technicien.nom}</h1>
              <span className="text-[10px] uppercase tracking-wider bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                {technicien.pont}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Technicien Atelier</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge efficacité jour */}
          <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full text-xs font-extrabold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{technicien.efficacite}</span>
          </div>

          {/* Icône notifications */}
          <button className="relative text-slate-300 hover:text-white p-1.5">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
          </button>

          {/* Raccourci Déconnexion Header */}
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            className="text-slate-400 hover:text-rose-400 p-1.5 transition rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. ZONE CENTRALE (Scrollable)
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">

        {/* ── ONGLET FILE D'ATTENTE / INTERVENTION ACTICE ── */}
        {activeTab === 'queue' && (
          <>
            {/* A. INTERVENTION EN COURS (Focus total) */}
            {tacheActive ? (
              <div className="flex flex-col gap-4">

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 border border-blue-200 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                    Intervention en cours
                  </span>
                </div>

                {/* Plaque d'immatriculation GRAND FORMAT */}
                <LicensePlate immat={tacheActive.immat} size="large" />

                {/* Détails du véhicule & intervention */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-800">
                      {tacheActive.modele}
                    </h2>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                      Client : {tacheActive.client}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 text-sm font-bold text-slate-700 pt-3 border-t border-slate-100">
                    <Wrench className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{tacheActive.intervention}</span>
                  </div>

                  {problemReported && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold mt-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Signalé : {problemReported}</span>
                    </div>
                  )}
                </div>

                {/* Chronomètre visuel */}
                <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 shadow-inner text-center my-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-500" /> Temps d'intervention
                  </p>
                  <div className="text-5xl font-extrabold font-mono text-slate-800 tracking-wider">
                    {formatChrono(seconds)}
                  </div>
                </div>

                {/* MASSIF Bouton Vert : Terminer (AUCUN BOUTON PAUSE) */}
                <button
                  onClick={handleFinishTask}
                  className="w-full h-16 text-lg font-black bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Terminer l'intervention</span>
                </button>

                {/* Bouton rouge : Signaler un problème */}
                <button
                  onClick={() => setModalProblemOpen(true)}
                  className="w-full h-12 bg-red-50 hover:bg-red-100 active:scale-[0.98] text-red-600 font-bold text-sm rounded-xl border border-red-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Signaler un problème</span>
                </button>

              </div>
            ) : (

              /* B. FILE D'ATTENTE */
              <div className="space-y-4">

                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Véhicules en attente
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                    {fileAttente.length} assigné{fileAttente.length > 1 ? 's' : ''}
                  </span>
                </div>

                {fileAttente.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <p className="font-bold text-slate-800 text-base">Aucun véhicule en attente</p>
                    <p className="text-xs text-slate-400">Toutes les interventions de votre file sont terminées.</p>
                  </div>
                ) : (
                  fileAttente.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col gap-3"
                    >
                      <LicensePlate immat={task.immat} size="normal" />

                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-slate-800 text-base leading-tight">
                            {task.modele}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            task.priorite === 'Haute' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {task.priorite}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Client : {task.client}</p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Wrench className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{task.intervention}</span>
                      </div>

                      <button
                        onClick={() => handleStartTask(task)}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer mt-1"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>Démarrer l'intervention</span>
                      </button>
                    </div>
                  ))
                )}

              </div>
            )}
          </>
        )}

        {/* ── ONGLET MON BILAN ── */}
        {activeTab === 'bilan' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
              Mon Bilan du jour
            </h2>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-slate-400 uppercase">Efficacité du jour</p>
                <p className="text-3xl font-black text-emerald-600">{technicien.efficacite}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-700 uppercase mb-2">Interventions clôturées</p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <LicensePlate immat="MQ-096-HI" size="normal" />
                  <p className="text-xs font-bold text-slate-700 mt-2">Renault Express — Vidange complète</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ONGLET PROFIL & DÉCONNEXION ── */}
        {activeTab === 'profil' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
              Profil & Paramètres
            </h2>

            {/* Carte Identité Technicien */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white text-2xl font-black flex items-center justify-center mx-auto shadow-md">
                {technicien.nom.charAt(0)}
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">{technicien.nom}</h3>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">Affectation : {technicien.pont}</p>
              </div>

              {/* Récapitulatif rapide de la journée */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Interventions</p>
                  <p className="text-lg font-black text-slate-800">2 réalisées</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Efficacité</p>
                  <p className="text-lg font-black text-emerald-600">{technicien.efficacite}</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600">Journée active enregistrée</span>
              </div>
            </div>

            {/* BOUTON MASSIF : Fin de journée & Déconnexion */}
            <button
              onClick={handleLogout}
              className="w-full py-4 px-4 bg-red-50 hover:bg-red-100 active:scale-[0.98] border border-red-200 rounded-2xl text-red-600 font-bold text-base flex items-center justify-center gap-2.5 shadow-sm transition cursor-pointer mt-6"
            >
              <LogOut className="w-5 h-5 text-red-600" />
              <span>🚪 Fin de journée & Déconnexion</span>
            </button>
          </div>
        )}

      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. BOTTOM BAR FIXE (Basse Mobile)
      ───────────────────────────────────────────────────────────── */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2.5 z-30 shadow-lg">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeTab === 'queue' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ListTodo className="w-6 h-6" />
          <span className="text-[10px] leading-none">File d'attente</span>
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

      {/* MODALE SIGNALEMENT PROBLÈME */}
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
                <span>Signaler un problème</span>
              </div>
              <button onClick={() => setModalProblemOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Sélectionnez la raison du blocage pour la plaque{' '}
              <strong className="text-slate-800 font-mono">{tacheActive?.immat}</strong> :
            </p>

            <div className="flex flex-col gap-2">
              {[
                'Pièce de rechange manquante',
                'Problème mécanique imprévu / Bloqué',
                'Validation chef d\'atelier requise',
                'Autre alerte technique',
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReportProblem(reason)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition cursor-pointer"
                >
                  {reason}
                </button>
              ))}
            </div>

            <button
              onClick={() => setModalProblemOpen(false)}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
