import { useState, useMemo, useEffect } from 'react'
import api from '../../api/axios'

// ─────────────────────────────────────────────────────────────────────────────
// ICÔNES SVG inline
// ─────────────────────────────────────────────────────────────────────────────
function IcoSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 5.197Z"/>
    </svg>
  )
}

function IcoPen() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"/>
    </svg>
  )
}

function IcoTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
    </svg>
  )
}

function IcoClock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
    </svg>
  )
}

function IcoX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/>
    </svg>
  )
}

function IcoPlus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
    </svg>
  )
}

function IcoList() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL — Ajout / Édition d'une intervention
// ─────────────────────────────────────────────────────────────────────────────
function InterventionModal({ isOpen, editTarget, onClose, onSave }) {
  const isEdit = Boolean(editTarget)

  const [nom,         setNom]         = useState(editTarget?.nom         ?? '')
  const [temps,       setTemps]       = useState(editTarget?.temps       ?? '')
  const [estVariable, setEstVariable] = useState(editTarget?.est_variable ?? false)
  const [errors,      setErrors]      = useState({})
  const [saving,      setSaving]      = useState(false)

  // Reset à chaque ouverture
  useMemo(() => {
    if (isOpen) {
      setNom(editTarget?.nom         ?? '')
      setTemps(editTarget?.temps     ?? '')
      setEstVariable(editTarget?.est_variable ?? false)
      setErrors({})
      setSaving(false)
    }
  }, [isOpen, editTarget])

  if (!isOpen) return null

  function validate() {
    const e = {}
    if (!nom.trim()) e.nom = 'Le nom est obligatoire.'
    if (!estVariable && (temps === '' || Number(temps) <= 0)) {
      e.temps = 'Le temps doit être supérieur à 0.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    await onSave({
      nom: nom.trim(),
      temps: estVariable ? 0 : parseFloat(Number(temps).toFixed(2)),
      est_variable: estVariable,
    })
    setSaving(false)
  }

  return (
    /* Fond assombri */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Carte modale */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'modalIn .18s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {isEdit ? 'Modifier l\'intervention' : 'Nouvelle intervention'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? `Édition de : ${editTarget.nom}` : 'Ajout au catalogue'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <IcoX />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-6 space-y-5">

            {/* Nom de l'intervention */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Nom de l'intervention <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nom}
                onChange={e => { setNom(e.target.value); setErrors(v => ({ ...v, nom: '' })) }}
                placeholder="Ex : Diagnostic Électronique / Recherche de panne"
                className={`w-full text-sm text-slate-700 bg-slate-50 border rounded-xl px-4 py-2.5
                  focus:outline-none focus:ring-2 focus:bg-white transition
                  ${errors.nom ? 'border-red-400 focus:ring-red-300' : 'border-slate-200 focus:ring-yellow-400 focus:border-yellow-400'}`}
              />
              {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
            </div>

            {/* Case à cocher : Durée variable */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                id="est_variable_check"
                checked={estVariable}
                onChange={e => {
                  const isChecked = e.target.checked
                  setEstVariable(isChecked)
                  if (isChecked) setErrors(v => ({ ...v, temps: '' }))
                }}
                className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-400 border-slate-300 cursor-pointer"
              />
              <label htmlFor="est_variable_check" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Durée variable (au temps passé)
              </label>
            </div>

            {/* Temps alloué */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Temps alloué (Heures) {!estVariable && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                  <IcoClock />
                </div>
                <input
                  type="number"
                  disabled={estVariable}
                  value={estVariable ? '' : temps}
                  onChange={e => { setTemps(e.target.value); setErrors(v => ({ ...v, temps: '' })) }}
                  placeholder={estVariable ? 'Temps indéterminé (Variable)' : '1.5'}
                  step="0.1"
                  min="0.1"
                  className={`w-full text-sm text-slate-700 bg-slate-50 border rounded-xl pl-10 pr-4 py-2.5
                    focus:outline-none focus:ring-2 focus:bg-white transition
                    ${estVariable ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}
                    ${errors.temps ? 'border-red-400 focus:ring-red-300' : 'border-slate-200 focus:ring-yellow-400 focus:border-yellow-400'}`}
                />
              </div>
              {errors.temps
                ? <p className="text-xs text-red-500 mt-1">{errors.temps}</p>
                : <p className="text-xs text-slate-400 mt-1">
                    {estVariable ? 'Durée libre selon le temps réel passé par le technicien.' : 'Exemple : 0.5 = 30 min · 1.0 = 1h · 1.5 = 1h30'}
                  </p>
              }
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-sm font-bold active:scale-95 shadow-md shadow-yellow-400/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? 'Enregistrement...' : (isEdit ? 'Enregistrer' : 'Sauvegarder')}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1)  translateY(0);    }
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODALE DE CONFIRMATION — Suppression
// ─────────────────────────────────────────────────────────────────────────────
function DeleteModal({ target, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false)

  if (!target) return null

  const handleConfirm = async () => {
    setDeleting(true)
    await onConfirm()
    setDeleting(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        style={{ animation: 'modalIn .18s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 text-red-500 mx-auto mb-4">
          <IcoTrash />
        </div>
        <h2 className="text-base font-bold text-slate-800 text-center">Supprimer l'intervention ?</h2>
        <p className="text-sm text-slate-500 text-center mt-2">
          « <span className="font-semibold text-slate-700">{target.nom}</span> » sera définitivement retirée du catalogue.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition active:scale-95 disabled:opacity-50"
          >
            {deleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1)  translateY(0);    }
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function CatalogueInterventionsView() {
  const [interventions, setInterventions] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [searchQuery,   setSearchQuery]   = useState('')
  const [isModalOpen,   setIsModalOpen]   = useState(false)
  const [editTarget,    setEditTarget]    = useState(null)   // null = création, objet = édition
  const [deleteTarget,  setDeleteTarget]  = useState(null)   // objet à supprimer

  // ── Chargement initial via l'API (GET /api/direction/catalogue) ───────────
  const fetchCatalogue = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/direction/catalogue')
      const rawList = response.data?.prestations || []
      
      const mapped = rawList.map(item => ({
        id: item.id,
        nom: item.nom,
        temps: item.temps_bareme_heures || Math.round((item.temps_bareme / 60) * 100) / 100,
        categorie: item.categorie,
        tarif: item.tarif,
        description: item.description,
      }))
      setInterventions(mapped)
    } catch (err) {
      console.error('Erreur lors du chargement du catalogue:', err)
      setError(err.response?.data?.message || 'Impossible de charger le catalogue.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCatalogue()
  }, [])

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return interventions
    return interventions.filter(i => i.nom.toLowerCase().includes(q))
  }, [interventions, searchQuery])

  // ── Handlers API (POST, PUT, DELETE) ──────────────────────────────────────
  const openCreate = () => { setEditTarget(null); setIsModalOpen(true) }
  const openEdit   = (item) => { setEditTarget(item); setIsModalOpen(true) }
  const closeModal = () => setIsModalOpen(false)

  const handleSave = async ({ nom, temps, est_variable }) => {
    const tempsBaremeMinutes = est_variable ? 0 : Math.max(1, Math.round(temps * 60))
    try {
      if (editTarget) {
        // PUT /api/direction/catalogue/{id}
        await api.put(`/direction/catalogue/${editTarget.id}`, {
          nom,
          temps_bareme: tempsBaremeMinutes,
          est_variable,
        })
      } else {
        // POST /api/direction/catalogue
        await api.post('/direction/catalogue', {
          nom,
          categorie: 'Mécanique',
          temps_bareme: tempsBaremeMinutes,
          tarif: 350,
          description: 'Intervention catalogue',
          est_variable,
        })
      }
      await fetchCatalogue()
      setIsModalOpen(false)
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde de l\'intervention.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      // DELETE /api/direction/catalogue/{id}
      await api.delete(`/direction/catalogue/${deleteTarget.id}`)
      await fetchCatalogue()
      setDeleteTarget(null)
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      alert(err.response?.data?.message || 'Erreur lors de la suppression de l\'intervention.')
    }
  }

  // ── Formatage du temps ────────────────────────────────────────────────────
  const formatTemps = (h, isVariable = false) => {
    if (isVariable || !h || h <= 0) return 'Indéfinie'
    if (h < 1) return `${Math.round(h * 60)} min`
    const heures  = Math.floor(h)
    const minutes = Math.round((h - heures) * 60)
    return minutes > 0 ? `${heures}h${String(minutes).padStart(2, '0')}` : `${heures}h00`
  }

  // ─────────────────────────────────────────────────────────────────────────
  if (loading && interventions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 animate-pulse">Chargement du catalogue des interventions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── EN-TÊTE ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Catalogue des Interventions
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Gérez les types d'interventions et leurs temps barémés (en heures).
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-900 font-bold text-sm rounded-xl shadow-md shadow-yellow-400/30 transition-all duration-150 flex-shrink-0 cursor-pointer"
          >
            <IcoPlus />
            Nouvelle intervention
          </button>
        </div>

        {/* ── BARRE DE RECHERCHE + COMPTEUR ─────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
              <IcoSearch />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher une intervention..."
              className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 placeholder:text-slate-400 shadow-sm transition"
            />
          </div>
          <span className="text-xs font-medium text-slate-400 flex-shrink-0">
            {filtered.length} / {interventions.length} intervention{interventions.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* ── TABLEAU ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">

          {/* En-têtes */}
          <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-1">ID</div>
            <div className="col-span-6">Nom de l'intervention</div>
            <div className="col-span-3 text-center">Temps Barémé</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Lignes */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                <IcoList />
              </div>
              <p className="text-slate-500 font-medium">Aucune intervention trouvée</p>
              <p className="text-sm text-slate-400 mt-1">
                {searchQuery
                  ? 'Essayez un autre terme de recherche.'
                  : 'Cliquez sur « Nouvelle intervention » pour commencer.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/70 transition-colors group"
                >
                  {/* ID */}
                  <div className="col-span-1">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold">
                      {item.id}
                    </span>
                  </div>

                  {/* Nom */}
                  <div className="col-span-6 min-w-0 pr-4 flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.nom}</p>
                    {item.est_variable && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                        Durée variable
                      </span>
                    )}
                  </div>

                  {/* Temps */}
                  <div className="col-span-3 flex items-center justify-center gap-2">
                    {item.est_variable || !item.temps || item.temps === 0 ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                        <IcoClock />
                        Indéfinie
                      </span>
                    ) : (
                      <>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                          <IcoClock />
                          {item.temps}h
                        </span>
                        <span className="text-xs text-slate-400 hidden lg:block">{formatTemps(item.temps)}</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {/* Bouton Éditer */}
                    <button
                      onClick={() => openEdit(item)}
                      title="Modifier"
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <IcoPen />
                    </button>
                    {/* Bouton Supprimer */}
                    <button
                      onClick={() => setDeleteTarget(item)}
                      title="Supprimer"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <IcoTrash />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pied de tableau */}
          {filtered.length > 0 && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {interventions.length} intervention{interventions.length > 1 ? 's' : ''} dans le catalogue
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400">Données synchronisées en direct (API)</span>
              </div>
            </div>
          )}
        </div>

        {/* ── LÉGENDE TEMPS ───────────────────────────────────── */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="text-blue-400 flex-shrink-0 mt-0.5"><IcoClock /></div>
          <div>
            <p className="text-xs font-bold text-blue-700 mb-1">Unité : Heures décimales</p>
            <p className="text-xs text-blue-600">
              0.5 = 30 min · 1.0 = 1h00 · 1.5 = 1h30 · 2.0 = 2h00
            </p>
          </div>
        </div>

      </div>

      {/* ── MODALES ──────────────────────────────────────────── */}
      <InterventionModal
        isOpen={isModalOpen}
        editTarget={editTarget}
        onClose={closeModal}
        onSave={handleSave}
      />
      <DeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
