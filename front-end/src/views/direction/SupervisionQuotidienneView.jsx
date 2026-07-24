import React, { useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — Équipe Jour & Interventions
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_EQUIPE_JOUR = [
  {
    id: 1,
    nom: 'Yassir Zimi',
    vehiculesTraites: 3,
    statutGlobal: 'Actif',
    interventions: [
      {
        id: 101,
        vehicule: 'Renault Express - MQ-096-HI',
        type: 'Vidange',
        statut: 'En cours',
        tempsBareme: 1.5,
        tempsPasse: 1.2,
      },
      {
        id: 102,
        vehicule: 'Dacia Sandero - AB-123-CD',
        type: 'Plaquettes',
        statut: 'En attente',
        tempsBareme: 1.0,
        tempsPasse: 0,
      },
      {
        id: 103,
        vehicule: 'Peugeot 208 - EF-456-GH',
        type: 'Remplacement Filtres',
        statut: 'Terminé',
        tempsBareme: 0.8,
        tempsPasse: 0.7,
      },
    ],
  },
  {
    id: 2,
    nom: 'Meraouni Mustapha',
    vehiculesTraites: 2,
    statutGlobal: 'Terminé',
    interventions: [
      {
        id: 104,
        vehicule: 'Renault Clio 5 - WX-888-YZ',
        type: 'Diagnostic',
        statut: 'Terminé',
        tempsBareme: 0.5,
        tempsPasse: 0.8,
      },
      {
        id: 105,
        vehicule: 'Citroën C3 - IJ-789-KL',
        type: 'Kit Distribution',
        statut: 'Terminé',
        tempsBareme: 3.0,
        tempsPasse: 2.8,
      },
    ],
  },
  {
    id: 3,
    nom: 'Karim Amrani',
    vehiculesTraites: 3,
    statutGlobal: 'Actif',
    interventions: [
      {
        id: 106,
        vehicule: 'Volkswagen Golf 7 - MN-654-OP',
        type: 'Parallélisme & Géométrie',
        statut: 'En cours',
        tempsBareme: 1.2,
        tempsPasse: 1.5,
      },
      {
        id: 107,
        vehicule: 'Ford Transit - QR-321-ST',
        type: 'Freins arrière',
        statut: 'En attente',
        tempsBareme: 2.0,
        tempsPasse: 0,
      },
      {
        id: 108,
        vehicule: 'Toyota Yaris - UV-987-WX',
        type: 'Recharge Climatisation',
        statut: 'En attente',
        tempsBareme: 1.0,
        tempsPasse: 0,
      },
    ],
  },
  {
    id: 4,
    nom: 'Hamza Bennani',
    vehiculesTraites: 1,
    statutGlobal: 'Bloqué',
    interventions: [
      {
        id: 109,
        vehicule: 'Peugeot 3008 - YZ-456-AA',
        type: 'Embrayage',
        statut: 'Bloqué',
        tempsBareme: 4.0,
        tempsPasse: 3.5,
      },
    ],
  },
  {
    id: 5,
    nom: 'Sofiane Touati',
    vehiculesTraites: 2,
    statutGlobal: 'Actif',
    interventions: [
      {
        id: 110,
        vehicule: 'Nissan Qashqai - BB-123-CC',
        type: 'Amortisseurs Avant',
        statut: 'En cours',
        tempsBareme: 2.5,
        tempsPasse: 1.8,
      },
      {
        id: 111,
        vehicule: 'Fiat Tipo - DD-456-EE',
        type: 'Vidange & Bougies',
        statut: 'Terminé',
        tempsBareme: 1.2,
        tempsPasse: 1.0,
      },
    ],
  },
]

// Helper format date standard YYYY-MM-DD
function getTodayISO() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function SupervisionQuotidienneView() {
  // 1. Gestion de l'état
  const [dateFiltre, setDateFiltre] = useState(getTodayISO())
  const [technicienActif, setTechnicienActif] = useState(null)
  const [equipeJour] = useState(MOCK_EQUIPE_JOUR)

  // 1. Fonction de formatage des temps décimaux en heures/minutes (UX)
  const formaterTemps = (heuresDecimales) => {
    if (!heuresDecimales || heuresDecimales === 0) return '0m'
    const h = Math.floor(heuresDecimales)
    const m = Math.round((heuresDecimales - h) * 60)

    if (h > 0 && m > 0) return `${h}h${m.toString().padStart(2, '0')}m`
    if (h > 0 && m === 0) return `${h}h`
    return `${m}m`
  }

  // Calculs KPI globaux
  const totalVehicules = equipeJour.reduce((acc, t) => acc + t.vehiculesTraites, 0)
  const techniciensActifsCount = equipeJour.filter((t) => t.statutGlobal === 'Actif').length
  const techniciensBloquesCount = equipeJour.filter((t) => t.statutGlobal === 'Bloqué').length

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      {/* ── 3. EN-TÊTE PRINCIPAL ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tour de Contrôle Atelier
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
            Supervision Quotidienne
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi temps réel du workflow, de l'affectation et du rendement des techniciens
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <label htmlFor="date-filtre" className="text-xs font-semibold text-slate-500 mb-1">
              Date d'observation
            </label>
            <input
              id="date-filtre"
              type="date"
              value={dateFiltre}
              onChange={(e) => setDateFiltre(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:outline-none transition shadow-xs cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ── BANDONEAU KPI D'APERÇU RAPIDE ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Équipe</p>
            <p className="text-xl font-bold text-slate-800">{equipeJour.length} <span className="text-xs font-normal text-slate-400">techs</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Techniciens Actifs</p>
            <p className="text-xl font-bold text-emerald-600">{techniciensActifsCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Véhicules du Jour</p>
            <p className="text-xl font-bold text-slate-800">{totalVehicules}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Statuts Bloqués</p>
            <p className={`text-xl font-bold ${techniciensBloquesCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {techniciensBloquesCount}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. GRILLE DES TECHNICIENS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {equipeJour.map((technicien) => {
          // Badge Statut Global
          let badgeColor = ''
          let badgeDotColor = ''

          if (technicien.statutGlobal === 'Actif') {
            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
            badgeDotColor = 'bg-emerald-500'
          } else if (technicien.statutGlobal === 'Terminé') {
            badgeColor = 'bg-slate-100 text-slate-700 border-slate-200'
            badgeDotColor = 'bg-slate-400'
          } else if (technicien.statutGlobal === 'Bloqué') {
            badgeColor = 'bg-rose-50 text-rose-700 border-rose-200'
            badgeDotColor = 'bg-rose-500'
          }

          // Détection d'alerte surdépassement pour l'affichage visuel sur la carte
          const aAlerteDepassement = technicien.interventions.some(
            (i) => i.tempsPasse > i.tempsBareme
          )

          return (
            <div
              key={technicien.id}
              onClick={() => setTechnicienActif(technicien)}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-slate-300 border border-slate-200 transition-all duration-200 relative group flex flex-col justify-between"
            >
              {/* Entête Carte */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-yellow-400 font-bold flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition-transform">
                      {technicien.nom
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-yellow-600 transition-colors">
                        {technicien.nom}
                      </h3>
                      <p className="text-xs text-slate-400">Technicien Atelier</p>
                    </div>
                  </div>
                </div>

                {/* Badge Statut Global */}
                <div className="flex items-center justify-between mt-2 mb-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${badgeDotColor} ${technicien.statutGlobal === 'Actif' ? 'animate-pulse' : ''}`} />
                    {technicien.statutGlobal}
                  </span>

                  {aAlerteDepassement && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200" title="Temps dépassé sur au moins 1 intervention">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Dépassement
                    </span>
                  )}
                </div>

                {/* Chiffre central */}
                <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100 my-2 group-hover:bg-slate-100/70 transition-colors">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Véhicules du jour
                  </p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {technicien.vehiculesTraites}
                  </p>
                </div>
              </div>

              {/* Pied de Carte */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{technicien.interventions.length} intervention(s)</span>
                <span className="text-yellow-600 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Détails
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 4. PANNEAU LATÉRAL (SLIDE-OVER / DRAWER) ── */}
      {technicienActif && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay arrière-plan sombre avec effet flouté */}
          <div
            onClick={() => setTechnicienActif(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
          />

          <aside
            className="fixed inset-y-0 right-0 w-full md:w-1/3 min-w-[340px] max-w-[550px] bg-slate-50 shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col"
          >
            {/* Header du Panneau Latéral */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between z-10 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-yellow-400 font-bold flex items-center justify-center text-sm">
                  {technicienActif.nom
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 leading-snug">
                    {technicienActif.nom}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Fiche du {dateFiltre}
                  </p>
                </div>
              </div>

              {/* Bouton Fermer (X) */}
              <button
                onClick={() => setTechnicienActif(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                title="Fermer (Esc)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Corps du Panneau Latéral */}
            <div className="p-6 flex-1 space-y-5">
              {/* Statut & Résumé Technicien */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Statut Général</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{technicienActif.statutGlobal}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Véhicules Traités</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{technicienActif.vehiculesTraites}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Interventions du Jour ({technicienActif.interventions.length})
                </h3>

                {technicienActif.interventions.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
                    Aucune intervention enregistrée aujourd'hui.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {technicienActif.interventions.map((intervention) => {
                      const isDepasse = intervention.tempsPasse > intervention.tempsBareme
                      const pourcent = Math.min(
                        Math.round((intervention.tempsPasse / intervention.tempsBareme) * 100),
                        100
                      )

                      // Configuration du Badge de Statut d'Intervention
                      let statusBadge = null
                      if (intervention.statut === 'En cours') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            <svg className="animate-spin -ml-0.5 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            En cours
                          </span>
                        )
                      } else if (intervention.statut === 'Terminé') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Terminé
                          </span>
                        )
                      } else if (intervention.statut === 'En attente') {
                        statusBadge = (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            En attente
                          </span>
                        )
                      } else if (intervention.statut === 'Bloqué') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Bloqué
                          </span>
                        )
                      }

                      // Couleur de la Barre de Progression (Point clé du prompt)
                      let barColorClass = 'bg-emerald-500'
                      if (isDepasse) {
                        barColorClass = 'bg-rose-500'
                      } else if (intervention.statut === 'En cours') {
                        barColorClass = 'bg-blue-500'
                      }

                      return (
                        <div
                          key={intervention.id}
                          className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 space-y-3 hover:border-slate-300 transition-colors"
                        >
                          {/* En-tête de carte d'intervention */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">
                                {intervention.vehicule}
                              </p>
                              <p className="text-xs font-medium text-slate-500 mt-0.5">
                                Type : <span className="text-slate-700 font-semibold">{intervention.type}</span>
                              </p>
                            </div>
                            <div>{statusBadge}</div>
                          </div>

                          {/* La Barre de Progression (Le point clé) */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700">
                                Temps passé : {formaterTemps(intervention.tempsPasse)} / Barème : {formaterTemps(intervention.tempsBareme)}
                              </span>
                              {isDepasse ? (
                                <span className="font-bold text-rose-600 flex items-center gap-1">
                                  <span>+{formaterTemps(intervention.tempsPasse - intervention.tempsBareme)}</span>
                                  <span className="text-[10px] uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-black">
                                    Alerte Perte Rentabilité
                                  </span>
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">{pourcent}%</span>
                              )}
                            </div>

                            {/* Container Barre */}
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                                style={{
                                  width: `${isDepasse ? 100 : pourcent}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Pied du Panneau Latéral */}
            <div className="bg-white border-t border-slate-200 p-4 text-center text-xs text-slate-400">
              Tour de Contrôle Chef d'Atelier • Mise à jour temps réel
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
