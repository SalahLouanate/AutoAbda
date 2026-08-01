import { useState, useEffect } from 'react'
import api from '../../api/axios'
import ConfirmModal from '../../components/ConfirmModal'

const STATUTS_JOUR = ['Présent', 'Absent', 'En congé']

// ─────────────────────────────────────────────────────────────────────────────
// ICÔNES SVG
// ─────────────────────────────────────────────────────────────────────────────
function IcoPlus({ cls = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}
function IcoPen({ cls = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  )
}
function IcoTrash({ cls = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}
function IcoBan({ cls = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  )
}
function IcoCheck({ cls = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}
function IcoAlert({ cls = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}
function IcoX({ cls = 'h-5 w-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
function IcoUser({ cls = 'h-8 w-8' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}
function IcoKey({ cls = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
    </svg>
  )
}
function IcoRefresh({ cls = 'h-3.5 w-3.5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}
function IcoCopy({ cls = 'h-3.5 w-3.5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
  )
}
function IcoCar({ cls = 'h-6 w-6' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M3 11l2-5h14l2 5M3 11h18v6H3v-6zm3 6v1a1 1 0 002 0v-1m8 0v1a1 1 0 002 0v-1" />
    </svg>
  )
}
function IcoGear({ cls = 'h-5 w-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — Badges de couleur
// ─────────────────────────────────────────────────────────────────────────────
function BadgeStatutJour({ statut }) {
  const map = {
    'Présent':  'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Absent':   'bg-red-50 text-red-700 border-red-200',
    'En congé': 'bg-orange-50 text-orange-700 border-orange-200',
  }
  const dot = {
    'Présent':  'bg-emerald-400',
    'Absent':   'bg-red-500',
    'En congé': 'bg-orange-400',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${map[statut] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[statut] ?? 'bg-slate-400'}`} />
      {statut}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODALE — Ajout / Édition technicien
// ─────────────────────────────────────────────────────────────────────────────
const ROLES_OPTIONS = ['Technicien', 'Réceptionniste', 'Direction']

function genererMotDePasse() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function TechnicienModal({ isOpen, editTarget, pontsLibres = [], onClose, onSave }) {
  const isEdit = Boolean(editTarget)
  const [nom,        setNom]        = useState('')
  const [role,       setRole]       = useState('Technicien')
  const [pontDefaut, setPontDefaut] = useState('')
  const [email,      setEmail]      = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [copied,     setCopied]     = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [errors,     setErrors]     = useState({})

  // Construction de la liste des ponts disponibles :
  // Si le technicien en cours de modification possède déjà un pont, il est conservé dans les options.
  // Sinon, on affiche uniquement la liste des ponts actuellement 'Libres'.
  const pontsOptions = Array.from(new Set([
    ...(editTarget?.pontDefaut ? [editTarget.pontDefaut] : []),
    ...(pontsLibres.length > 0 ? pontsLibres : ['Pont 1', 'Pont 2', 'Pont 3', 'Pont 4', 'Pont 5'])
  ]))

  // Synchronisation stricte des champs à chaque ouverture ou changement de cible d'édition (editTarget)
  useEffect(() => {
    if (isOpen) {
      setNom(editTarget?.nom ?? '')
      setRole(editTarget?.role ?? 'Technicien')
      setEmail(editTarget?.email ?? '')
      setMotDePasse(editTarget?.motDePasse && editTarget?.motDePasse !== '********' ? editTarget.motDePasse : '')
      
      // Sélection par défaut : le pont actuel du technicien (si édition) ou le premier pont libre disponible
      if (editTarget?.pontDefaut) {
        setPontDefaut(editTarget.pontDefaut)
      } else if (pontsOptions.length > 0) {
        setPontDefaut(pontsOptions[0])
      } else {
        setPontDefaut('Pont 1')
      }

      setErrors({})
      setCopied(false)
    }
  }, [isOpen, editTarget])

  if (!isOpen) return null

  const isTechnicien = role === 'Technicien'

  function validate() {
    const e = {}
    if (!nom.trim()) e.nom = 'Le nom est obligatoire.'
    if (!email.trim()) e.email = 'L\'email de connexion est obligatoire.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Format d\'email invalide.'
    if (!isEdit && !motDePasse.trim()) e.motDePasse = 'Le mot de passe provisoire est obligatoire.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    await onSave({
      nom: nom.trim(),
      role,
      pontDefaut: isTechnicien ? pontDefaut : null,
      email: email.trim(),
      motDePasse: motDePasse.trim(),
    })
    setSaving(false)
  }

  function handleGenerer() {
    setMotDePasse(genererMotDePasse())
    setErrors(v => ({ ...v, motDePasse: '' }))
    setCopied(false)
  }

  function handleCopier() {
    if (!motDePasse) return
    navigator.clipboard.writeText(motDePasse).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        style={{ animation: 'modalIn .18s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {isEdit ? 'Modifier le membre du personnel' : 'Nouveau membre du personnel'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? `Édition de : ${editTarget.nom}` : 'Ajout à l\'équipe'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <IcoX />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5">

            {/* Grille principale 2 colonnes */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">

              {/* Ligne 1 — Nom complet + Rôle */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={e => { setNom(e.target.value); setErrors(v => ({ ...v, nom: '' })) }}
                  placeholder="Prénom Nom"
                  className={`w-full text-sm text-slate-700 bg-slate-50 border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:bg-white transition
                    ${errors.nom ? 'border-red-400 focus:ring-red-300' : 'border-slate-200 focus:ring-yellow-400 focus:border-yellow-400'}`}
                />
                {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Rôle
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition cursor-pointer"
                >
                  {ROLES_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Ligne 2 — Pont par défaut (Technicien uniquement, consommateur des ponts libres) */}
              {isTechnicien && (
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Pont par défaut (Ponts libres disponibles)
                  </label>
                  <select
                    value={pontDefaut}
                    onChange={e => setPontDefaut(e.target.value)}
                    className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition cursor-pointer font-medium"
                  >
                    {pontsOptions.map(p => (
                      <option key={p} value={p}>
                        {p} {editTarget?.pontDefaut === p ? '(Actuellement assigné)' : '(Libre)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ligne 3 — Zone identifiants (pleine largeur) */}
              <div className="col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                    <IcoKey cls="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Identifiants de connexion</span>
                  </div>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Email de connexion <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setErrors(v => ({ ...v, email: '' })) }}
                        placeholder="prenom.nom@autoabda.ma"
                        className={`w-full text-sm text-slate-700 bg-white border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:bg-white transition
                          ${errors.email ? 'border-red-400 focus:ring-red-300' : 'border-blue-200 focus:ring-blue-400 focus:border-blue-400'}`}
                      />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    {/* Mot de passe */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Mot de passe {isEdit ? '(Laisser vide si inchangé)' : <span className="text-red-500">*</span>}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={motDePasse}
                          onChange={e => { setMotDePasse(e.target.value); setErrors(v => ({ ...v, motDePasse: '' })) }}
                          placeholder={isEdit ? 'Inchangé' : 'Mot de passe temporaire'}
                          className={`flex-1 text-sm font-mono text-slate-700 bg-white border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:bg-white transition min-w-0
                            ${errors.motDePasse ? 'border-red-400 focus:ring-red-300' : 'border-blue-200 focus:ring-blue-400 focus:border-blue-400'}`}
                        />
                        <button
                          type="button"
                          onClick={handleGenerer}
                          title="Générer un mot de passe aléatoire"
                          className="p-2.5 rounded-xl bg-white border border-blue-200 text-blue-500 hover:bg-blue-50 hover:border-blue-400 transition-colors flex-shrink-0 cursor-pointer"
                        >
                          <IcoRefresh />
                        </button>
                        <button
                          type="button"
                          onClick={handleCopier}
                          title="Copier le mot de passe"
                          className={`p-2.5 rounded-xl border transition-colors flex-shrink-0 cursor-pointer ${
                            copied
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                              : 'bg-white border-blue-200 text-blue-500 hover:bg-blue-50 hover:border-blue-400'
                          }`}
                        >
                          {copied ? <IcoCheck cls="h-3.5 w-3.5" /> : <IcoCopy />}
                        </button>
                      </div>
                      {errors.motDePasse && <p className="text-xs text-red-500 mt-1">{errors.motDePasse}</p>}
                    </div>

                  </div>

                  {/* Texte d'aide */}
                  <p className="text-[11px] text-slate-500 mt-3 leading-relaxed flex items-start gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    Le membre du personnel utilisera cet email et ce mot de passe pour se connecter à son espace.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="px-6 pb-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-sm font-bold active:scale-95 shadow-md shadow-yellow-400/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? 'Enregistrement...' : (isEdit ? 'Enregistrer' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.96) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function GestionRessourcesView() {
  const [techniciens, setTechniciens] = useState([])
  const [ponts,       setPonts]       = useState([])
  const [pontsLibres, setPontsLibres] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // ── Chargement initial via l'API (Personnel, Ponts & Ponts Libres) ────────
  const fetchRessourcesData = async () => {
    try {
      setLoading(true)
      const [resPersonnel, resPonts, resPontsLibres] = await Promise.all([
        api.get('/direction/ressources/personnel'),
        api.get('/direction/ressources/ponts'),
        api.get('/direction/ressources/ponts-libres'),
      ])

      // Mapping du personnel
      const mappedPersonnel = (resPersonnel.data?.personnel || []).map(p => ({
        id: p.id,
        nom: p.nom,
        role: p.role_label || (p.role === 'technicien' ? 'Technicien' : p.role === 'reception' ? 'Réceptionniste' : 'Direction'),
        roleRaw: p.role,
        pontDefaut: p.pont_assigne ? p.pont_assigne.nom : null,
        pontId: p.pont_assigne ? p.pont_assigne.id : null,
        statutJour: 'Présent',
        actif: p.is_active ?? true,
        email: p.email,
        telephone: p.telephone,
        specialite: p.specialite,
        motDePasse: '********',
      }))

      // Mapping des ponts
      const mappedPonts = (resPonts.data?.ponts || []).map(b => ({
        id: b.id,
        nom: b.nom,
        statut: (b.statut === 'Maintenance' || b.est_en_maintenance) ? 'En maintenance' : (b.statut === 'Occupé' ? 'Occupé' : 'Opérationnel'),
        statutRaw: b.statut,
      }))

      // Extraire les noms des ponts libres
      const libresNames = (resPontsLibres.data?.ponts || []).map(p => p.nom)

      setTechniciens(mappedPersonnel)
      setPonts(mappedPonts)
      setPontsLibres(libresNames)
    } catch (err) {
      console.error('Erreur lors du chargement des ressources:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRessourcesData()
  }, [])

  // ── Statut jour ──────────────────────────────────────────────────────────
  const setStatutJour = (id, statut) =>
    setTechniciens(prev => prev.map(t => t.id === id ? { ...t, statutJour: statut } : t))

  // ── CRUD Personnel (POST / PUT / DELETE) ─────────────────────────────────
  const openCreate = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit   = (t)  => { setEditTarget(t);  setModalOpen(true) }

  const handleSave = async ({ nom, role, pontDefaut, email, motDePasse }) => {
    const roleSlug = role.toLowerCase().includes('réception') ? 'reception' : role.toLowerCase()
    
    let pontId = null
    if (pontDefaut && pontDefaut.includes('Pont')) {
      pontId = parseInt(pontDefaut.replace('Pont', '').trim())
    }

    try {
      if (editTarget) {
        // PUT /api/direction/ressources/personnel/{id}
        const payload = { name: nom, role: roleSlug, email, pont_id: pontId }
        if (motDePasse && motDePasse !== '********') {
          payload.password = motDePasse
        }
        await api.put(`/direction/ressources/personnel/${editTarget.id}`, payload)
      } else {
        // POST /api/direction/ressources/personnel
        await api.post('/direction/ressources/personnel', {
          name: nom,
          role: roleSlug,
          email,
          password: motDePasse || 'AutoAbda2026!',
          pont_id: pontId,
          is_active: true,
        })
      }
      await fetchRessourcesData()
      setModalOpen(false)
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du membre du personnel:', err)
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde.')
    }
  }

  const toggleActif = async (id) => {
    const tech = techniciens.find(t => t.id === id)
    if (!tech) return
    try {
      if (tech.actif) {
        // Désactivation (PUT is_active: false) -> libère automatiquement le pont en backend
        await api.put(`/direction/ressources/personnel/${id}`, { is_active: false })
      } else {
        // Réactivation (PUT is_active: true) -> affecte le premier pont libre si disponible
        const premierPontLibreName = pontsLibres[0]
        let newPontId = null
        if (premierPontLibreName && premierPontLibreName.includes('Pont')) {
          newPontId = parseInt(premierPontLibreName.replace('Pont', '').trim())
        }

        await api.put(`/direction/ressources/personnel/${id}`, { is_active: true, pont_id: newPontId })
      }
      await fetchRessourcesData()
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err)
      alert(err.response?.data?.message || 'Erreur lors du changement de statut du personnel.')
    }
  }

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete,       setUserToDelete]       = useState(null)

  // ── Suppression Définitive (Modale) ───────────────────────────────────────
  const requestDeletePersonnel = (id, nom) => {
    setUserToDelete({ id, nom })
    setIsDeleteModalOpen(true)
  }

  const confirmDeletePersonnel = async () => {
    if (!userToDelete) return
    const { id } = userToDelete
    setIsDeleteModalOpen(false)
    setUserToDelete(null)

    try {
      // 1. Suppression optimiste locale
      setTechniciens(prev => prev.filter(t => t.id !== id))

      // 2. Appel API DELETE /api/direction/ressources/personnel/{id}
      await api.delete(`/direction/ressources/personnel/${id}`)
      await fetchRessourcesData()
    } catch (err) {
      console.error('Erreur lors de la suppression définitive du membre du personnel:', err)
      alert(err.response?.data?.message || 'Erreur lors de la suppression.')
      await fetchRessourcesData()
    }
  }

  // ── Toggle statut pont (PUT /api/direction/ressources/ponts/{id}/statut) 
  const togglePont = async (id) => {
    const pontTarget = ponts.find(p => p.id === id)
    if (!pontTarget) return

    const nouveauStatut = pontTarget.statut === 'Opérationnel' ? 'Maintenance' : 'Libre'
    try {
      await api.put(`/direction/ressources/ponts/${id}/statut`, { status: nouveauStatut, statut: nouveauStatut })
      await fetchRessourcesData()
    } catch (err) {
      console.error('Erreur lors du changement de statut du pont:', err)
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour du statut du pont.')
    }
  }

  // ── Compteurs rapides ────────────────────────────────────────────────────
  const nbPresents    = techniciens.filter(t => t.actif && t.statutJour === 'Présent').length
  const nbAbsents     = techniciens.filter(t => t.actif && t.statutJour === 'Absent').length
  const nbConge       = techniciens.filter(t => t.actif && t.statutJour === 'En congé').length
  const nbMaintenance = ponts.filter(p => {
    const st = String(p.statut || '').toLowerCase()
    return st.includes('maint') || st.includes('hors')
  }).length

  if (loading && techniciens.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 animate-pulse">Chargement de la gestion des ressources...</p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── EN-TÊTE PAGE ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Gestion des Ressources</h1>
            <p className="text-sm text-slate-400 mt-0.5 capitalize">{today}</p>
          </div>
          {/* KPIs rapides */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />{nbPresents} présent{nbPresents > 1 ? 's' : ''}
            </span>
            {nbAbsents > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500" />{nbAbsents} absent{nbAbsents > 1 ? 's' : ''}
              </span>
            )}
            {nbConge > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-orange-400" />{nbConge} en congé
              </span>
            )}
            {nbMaintenance > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">
                <IcoAlert cls="h-3 w-3 text-amber-500" />{nbMaintenance} pont{nbMaintenance > 1 ? 's' : ''} bloqué{nbMaintenance > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION A — Pointage du jour
        ══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <IcoUser cls="h-5 w-5 text-slate-400" />
                Pointage du jour
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{today}</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
              {techniciens.filter(t => t.actif).length} techniciens actifs
            </span>
          </div>

          <div className="space-y-3">
            {techniciens.filter(t => t.actif).map(tech => (
              <div
                key={tech.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
              >
                {/* Identité */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-black text-sm flex-shrink-0">
                    {tech.nom.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{tech.nom}</p>
                    <p className="text-xs text-slate-400">{tech.pontDefaut || 'Non assigné'}</p>
                  </div>
                </div>

                {/* Sélecteur statut — boutons radio visuels */}
                <div className="flex items-center gap-2 flex-wrap">
                  {STATUTS_JOUR.map(statut => {
                    const isActive = tech.statutJour === statut
                    const style = {
                      'Présent':  isActive ? 'bg-emerald-500 text-white border-emerald-500' : 'text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600',
                      'Absent':   isActive ? 'bg-red-500 text-white border-red-500'         : 'text-slate-500 border-slate-200 hover:border-red-300 hover:text-red-600',
                      'En congé': isActive ? 'bg-orange-400 text-white border-orange-400'   : 'text-slate-500 border-slate-200 hover:border-orange-300 hover:text-orange-600',
                    }
                    return (
                      <button
                        key={statut}
                        onClick={() => setStatutJour(tech.id, statut)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer ${style[statut]}`}
                      >
                        {statut}
                      </button>
                    )
                  })}
                  <BadgeStatutJour statut={tech.statutJour} />
                </div>
              </div>
            ))}

            {techniciens.filter(t => t.actif).length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <IcoUser cls="h-10 w-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">Aucun technicien actif à pointer.</p>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION B — Équipe technique
        ══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <IcoUser cls="h-5 w-5 text-slate-400" />
                Équipe technique
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Base de données du personnel</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-900 font-bold text-xs rounded-xl shadow-md shadow-yellow-400/30 transition-all flex-shrink-0 cursor-pointer"
            >
              <IcoPlus />
              Ajouter un personnel
            </button>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {/* En-têtes */}
            <div className="grid grid-cols-12 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-3">Nom</div>
              <div className="col-span-2">Rôle</div>
              <div className="col-span-3">Email / Pont</div>
              <div className="col-span-2 text-center">Statut</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {techniciens.length === 0 ? (
              <div className="text-center py-14 text-slate-400">
                <IcoUser cls="h-10 w-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">Aucun technicien enregistré.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {techniciens.map(tech => (
                  <li
                    key={tech.id}
                    className={`grid grid-cols-12 items-center px-4 py-3.5 hover:bg-slate-50/70 transition-colors ${!tech.actif ? 'opacity-50' : ''}`}
                  >
                    {/* Nom */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
                        ${tech.actif ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-400'}`}>
                        {tech.nom.charAt(0)}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate">{tech.nom}</p>
                    </div>

                    {/* Rôle */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                        tech.role === 'Technicien'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {tech.role ?? 'Technicien'}
                      </span>
                    </div>

                    {/* Email / Pont */}
                    <div className="col-span-3">
                      <p className="text-xs text-slate-700 font-medium truncate">{tech.email ?? <span className="text-slate-400 italic">—</span>}</p>
                      <p className="text-xs text-slate-400">{tech.pontDefaut ?? <span className="italic">—</span>}</p>
                    </div>

                    {/* Statut contrat */}
                    <div className="col-span-2 flex justify-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        tech.actif
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {tech.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      {/* Bouton Modifier (icône crayon) */}
                      <button
                        onClick={() => openEdit(tech)}
                        title="Modifier"
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <IcoPen />
                      </button>

                      {/* Bouton Activer / Désactiver */}
                      <button
                        onClick={() => toggleActif(tech.id)}
                        title={tech.actif ? 'Désactiver' : 'Réactiver'}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          tech.actif
                            ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {tech.actif ? <IcoBan /> : <IcoCheck />}
                      </button>

                      {/* Bouton Suppression Définitive */}
                      <button
                        onClick={() => requestDeletePersonnel(tech.id, tech.nom)}
                        title="Supprimer définitivement"
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <IcoTrash />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION C — État des Ponts Élévateurs
        ══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <IcoCar cls="h-5 w-5 text-slate-400" />
                État des Ponts Élévateurs
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Basculez le statut de chaque pont en un clic</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />Opérationnel</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />Maintenance</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {ponts.map(pont => {
              const isOk = pont.statut === 'Opérationnel' || pont.statut === 'Libre'
              return (
                <button
                  key={pont.id}
                  onClick={() => togglePont(pont.id)}
                  className={`group flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 active:scale-95 text-center cursor-pointer
                    ${isOk
                      ? 'border-emerald-300 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100'
                      : 'border-slate-300 bg-slate-100 hover:border-slate-400'
                    }`}
                  style={!isOk ? {
                    backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(148,163,184,.1) 6px,rgba(148,163,184,.1) 12px)',
                  } : {}}
                >
                  {/* Icône pont */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                    ${isOk ? 'bg-emerald-100 text-emerald-500' : 'bg-slate-200 text-slate-400'}`}>
                    {isOk ? <IcoCar cls="h-5 w-5" /> : <IcoGear cls="h-5 w-5" />}
                  </div>

                  {/* Nom */}
                  <p className={`text-sm font-bold ${isOk ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {pont.nom}
                  </p>

                  {/* Badge statut */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border w-full text-center transition-colors
                    ${isOk
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 group-hover:bg-white'
                      : 'bg-slate-50 text-slate-500 border-slate-300'
                    }`}>
                    {isOk ? 'Opérationnel' : '⚠ Maintenance'}
                  </span>

                  {/* Indice action */}
                  <p className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
                    Cliquer pour basculer
                  </p>
                </button>
              )
            })}
          </div>

          {/* Résumé infrastructure */}
          <div className="mt-4 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <IcoAlert cls="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">{ponts.filter(p => p.statut === 'Opérationnel' || p.statut === 'Libre').length}</span> ponts opérationnels ·{' '}
              <span className="font-bold text-slate-700">{nbMaintenance}</span> en maintenance
              {nbMaintenance > 0 && (
                <span className="text-amber-600 font-semibold">
                  {' '}— {ponts.filter(p => p.statut === 'En maintenance' || p.statut === 'Maintenance').map(p => p.nom).join(', ')} hors service
                </span>
              )}
            </p>
          </div>
        </div>

      </div>

      {/* ── MODALE TECHNICIEN ─────────────────────────────────── */}
      <TechnicienModal
        isOpen={modalOpen}
        editTarget={editTarget}
        pontsLibres={pontsLibres}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      {/* ── MODALE SUPPRESSION DÉFINITIVE ──────────────────────── */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Suppression définitive"
        message={`Voulez-vous vraiment supprimer définitivement ${userToDelete?.nom || 'cet utilisateur'} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmColor="red"
        onConfirm={confirmDeletePersonnel}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setUserToDelete(null)
        }}
      />
    </div>
  )
}
