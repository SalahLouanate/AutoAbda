import React, { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'
import echo from '../../echo'

// Helper format date standard YYYY-MM-DD
function getTodayISO() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Formatage des temps décimaux en heures/minutes (UX)
function formaterTemps(heuresDecimales) {
  if (!heuresDecimales || heuresDecimales <= 0) return '0m'
  const h = Math.floor(heuresDecimales)
  const m = Math.round((heuresDecimales - h) * 60)
  if (h > 0 && m > 0) return `${h}h${m.toString().padStart(2, '0')}`
  if (h > 0 && m === 0) return `${h}h`
  return `${m}m`
}

// ─── Badge de statut d'intervention ─────────────────────────────────────────
function InterventionStatusBadge({ statut }) {
  const statutLower = String(statut || '').toLowerCase()

  if (['en pause', 'en_pause', 'pause'].includes(statutLower)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        En pause
      </span>
    )
  }
  if (statutLower === 'en cours' || statutLower === 'en_cours') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
        En cours
      </span>
    )
  }
  if (statutLower === 'terminé' || statutLower === 'termine') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Terminé
      </span>
    )
  }
  if (statutLower === 'bloqué' || statutLower === 'bloque') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Bloqué
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
      En attente
    </span>
  )
}

// ─── Modale de confirmation générique ────────────────────────────────────────
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel, confirmColor, isLoading }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden">
        <div className={`h-1.5 ${confirmColor === 'red' ? 'bg-gradient-to-r from-red-500 via-rose-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500'}`} />
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${confirmColor === 'red' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              {confirmColor === 'red' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </div>
          <h3 className="text-base font-bold text-slate-800 text-center">{title}</h3>
          <p className="text-sm text-slate-600 text-center leading-relaxed">{message}</p>
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50">
              Annuler
            </button>
            <button type="button" onClick={onConfirm} disabled={isLoading}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                confirmColor === 'red' ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/25' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25'
              }`}>
              {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isLoading ? 'En cours...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modale d'édition d'une intervention ────────────────────────────────────
function EditInterventionModal({ isOpen, intervention, onClose, onSaved }) {
  const [form, setForm] = useState({ type_intervention: '', motif_blocage: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (intervention) {
      setForm({ type_intervention: intervention.type || '', motif_blocage: intervention.motifBlocage || '' })
      setError(null)
    }
  }, [intervention])

  if (!isOpen || !intervention) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await api.put(`/direction/interventions/${intervention.id}`, form)
      onSaved(intervention.id, form)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-800">Modifier l'intervention</h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{intervention.vehicule}</p>
            </div>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">⚠ {error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Type d'intervention</label>
              <input type="text" value={form.type_intervention}
                onChange={(e) => setForm((f) => ({ ...f, type_intervention: e.target.value }))}
                className="w-full text-sm text-slate-800 px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="ex: Vidange & Filtres" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Motif de blocage <span className="text-slate-300 font-normal">(si applicable)</span>
              </label>
              <textarea value={form.motif_blocage}
                onChange={(e) => setForm((f) => ({ ...f, motif_blocage: e.target.value }))}
                rows={3}
                className="w-full text-sm text-slate-800 px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                placeholder="Décrire le problème rencontré..." />
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
                Annuler
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Groupe de 4 boutons d'action par intervention ────────────────────────────
function ActionButtons({ intervention, loadingId, onModifier, onPause, onTerminer, onAnnuler }) {
  const isLoading = loadingId === intervention.id
  const statut = intervention.statut
  const statutLower = String(statut || '').toLowerCase()

  const isPaused = ['en pause', 'en_pause', 'pause'].includes(statutLower)
  const isEnCours = statutLower === 'en cours' || statutLower === 'en_cours'

  const canPauseOrResume = isEnCours || isPaused
  const canTerminer = isEnCours || isPaused || statutLower === 'en attente' || statutLower === 'en_attente'

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full">
      {/* ✏️ Modifier */}
      <button
        type="button"
        onClick={() => onModifier(intervention)}
        disabled={isLoading}
        title="Modifier l'intervention"
        className="h-9 px-1.5 sm:px-2 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-blue-700 bg-blue-50/90 border border-blue-200/80 hover:bg-blue-100 hover:border-blue-300 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
        <span className="truncate">Modifier</span>
      </button>

      {/* ⏸️ Mettre en pause / ▶️ Reprendre */}
      <button
        type="button"
        onClick={() => onPause(intervention)}
        disabled={isLoading || !canPauseOrResume}
        title={
          isPaused
            ? 'Reprendre l\'intervention'
            : isEnCours
            ? 'Mettre en pause'
            : 'Action indisponible'
        }
        className={`h-9 px-1.5 sm:px-2 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs border ${
          isPaused
            ? 'text-blue-700 bg-blue-50/90 border-blue-200/80 hover:bg-blue-100 hover:border-blue-300'
            : 'text-amber-700 bg-amber-50/90 border-amber-200/80 hover:bg-amber-100 hover:border-amber-300'
        }`}
      >
        {isLoading ? (
          <span className={`w-3.5 h-3.5 border-2 rounded-full animate-spin shrink-0 ${
            isPaused ? 'border-blue-400 border-t-blue-700' : 'border-amber-400 border-t-amber-700'
          }`} />
        ) : isPaused ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        <span className="truncate">{isPaused ? 'Reprendre' : 'Pause'}</span>
      </button>

      {/* ✅ Mettre fin */}
      <button
        type="button"
        onClick={() => onTerminer(intervention)}
        disabled={isLoading || !canTerminer}
        title={canTerminer ? "Clôturer l'intervention" : 'Action non disponible'}
        className="h-9 px-1.5 sm:px-2 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
      >
        {isLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-emerald-700 rounded-full animate-spin shrink-0" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
        <span className="truncate">Terminer</span>
      </button>

      {/* ❌ Annuler */}
      <button
        type="button"
        onClick={() => onAnnuler(intervention)}
        disabled={isLoading}
        title="Annuler l'intervention"
        className="h-9 px-1.5 sm:px-2 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-red-700 bg-red-50/90 border border-red-200/80 hover:bg-red-100 hover:border-red-300 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
      >
        {isLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-red-700 rounded-full animate-spin shrink-0" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
        <span className="truncate">Annuler</span>
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : GestionInterventions
// ═══════════════════════════════════════════════════════════════════════════════
export default function GestionInterventions() {
  // ── États principaux ────────────────────────────────────────────────────────
  const [dateFiltre, setDateFiltre] = useState(getTodayISO())
  const [interventionsList, setInterventionsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [technicienActifId, setTechnicienActifId] = useState(null)
  const [nowTick, setNowTick] = useState(Date.now())

  // ── État de chargement par intervention en cours de modification ──────────
  const [loadingActionId, setLoadingActionId] = useState(null)

  // ── États des modales de confirmation ────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '',
    confirmColor: 'red',
    onConfirm: null,
    isLoading: false,
  })

  // ── État de la modale d'édition ──────────────────────────────────────────
  const [editModal, setEditModal] = useState({ isOpen: false, intervention: null })

  // ── Chrono temps réel ─────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 10000)
    return () => clearInterval(timer)
  }, [])

  // ── Chargement des données depuis /api/direction/supervision ──────────────
  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const response = await api.get('/direction/supervision', { params: { date: dateFiltre } })
      const data = response.data?.interventions || []
      setInterventionsList(data)
    } catch (err) {
      console.error('Erreur chargement GestionInterventions:', err)
      if (!silent) setError(err.response?.data?.message || 'Impossible de charger les interventions.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [dateFiltre])

  useEffect(() => { fetchData(false) }, [fetchData])

  // ── Écoute WebSocket temps réel (Reverb/Echo) ─────────────────────────────
  useEffect(() => {
    const echoInstance = echo || window.Echo
    if (!echoInstance) return

    const atelierChannel = echoInstance.channel('atelier')
    const garageChannel = echoInstance.channel('garage')

    const handleWsEvent = (eventData) => {
      console.log('⚡ [GestionInterventions] Reverb event:', eventData)
      if (eventData?.id) {
        setInterventionsList((prev) =>
          prev.map((item) =>
            item.id === eventData.id
              ? { ...item, statut: eventData.statut || item.statut, motif_blocage: eventData.motif_blocage ?? item.motif_blocage, date_debut: eventData.date_debut || item.date_debut }
              : item
          )
        )
      }
      fetchData(true)
    }

    atelierChannel.listen('InterventionStatusChanged', handleWsEvent)
    atelierChannel.listen('.InterventionStatusChanged', handleWsEvent)
    atelierChannel.listen('.intervention.updated', handleWsEvent)
    garageChannel.listen('TicketStatusUpdated', handleWsEvent)
    garageChannel.listen('.TicketStatusUpdated', handleWsEvent)
    garageChannel.listen('TicketCreated', handleWsEvent)
    garageChannel.listen('.TicketCreated', handleWsEvent)

    return () => {
      atelierChannel.stopListening('InterventionStatusChanged')
      atelierChannel.stopListening('.InterventionStatusChanged')
      atelierChannel.stopListening('.intervention.updated')
      garageChannel.stopListening('TicketStatusUpdated')
      garageChannel.stopListening('.TicketStatusUpdated')
      garageChannel.stopListening('TicketCreated')
      garageChannel.stopListening('.TicketCreated')
      echoInstance.leaveChannel('atelier')
      echoInstance.leaveChannel('garage')
    }
  }, [fetchData])

  // ── FONCTIONS D'ACTION (Axios) ─────────────────────────────────────────────

  /**
   * Met à jour le statut d'une intervention via PATCH /api/direction/interventions/{id}/status
   */
  const handleUpdateStatus = async (id, newStatus) => {
    setLoadingActionId(id)
    try {
      await api.patch(`/direction/interventions/${id}/status`, { statut: newStatus })
      setInterventionsList((prev) =>
        prev.map((item) => item.id === id ? { ...item, statut: newStatus } : item)
      )
    } catch (err) {
      console.error(`Erreur PATCH statut "${newStatus}" id=${id}:`, err)
      alert(err.response?.data?.message || `Erreur lors du changement de statut vers "${newStatus}".`)
    } finally {
      setLoadingActionId(null)
    }
  }

  /**
   * Annule définitivement une intervention via POST /api/direction/interventions/{id}/annuler
   */
  const handleAnnulerAPI = async (id) => {
    setConfirmModal((prev) => ({ ...prev, isLoading: true }))
    setLoadingActionId(id)
    try {
      await api.post(`/direction/interventions/${id}/annuler`)
      setInterventionsList((prev) => prev.filter((item) => item.id !== id))
      setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }))
    } catch (err) {
      console.error('Erreur annulation id=', id, err)
      setConfirmModal((prev) => ({ ...prev, isLoading: false }))
      alert(err.response?.data?.message || "Erreur lors de l'annulation.")
    } finally {
      setLoadingActionId(null)
    }
  }

  /**
   * Clôture une intervention (statut -> Terminé) avec confirmation
   */
  const handleTerminerAPI = async (id) => {
    setConfirmModal((prev) => ({ ...prev, isLoading: true }))
    await handleUpdateStatus(id, 'Terminé')
    setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }))
  }

  // ── Déclencheurs ─────────────────────────────────────────────────────────
  const handleModifier = (intervention) => setEditModal({ isOpen: true, intervention })

  const handlePause = (intervention) => {
    const isPaused = ['en pause', 'en_pause', 'pause'].includes(String(intervention.statut || '').toLowerCase())
    const nextStatus = isPaused ? 'En cours' : 'En pause'
    handleUpdateStatus(intervention.id, nextStatus)
  }

  const handleTerminer = (intervention) => {
    setConfirmModal({
      isOpen: true,
      title: "Clôturer l'intervention ?",
      message: `Vous allez marquer l'intervention sur "${intervention.vehicule}" comme Terminée. Cette action informera le client que le véhicule est prêt.`,
      confirmLabel: 'Oui, clôturer',
      confirmColor: 'green',
      isLoading: false,
      onConfirm: () => handleTerminerAPI(intervention.id),
    })
  }

  const handleAnnuler = (intervention) => {
    setConfirmModal({
      isOpen: true,
      title: 'Annuler définitivement ?',
      message: `Vous êtes sur le point d'annuler l'intervention sur "${intervention.vehicule}". Cette action est irréversible et supprimera l'opération.`,
      confirmLabel: 'Oui, annuler',
      confirmColor: 'red',
      isLoading: false,
      onConfirm: () => handleAnnulerAPI(intervention.id),
    })
  }

  const handleEditSaved = (id, updatedData) => {
    setInterventionsList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, type_intervention: updatedData.type_intervention, motif_blocage: updatedData.motif_blocage } : item
      )
    )
  }

  // ── Transformation API -> groupes par technicien ──────────────────────────
  const equipeMap = {}

  interventionsList.forEach((item) => {
    const techId = item.technicien?.id || 0
    const techNom = item.technicien?.nom_complet || item.technicien?.nom || item.technicien?.name || 'Technicien Non Assigné'

    if (!equipeMap[techId]) {
      equipeMap[techId] = { id: techId, nom: techNom, vehiculesTraites: 0, interventions: [] }
    }

    const isVariable = Boolean(
      item.est_variable === true ||
      (item.catalogue && item.catalogue.est_variable === true) ||
      (item.vehicule?.prestations && item.vehicule.prestations.some((p) => p.est_variable === true))
    )
    const baremeMinutesOfficiel = item.temps_bareme_officiel ?? item.catalogue?.temps_bareme ?? (item.temps_bareme_total ?? item.bareme ?? 60)
    const baremeMin = isVariable ? 0 : baremeMinutesOfficiel
    const dateDebutISO = item.started_at || item.date_debut

    // ✅ CALCUL CHRONO ACCUMULATEUR STRICT :
    // - temps_passe_accumule : temps cumulé persisté en BDD (stoppé lors des pauses/blocages)
    // - chrono_start_time    : timestamp de la session active (null si chrono arrêté)
    //
    // Temps affiché = temps_passe_accumule + (now - chrono_start_time) si En cours, sinon strictement temps_passe_accumule
    const tempsAccumuleServeur = Number(item.temps_passe_accumule || item.temps_passe_minutes || item.temps_passe || 0)
    const chronoStartTime = item.chrono_start_time || item.heure_reprise

    let tempsPasseMin = tempsAccumuleServeur
    if (item.statut === 'En cours' && chronoStartTime) {
      const repriseMs = new Date(chronoStartTime).getTime()
      if (!isNaN(repriseMs)) {
        const depuisReprise = Math.max(0, Math.floor((nowTick - repriseMs) / 60000))
        tempsPasseMin = tempsAccumuleServeur + depuisReprise
      }
    }
    // Si statut != 'En cours' (Bloqué, En pause...) : on utilise strictement tempsAccumuleServeur

    equipeMap[techId].interventions.push({
      id: item.id,
      vehicule: item.vehicule ? `${item.vehicule.nom_complet || item.vehicule.marque} (${item.vehicule.matricule})` : 'Véhicule N/A',
      clientNom: item.client?.nom || 'Client Particulier',
      clientTel: item.client?.telephone || 'Non renseigné',
      type: item.type_intervention,
      statut: item.statut,
      motifBlocage: item.motif_blocage,
      tempsBareme: baremeMin / 60,
      tempsBaremeOfficiel: item.temps_bareme_officiel ?? item.catalogue?.temps_bareme,
      catalogue: item.catalogue,
      tempsPasse: tempsPasseMin / 60,
      startedAt: dateDebutISO,
      baremeMin,
      tempsPasseMin,
      estVariable: isVariable,
      heureArrivee: item.heure_arrivee,
      pontNom: item.pont?.nom || 'Non affecté',
    })
    equipeMap[techId].vehiculesTraites = equipeMap[techId].interventions.length
  })

  const equipeJour = Object.values(equipeMap).map((tech) => {
    const hasBloque = tech.interventions.some((i) => i.statut === 'Bloqué')
    const hasEnCours = tech.interventions.some((i) => i.statut === 'En cours' || i.statut === 'En attente')
    let statutGlobal = 'Terminé'
    if (hasBloque) statutGlobal = 'Bloqué'
    else if (hasEnCours) statutGlobal = 'Actif'

    const totalBareme = tech.interventions.reduce((sum, i) => sum + (i.tempsBareme || 0), 0)
    const totalPasse = tech.interventions.reduce((sum, i) => sum + (i.tempsPasse || 0), 0)
    const rendement = totalBareme > 0 ? Math.min(Math.round((totalPasse / totalBareme) * 100), 100) : 0
    const isDepassement = totalPasse > totalBareme && totalBareme > 0

    return { ...tech, statutGlobal, totalBareme, totalPasse, rendement, isDepassement }
  })

  const technicienActif = equipeJour.find((t) => t.id === technicienActifId) || null
  const totalVehicules = equipeJour.reduce((acc, t) => acc + t.vehiculesTraites, 0)
  const techniciensActifsCount = equipeJour.filter((t) => t.statutGlobal === 'Actif').length
  const techniciensBloquesCount = equipeJour.filter((t) => t.statutGlobal === 'Bloqué').length
  const totalInterventions = interventionsList.length

  // ── Écran de chargement initial ───────────────────────────────────────────
  if (loading && equipeJour.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 animate-pulse">Chargement des interventions...</p>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDU PRINCIPAL
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50/50 p-3 sm:p-6 space-y-4 sm:space-y-6 font-sans">

      {/* ─── Modales globales ─────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmColor={confirmModal.confirmColor}
        isLoading={confirmModal.isLoading}
      />
      <EditInterventionModal
        isOpen={editModal.isOpen}
        intervention={editModal.intervention}
        onClose={() => setEditModal({ isOpen: false, intervention: null })}
        onSaved={handleEditSaved}
      />

      {/* ─── EN-TÊTE PRINCIPAL ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chef d'Atelier — Gestion Active</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-1">Gestion des Interventions</h1>
          <p className="text-xs text-slate-500 mt-0.5">Modifier, suspendre, clôturer ou annuler chaque intervention en temps réel</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-start sm:items-end">
            <label htmlFor="date-filtre-gestion" className="text-xs font-semibold text-slate-500 mb-1">Date d'observation</label>
            <input
              id="date-filtre-gestion"
              type="date"
              value={dateFiltre}
              onChange={(e) => setDateFiltre(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition shadow-xs cursor-pointer w-full sm:w-auto"
            />
          </div>
        </div>
      </div>

      {/* ─── BANDEAU KPI ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500">Total Équipe</p>
            <p className="text-xl font-bold text-slate-800">{equipeJour.length} <span className="text-xs font-normal text-slate-400">techs</span></p>
          </div>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500">Techniciens Actifs</p>
            <p className="text-xl font-bold text-emerald-600">{techniciensActifsCount}</p>
          </div>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500">Interventions Totales</p>
            <p className="text-xl font-bold text-slate-800">{totalInterventions}</p>
          </div>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500">Statuts Bloqués</p>
            <p className={`text-xl font-bold ${techniciensBloquesCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{techniciensBloquesCount}</p>
          </div>
        </div>
      </div>

      {/* ─── GESTION D'ERREUR ─────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* ─── TABLEAU TECHNICIENS ──────────────────────────────────────────── */}
      {equipeJour.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">📋</div>
          <p className="font-semibold text-slate-600 text-sm">Aucune intervention enregistrée pour le {dateFiltre}</p>
          <p className="text-xs text-slate-400">Choisissez une autre date ou attendez les premières prises en charge.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Gestion Active — Équipe du Jour
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Cliquez sur "Détails" pour gérer les interventions de chaque technicien</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 shrink-0">
              {equipeJour.length} technicien{equipeJour.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* En-têtes colonnes (desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-3">Technicien</div>
            <div className="col-span-1 text-center">Statut</div>
            <div className="col-span-1 text-center">Tâches</div>
            <div className="col-span-5">Rendement Journée</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          <ul className="divide-y divide-slate-100">
            {equipeJour.map((technicien) => {
              let badgeCls = ''
              let badgeDotCls = ''
              if (technicien.statutGlobal === 'Actif') { badgeCls = 'bg-emerald-50 text-emerald-700 border-emerald-200'; badgeDotCls = 'bg-emerald-500' }
              else if (technicien.statutGlobal === 'Terminé') { badgeCls = 'bg-slate-50 text-slate-600 border-slate-200'; badgeDotCls = 'bg-slate-400' }
              else if (technicien.statutGlobal === 'Bloqué') { badgeCls = 'bg-rose-50 text-rose-700 border-rose-200'; badgeDotCls = 'bg-rose-500' }

              let barColor = 'bg-emerald-500'
              let barTrack = 'bg-emerald-100'
              if (technicien.isDepassement) { barColor = 'bg-rose-500'; barTrack = 'bg-rose-100' }
              else if (technicien.statutGlobal === 'Actif') { barColor = 'bg-blue-500'; barTrack = 'bg-blue-100' }

              const pourcentageBrut = technicien.totalBareme > 0 ? Math.round((technicien.totalPasse / technicien.totalBareme) * 100) : 0
              const largeurBarre = Math.min(pourcentageBrut, 100)

              return (
                <li key={technicien.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center px-4 sm:px-6 py-4 hover:bg-slate-50/60 transition-colors group">
                  <div className="md:col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-yellow-400 font-bold flex items-center justify-center text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {technicien.nom.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{technicien.nom}</p>
                      <p className="text-[11px] text-slate-400 truncate">Technicien Atelier</p>
                    </div>
                  </div>
                  <div className="md:col-span-1 flex md:justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${badgeCls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badgeDotCls} ${technicien.statutGlobal === 'Actif' ? 'animate-pulse' : ''}`} />
                      {technicien.statutGlobal}
                    </span>
                  </div>
                  <div className="md:col-span-1 flex md:justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black text-slate-800 leading-none">{technicien.vehiculesTraites}</span>
                      <span className="text-[10px] font-medium text-slate-400 leading-none">véh.</span>
                    </div>
                  </div>
                  <div className="md:col-span-5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500">
                        {formaterTemps(technicien.totalPasse)}<span className="text-slate-300 mx-1">/</span>{formaterTemps(technicien.totalBareme)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {technicien.isDepassement ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            Retard : <span className="font-black">+{formaterTemps(technicien.totalPasse - technicien.totalBareme)}</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold tabular-nums text-slate-600">{largeurBarre}%</span>
                        )}
                      </div>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${barTrack}`}>
                      <div className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`} style={{ width: `${largeurBarre}%` }} />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex md:justify-end">
                    <button type="button"
                      onClick={() => setTechnicienActifId(technicien.id === technicienActifId ? null : technicien.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-800 hover:text-yellow-400 hover:border-slate-800 active:scale-95 transition-all duration-200 cursor-pointer group/btn">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 016 0z" />
                      </svg>
                      {technicienActifId === technicien.id ? 'Fermer' : 'Détails'}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-0 -ml-1 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="px-4 sm:px-6 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <p className="text-[11px] text-slate-400 font-medium">
              {equipeJour.length} technicien{equipeJour.length > 1 ? 's' : ''} · {totalVehicules} véhicule{totalVehicules > 1 ? 's' : ''} traité{totalVehicules > 1 ? 's' : ''}
            </p>
            {techniciensBloquesCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {techniciensBloquesCount} blocage{techniciensBloquesCount > 1 ? 's' : ''} actif{techniciensBloquesCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ─── PANNEAU LATÉRAL SLIDE-OVER avec les 4 boutons d'action ────────── */}
      {technicienActif && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div onClick={() => setTechnicienActifId(null)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" />
          <aside className="fixed inset-y-0 right-0 w-full md:w-[480px] min-w-0 max-w-full bg-slate-50 shadow-2xl z-50 overflow-y-auto border-l border-slate-200 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between z-10 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-yellow-400 font-bold flex items-center justify-center text-sm shrink-0">
                  {technicienActif.nom.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-snug truncate">{technicienActif.nom}</h2>
                  <p className="text-xs text-slate-500 font-medium">Gestion active · {dateFiltre}</p>
                </div>
              </div>
              <button type="button" onClick={() => setTechnicienActifId(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Corps */}
            <div className="p-4 sm:p-6 flex-1 space-y-5">
              {/* Résumé technicien */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Statut</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{technicienActif.statutGlobal}</p>
                </div>
                <div className="text-center">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Véhicules</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{technicienActif.vehiculesTraites}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Rendement</span>
                  <p className={`text-sm font-bold mt-0.5 ${technicienActif.isDepassement ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {technicienActif.rendement}%
                  </p>
                </div>
              </div>

              {/* Légende des actions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>✏️ Modifier · ⏸️ Pause · ✅ Terminer · ❌ Annuler</span>
                <span className="text-blue-400 font-normal">Actions critiques demandent confirmation.</span>
              </div>

              {/* Liste des interventions */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Interventions ({technicienActif.interventions.length})
                </h3>

                {technicienActif.interventions.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
                    Aucune intervention enregistrée.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {technicienActif.interventions.map((intervention) => {
                      const isVariable = Boolean(
                        intervention.estVariable === true ||
                        (intervention.catalogue && intervention.catalogue.est_variable === true)
                      )
                      const isDepasse = !isVariable && intervention.tempsPasse > intervention.tempsBareme
                      const pourcent = isVariable ? 0 : Math.min(Math.round((intervention.tempsPasse / (intervention.tempsBareme || 1)) * 100), 100)
                      let barColorClass = 'bg-emerald-500'
                      if (isDepasse) barColorClass = 'bg-rose-500'
                      else if (intervention.statut === 'En cours') barColorClass = 'bg-blue-500'

                      return (
                        <div key={intervention.id} className="bg-white rounded-xl shadow-xs border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
                          {/* Carte en-tête */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-sm truncate">{intervention.vehicule}</p>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                  Client : <span className="text-slate-700 font-semibold">{intervention.clientNom}</span>
                                  {intervention.clientTel !== 'Non renseigné' && <span className="text-slate-400"> · {intervention.clientTel}</span>}
                                </p>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                  Type : <span className="text-slate-700 font-semibold">{intervention.type}</span>
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Pont : <span className="font-semibold text-slate-600">{intervention.pontNom}</span>
                                </p>
                              </div>
                              <InterventionStatusBadge statut={intervention.statut} />
                            </div>

                            {/* Motif de blocage */}
                            {intervention.statut === 'Bloqué' && (
                              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-xl shadow-xs flex items-start gap-2.5">
                                <span className="text-base leading-none shrink-0 mt-0.5">⚠️</span>
                                <p className="text-xs font-bold uppercase tracking-wider text-red-800">
                                  MOTIF : {intervention.motifBlocage || 'Problème technique / En attente de pièces'}
                                </p>
                              </div>
                            )}

                            {/* Barre de progression */}
                            {isVariable ? (
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pt-1">
                                <span>Temps passé : <strong className="font-mono">{formaterTemps(intervention.tempsPasse)}</strong></span>
                                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Durée variable</span>
                              </div>
                            ) : (
                              <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-700">
                                    {formaterTemps(intervention.tempsPasse)} / {formaterTemps(intervention.tempsBaremeOfficiel ? (intervention.tempsBaremeOfficiel / 60) : intervention.tempsBareme)}
                                  </span>
                                  {isDepasse ? (
                                    <span className="font-bold text-rose-600 flex items-center gap-1">
                                      +{formaterTemps(intervention.tempsPasse - intervention.tempsBareme)}
                                      <span className="text-[10px] uppercase bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-black">Retard</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-medium">{pourcent}%</span>
                                  )}
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-500 ${barColorClass}`} style={{ width: `${Math.min(pourcent, 100)}%` }} />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Zone des 4 boutons d'action */}
                          <div className="px-3 sm:px-4 py-2.5 bg-slate-50/80 border-t border-slate-100">
                            <ActionButtons
                              intervention={intervention}
                              loadingId={loadingActionId}
                              onModifier={handleModifier}
                              onPause={handlePause}
                              onTerminer={handleTerminer}
                              onAnnuler={handleAnnuler}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Pied */}
            <div className="bg-white border-t border-slate-200 p-4 text-center text-xs text-slate-400">
              Gestion Active Chef d'Atelier • Temps réel API
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
