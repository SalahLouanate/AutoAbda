import { useState, useEffect } from 'react'
import api from '../api/axios'

/**
 * Modale & Vue Historique du Véhicule (Module Réception)
 * Permet au réceptionniste de rechercher l'historique complet d'un véhicule par son immatriculation.
 */
export default function HistoriqueVehiculeModal({ isOpen, onClose, initialPlaque = '' }) {
  const [immatriculation, setImmatriculation] = useState(initialPlaque)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [historiqueData, setHistoriqueData] = useState(null)
  const [searchedPlaque, setSearchedPlaque] = useState('')

  useEffect(() => {
    if (initialPlaque) {
      setImmatriculation(initialPlaque)
      handleSearch(initialPlaque)
    }
  }, [initialPlaque])

  const handleSearch = async (plaqueToSearch) => {
    const queryPlaque = (plaqueToSearch || immatriculation).trim().toUpperCase()
    if (!queryPlaque) {
      setError('Veuillez saisir une immatriculation.')
      return
    }

    setLoading(true)
    setError(null)
    setSearchedPlaque(queryPlaque)

    try {
      const response = await api.get(`/reception/vehicules/${encodeURIComponent(queryPlaque)}/historique`)
      if (response.data) {
        setHistoriqueData(response.data)
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique:', err)
      setError(err.response?.data?.message || 'Impossible de récupérer l\'historique pour ce véhicule.')
      setHistoriqueData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSearch()
  }

  if (isOpen === false) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Conteneur Modale */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200 my-8">
          
          {/* Header de la Modale */}
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-900 font-bold flex items-center justify-center text-lg shadow-sm">
                🚗
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">
                  Historique Complet du Véhicule
                </h3>
                <p className="text-xs text-slate-400">
                  Consultez l'historique des passages et interventions à la Réception
                </p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Barre de Recherche */}
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={immatriculation}
                  onChange={(e) => setImmatriculation(e.target.value.toUpperCase())}
                  placeholder="Entrez une immatriculation (ex: 1234-A-50, AA-123-BB)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-900 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>Recherche...</span>
                  </>
                ) : (
                  <>
                    <span>Rechercher</span>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Corps & Résultats */}
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            {!historiqueData && !loading && (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-semibold text-slate-600 text-sm">Aucune recherche effectuée</p>
                <p className="text-xs text-slate-400 mt-1">Saisissez une plaque d'immatriculation ci-dessus pour afficher son historique.</p>
              </div>
            )}

            {historiqueData && (
              <>
                {/* Carte Résumé du Véhicule */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-slate-900 text-yellow-400 rounded-xl font-mono font-black text-sm tracking-wider shadow-xs border border-slate-800">
                      {historiqueData.immatriculation}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-800">
                        {historiqueData.vehicule?.nom_complet || 'Véhicule Client'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Client : <span className="text-slate-800 font-semibold">{historiqueData.vehicule?.client_nom || 'Client Particulier'}</span> ({historiqueData.vehicule?.client_telephone || 'N/A'})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 self-start sm:self-auto">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Passages totaux</span>
                      <span className="text-lg font-black text-slate-800">{historiqueData.total || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline des Interventions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <span>Historique des passages ({historiqueData.total})</span>
                  </h4>

                  {historiqueData.historique && historiqueData.historique.length > 0 ? (
                    <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pl-6 py-2">
                      {historiqueData.historique.map((item, index) => {
                        let statutBadgeCls = 'bg-amber-100 text-amber-800 border-amber-200'
                        if (item.statut === 'En cours') statutBadgeCls = 'bg-blue-100 text-blue-800 border-blue-200'
                        if (item.statut === 'Terminé') statutBadgeCls = 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        if (item.statut === 'Bloqué') statutBadgeCls = 'bg-rose-100 text-rose-800 border-rose-200'

                        return (
                          <div key={item.id || index} className="relative group">
                            {/* Puce Timeline */}
                            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-slate-800 group-hover:border-yellow-400 transition-colors" />

                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2 hover:border-slate-300 transition">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-800">
                                    📅 {item.date_passage}
                                  </span>
                                  <span className="text-xs text-slate-400">à {item.heure_arrivee}</span>
                                  {item.is_rdv && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700">
                                      RDV
                                    </span>
                                  )}
                                </div>

                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statutBadgeCls}`}>
                                  {item.statut}
                                </span>
                              </div>

                              <div className="pt-1">
                                <p className="text-sm font-bold text-slate-800">
                                  🛠️ {item.type_intervention}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                                <span>
                                  Technicien : <strong className="text-slate-700 font-semibold">{item.technicien?.name || item.technicien?.nom || 'Non assigné'}</strong>
                                </span>
                                {item.pont && (
                                  <span className="text-slate-400">
                                    Pont : <strong className="text-slate-700">{item.pont.nom}</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm">
                      Aucune intervention trouvée pour cette immatriculation.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Fermer
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
