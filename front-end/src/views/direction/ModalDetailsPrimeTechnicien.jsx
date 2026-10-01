import React, { useEffect } from 'react'

/**
 * ModalDetailsPrimeTechnicien
 * Modal de justification & audit journalier du calcul de prime pour un technicien.
 *
 * Props:
 * - isOpen (booléen) : contrôle de visibilité
 * - onClose (function) : callback de fermeture
 * - technicien (object) : données du technicien incluant `details_journaliers`, `total_mensuel_gagne`, `total_mensuel_perdu`
 * - tauxCommission (number) : taux de prime en MAD/h (défaut: 20)
 */
export default function ModalDetailsPrimeTechnicien({
  isOpen,
  onClose,
  technicien,
  tauxCommission = 20,
}) {
  // Fermeture sur la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !technicien) return null

  const details = technicien.details_journaliers || []

  // Totaux calculés ou récupérés des props
  const totalGagne =
    technicien.total_mensuel_gagne !== undefined
      ? Number(technicien.total_mensuel_gagne)
      : Number(details.reduce((sum, j) => sum + (Number(j.temps_gagne) || 0), 0).toFixed(2))

  const totalPerdu =
    technicien.total_mensuel_perdu !== undefined
      ? Number(technicien.total_mensuel_perdu)
      : Number(details.reduce((sum, j) => sum + (Number(j.temps_perdu) || 0), 0).toFixed(2))

  const totalBareme = Number(
    details.reduce((sum, j) => sum + (Number(j.bareme_total) || 0), 0).toFixed(2)
  )
  const totalReel = Number(
    details.reduce((sum, j) => sum + (Number(j.passe_total) || 0), 0).toFixed(2)
  )
  const totalVehicules = details.reduce(
    (sum, j) => sum + (Number(j.vehicules) || 0),
    0
  )

  const joursValidesCount = details.filter((j) => j.seuil_atteint).length
  const joursInvalidesCount = details.filter((j) => !j.seuil_atteint).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* ─── HEADER DU MODAL ─── */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 font-black flex items-center justify-center text-base shadow-md">
              {technicien.nom ? technicien.nom.charAt(0).toUpperCase() : 'T'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-title" className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Justification Prime : {technicien.nom}
                </h2>
                <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                  Audit Journalier
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Détail jour par jour — Règle : Seuil &gt; 8h de barème vendu (480 min) obligatoire pour valider le temps gagné
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
            title="Fermer"
            aria-label="Fermer la boîte de dialogue"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ─── BARRE STATISTIQUES RAPIDES ─── */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Jours Travaillés</span>
            <span className="text-sm font-extrabold text-slate-800">
              {details.length} jour{details.length > 1 ? 's' : ''} ({totalVehicules} véh.)
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Validation Seuil 8h</span>
            <span className="text-sm font-extrabold text-emerald-700 flex items-center gap-1">
              <span>{joursValidesCount} validé{joursValidesCount > 1 ? 's' : ''}</span>
              {joursInvalidesCount > 0 && (
                <span className="text-2xs font-bold text-rose-600">({joursInvalidesCount} rejeté{joursInvalidesCount > 1 ? 's' : ''})</span>
              )}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Volume Total Vendu / Réel</span>
            <span className="text-sm font-extrabold text-blue-700">
              {totalBareme}h <span className="text-slate-400 font-normal">/</span> {totalReel}h
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Prime Estimée ({tauxCommission} MAD/h)</span>
            <span className="text-sm font-black text-violet-700">
              {(totalGagne * tauxCommission).toLocaleString('fr-FR')} MAD
            </span>
          </div>
        </div>

        {/* ─── TABLEAU DU DÉTAIL JOURNALIER (SCROLLABLE) ─── */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          {details.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-sm font-semibold text-slate-600">Aucune donnée journalière enregistrée</p>
              <p className="text-xs text-slate-400">Aucune intervention clôturée trouvée pour ce technicien sur la période.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                    <th scope="col" className="py-3 px-3.5 whitespace-nowrap">Date</th>
                    <th scope="col" className="py-3 px-3 text-center whitespace-nowrap">Véhicules</th>
                    <th scope="col" className="py-3 px-3 text-center text-blue-700 whitespace-nowrap">Barème (Vendu)</th>
                    <th scope="col" className="py-3 px-3 text-center text-slate-700 whitespace-nowrap">Réel (Passé)</th>
                    <th scope="col" className="py-3 px-3 text-center whitespace-nowrap">Seuil 8h Atteint ?</th>
                    <th scope="col" className="py-3 px-3 text-center text-emerald-700 whitespace-nowrap font-black">Temps Gagné</th>
                    <th scope="col" className="py-3 px-3.5 text-center text-rose-700 whitespace-nowrap font-black">Temps Perdu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {details.map((jour, index) => {
                    const seuilOk = Boolean(jour.seuil_atteint)
                    const tempsGagne = Number(jour.temps_gagne) || 0
                    const tempsPerdu = Number(jour.temps_perdu) || 0
                    const baremeH = Number(jour.bareme_total) || 0
                    const passeH = Number(jour.passe_total) || 0

                    return (
                      <tr
                        key={jour.date || index}
                        className={`transition-colors ${
                          seuilOk
                            ? 'bg-white hover:bg-slate-50/80 border-l-4 border-l-emerald-500'
                            : 'bg-rose-50/30 hover:bg-rose-50/60 border-l-4 border-l-rose-400 text-slate-500'
                        }`}
                      >
                        {/* Date */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-800">
                            {jour.date_formatted || jour.date}
                          </div>
                          {jour.date_label && (
                            <div className="text-2xs text-slate-400 capitalize">
                              {jour.date_label}
                            </div>
                          )}
                        </td>

                        {/* Véhicules */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-extrabold text-slate-700 border border-slate-200">
                            🚗 {jour.vehicules}
                          </span>
                        </td>

                        {/* Barème Vendu */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold border border-blue-200">
                            {baremeH}h
                          </span>
                        </td>

                        {/* Réel Passé */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 rounded-lg font-bold border ${
                            passeH <= baremeH
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {passeH}h
                          </span>
                        </td>

                        {/* Seuil 8h Atteint ? */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {seuilOk ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Validé (&gt; 8h)
                            </span>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-extrabold bg-rose-100 text-rose-700 border border-rose-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Non atteint (≤ 8h)
                              </span>
                              <span className="text-3xs text-rose-500 font-semibold mt-0.5">
                                Journée invalidée
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Temps Gagné */}
                        <td className="py-3 px-3 text-center whitespace-nowrap font-extrabold">
                          {seuilOk ? (
                            tempsGagne > 0 ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 font-black">
                                +{tempsGagne}h
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold">0h</span>
                            )
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 line-through text-2xs" title="Temps gagné annulé car seuil des 8h non atteint">
                              0h (annulé)
                            </span>
                          )}
                        </td>

                        {/* Temps Perdu */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap font-extrabold">
                          {tempsPerdu > 0 ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-700 border border-rose-300 font-black">
                              -{tempsPerdu}h
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold">0h</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── FOOTER DU MODAL AVEC TOTAUX MIS EN ÉVIDENCE ─── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          
          {/* Totaux Temps Gagné (Vert) & Temps Perdu (Rouge) */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            
            {/* Total Temps Gagné (Payé) - VERT */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                +
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wider font-extrabold text-emerald-700">
                  Total Temps Gagné (Payé)
                </p>
                <p className="text-base font-black text-emerald-800 leading-tight">
                  +{totalGagne}h
                  <span className="ml-1.5 text-xs font-bold text-emerald-600">
                    ({(totalGagne * tauxCommission).toLocaleString('fr-FR')} MAD)
                  </span>
                </p>
              </div>
            </div>

            {/* Total Temps Perdu / Annulé - ROUGE */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                -
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wider font-extrabold text-rose-700">
                  Total Temps Perdu / Annulé
                </p>
                <p className="text-base font-black text-rose-800 leading-tight">
                  -{totalPerdu}h
                  <span className="ml-1.5 text-xs font-semibold text-rose-600">
                    (retards + seuils &le; 8h)
                  </span>
                </p>
              </div>
            </div>

          </div>

          {/* Bouton de Fermeture */}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer text-center"
          >
            Fermer l'audit
          </button>

        </div>

      </div>
    </div>
  )
}
