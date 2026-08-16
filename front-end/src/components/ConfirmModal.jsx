import React from 'react'

/**
 * Composant Modale de Confirmation Universel (Tailwind CSS)
 *
 * Props:
 * - isOpen (boolean) : Contrôle la visibilité de la modale.
 * - title (string) : Titre principal de la modale.
 * - message (string) : Description / question de confirmation.
 * - onConfirm (function) : Callback déclenché à la validation.
 * - onCancel (function) : Callback déclenché à l'annulation ou fermeture.
 * - confirmText (string) : Libellé du bouton de confirmation (ex: 'Supprimer', 'Déconnexion').
 * - cancelText (string) : Libellé du bouton d'annulation (ex: 'Annuler').
 * - confirmColor (string) : Couleur / Thème du bouton ('red' | 'rose' | 'blue' | 'emerald').
 */
export default function ConfirmModal({
  isOpen,
  title = 'Confirmation requise',
  message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
  onConfirm,
  onCancel,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmColor = 'blue',
}) {
  if (!isOpen) return null

  // Palette de styles dynamiques pour le bouton de confirmation selon la prop `confirmColor`
  const colorStyles = {
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500/20 shadow-red-600/20 text-white',
    rose: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/20 shadow-rose-600/20 text-white',
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20 shadow-blue-600/20 text-white',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/20 shadow-emerald-600/20 text-white',
    amber: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/20 shadow-amber-600/20 text-white',
  }

  const activeColorClass = colorStyles[confirmColor] || colorStyles.blue

  const isDestructive = confirmColor === 'red' || confirmColor === 'rose'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Contenu principal */}
        <div className="p-6 sm:p-7 text-center">
          {/* Badge icône dynamique */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              isDestructive
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}
          >
            {isDestructive ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
            )}
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
            {title}
          </h3>

          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
            {message}
          </p>

          {/* Actions / Boutons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-slate-900 transition active:scale-[0.98] cursor-pointer"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm shadow-md transition active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-4 ${activeColorClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
