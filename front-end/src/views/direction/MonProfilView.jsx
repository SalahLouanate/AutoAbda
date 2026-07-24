import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

// ─────────────────────────────────────────────────────────────────────────────
// ICÔNES SVG inline
// ─────────────────────────────────────────────────────────────────────────────
function IcoUser() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}
function IcoLock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}
function IcoCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}
function IcoEye({ visible }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Champ de saisie réutilisable
// ─────────────────────────────────────────────────────────────────────────────
function InputField({ id, label, type = 'text', value, onChange, placeholder, error, rightElement }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full text-sm text-slate-800 bg-slate-50 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:bg-white transition placeholder:text-slate-400
            ${error
              ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
              : 'border-slate-200 focus:ring-blue-400 focus:border-blue-400'
            }
            ${rightElement ? 'pr-11' : ''}
          `}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">{error}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast notification
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ message, visible }) {
  if (!visible) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl animate-fade-in">
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white flex-shrink-0">
        <IcoCheck />
      </span>
      {message}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function MonProfilView() {
  const { user } = useAuth()

  // ── Section 1 : Informations Personnelles ────────────────────────────────
  const [nom,   setNom]   = useState(user?.name  ?? 'Chef d\'Atelier')
  const [email, setEmail] = useState(user?.email ?? 'chef@autoabda.ma')
  const [profileErrors, setProfileErrors] = useState({})

  // ── Section 2 : Sécurité & Mot de passe ─────────────────────────────────
  const [mdpActuel,      setMdpActuel]      = useState('')
  const [mdpNouveau,     setMdpNouveau]     = useState('')
  const [mdpConfirm,     setMdpConfirm]     = useState('')
  const [showActuel,     setShowActuel]     = useState(false)
  const [showNouveau,    setShowNouveau]    = useState(false)
  const [showConfirm,    setShowConfirm]    = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState({ visible: false, message: '' })

  function showToast(message) {
    setToast({ visible: true, message })
    setTimeout(() => setToast({ visible: false, message: '' }), 3000)
  }

  // ── Initiales (avatar) ───────────────────────────────────────────────────
  const initiales = nom
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')

  // ── Handler : Profil ──────────────────────────────────────────────────────
  function handleProfileSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!nom.trim()) errs.nom = 'Le nom est obligatoire.'
    if (!email.trim()) errs.email = 'L\'email est obligatoire.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Format d\'email invalide.'
    setProfileErrors(errs)
    if (Object.keys(errs).length > 0) return
    // Mock: persist
    showToast('Profil mis à jour avec succès.')
  }

  // ── Handler : Mot de passe ────────────────────────────────────────────────
  function handlePasswordSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!mdpActuel) errs.mdpActuel = 'Veuillez entrer votre mot de passe actuel.'
    if (!mdpNouveau) errs.mdpNouveau = 'Le nouveau mot de passe est requis.'
    else if (mdpNouveau.length < 8) errs.mdpNouveau = 'Minimum 8 caractères.'
    if (!mdpConfirm) errs.mdpConfirm = 'Veuillez confirmer le mot de passe.'
    else if (mdpNouveau && mdpConfirm !== mdpNouveau) errs.mdpConfirm = 'Les mots de passe ne correspondent pas.'
    setPasswordErrors(errs)
    if (Object.keys(errs).length > 0) return
    // Mock: reset fields
    setMdpActuel(''); setMdpNouveau(''); setMdpConfirm('')
    showToast('Mot de passe changé avec succès.')
  }

  // ── Calcul force du mot de passe ──────────────────────────────────────────
  const passwordStrength = (() => {
    if (!mdpNouveau) return null
    let score = 0
    if (mdpNouveau.length >= 8)  score++
    if (mdpNouveau.length >= 12) score++
    if (/[A-Z]/.test(mdpNouveau)) score++
    if (/[0-9]/.test(mdpNouveau)) score++
    if (/[^A-Za-z0-9]/.test(mdpNouveau)) score++
    if (score <= 1) return { label: 'Faible',    color: 'bg-red-500',   width: 'w-1/4' }
    if (score <= 3) return { label: 'Moyen',     color: 'bg-amber-400', width: 'w-2/4' }
    if (score <= 4) return { label: 'Fort',      color: 'bg-blue-500',  width: 'w-3/4' }
    return                { label: 'Très fort', color: 'bg-emerald-500', width: 'w-full' }
  })()

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50 py-2">
      <div className="max-w-3xl mx-auto px-6 space-y-6">

        {/* ── EN-TÊTE PAGE ─────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Paramètres du compte
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos informations personnelles et la sécurité de votre compte.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — Informations Personnelles
        ══════════════════════════════════════════════════════════════════ */}
        <section className="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">

          {/* Header section */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <IcoUser />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Informations Personnelles</h2>
              <p className="text-xs text-slate-400 mt-0.5">Votre identité visible dans l'application</p>
            </div>
          </div>

          <div className="p-6">
            {/* Avatar */}
            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-yellow-400 font-black text-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 select-none">
                  {initiales || '?'}
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" title="En ligne" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg leading-snug">{nom || 'Chef d\'Atelier'}</p>
                <p className="text-sm text-slate-500 mt-0.5">{email || '—'}</p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-2 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  Chef d'Atelier · Direction
                </span>
              </div>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleProfileSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <InputField
                  id="profil-nom"
                  label="Nom complet"
                  value={nom}
                  onChange={e => { setNom(e.target.value); setProfileErrors(v => ({ ...v, nom: '' })) }}
                  placeholder="Prénom Nom"
                  error={profileErrors.nom}
                />
                <InputField
                  id="profil-email"
                  label="Adresse e-mail"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setProfileErrors(v => ({ ...v, email: '' })) }}
                  placeholder="chef@autoabda.ma"
                  error={profileErrors.email}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                  </svg>
                  Mettre à jour le profil
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — Sécurité & Mot de passe
        ══════════════════════════════════════════════════════════════════ */}
        <section className="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">

          {/* Header section */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
              <IcoLock />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Sécurité & Mot de passe</h2>
              <p className="text-xs text-slate-400 mt-0.5">Modifier le mot de passe de votre compte</p>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handlePasswordSubmit} noValidate>
              <div className="space-y-5">

                {/* Mot de passe actuel */}
                <InputField
                  id="mdp-actuel"
                  label="Mot de passe actuel"
                  type={showActuel ? 'text' : 'password'}
                  value={mdpActuel}
                  onChange={e => { setMdpActuel(e.target.value); setPasswordErrors(v => ({ ...v, mdpActuel: '' })) }}
                  placeholder="••••••••••"
                  error={passwordErrors.mdpActuel}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowActuel(v => !v)}
                      className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      <IcoEye visible={showActuel} />
                    </button>
                  }
                />

                {/* Séparateur */}
                <div className="h-px bg-slate-100" />

                {/* Grille : nouveau + confirmation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <InputField
                      id="mdp-nouveau"
                      label="Nouveau mot de passe"
                      type={showNouveau ? 'text' : 'password'}
                      value={mdpNouveau}
                      onChange={e => { setMdpNouveau(e.target.value); setPasswordErrors(v => ({ ...v, mdpNouveau: '' })) }}
                      placeholder="Min. 8 caractères"
                      error={passwordErrors.mdpNouveau}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowNouveau(v => !v)}
                          className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <IcoEye visible={showNouveau} />
                        </button>
                      }
                    />

                    {/* Jauge de force */}
                    {passwordStrength && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span>Force du mot de passe</span>
                          <span className={`font-bold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color} ${passwordStrength.width}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <InputField
                    id="mdp-confirm"
                    label="Confirmer le nouveau mot de passe"
                    type={showConfirm ? 'text' : 'password'}
                    value={mdpConfirm}
                    onChange={e => { setMdpConfirm(e.target.value); setPasswordErrors(v => ({ ...v, mdpConfirm: '' })) }}
                    placeholder="••••••••••"
                    error={passwordErrors.mdpConfirm}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        <IcoEye visible={showConfirm} />
                      </button>
                    }
                  />
                </div>

                {/* Conseils de sécurité */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Conseils pour un mot de passe fort :</p>
                  <ul className="space-y-1">
                    {[
                      ['Au moins 8 caractères',           mdpNouveau.length >= 8],
                      ['Au moins une lettre majuscule',   /[A-Z]/.test(mdpNouveau)],
                      ['Au moins un chiffre',             /[0-9]/.test(mdpNouveau)],
                      ['Au moins un caractère spécial',   /[^A-Za-z0-9]/.test(mdpNouveau)],
                    ].map(([tip, ok]) => (
                      <li key={tip} className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${ok ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                          {ok && <IcoCheck />}
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-semibold text-sm rounded-xl shadow-md shadow-slate-900/15 transition-all"
                  >
                    <IcoLock />
                    Changer le mot de passe
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* Espace bas de page */}
        <div className="pb-4" />
      </div>

      {/* ── TOAST NOTIFICATION ─────────────────────────────────────────────── */}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
