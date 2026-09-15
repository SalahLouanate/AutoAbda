import React, { useState, useEffect } from 'react'
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

export default function SupervisionQuotidienneView() {
  // 1. Gestion de l'état
  const [dateFiltre, setDateFiltre] = useState(getTodayISO())
  const [interventionsList, setInterventionsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [technicienActifId, setTechnicienActifId] = useState(null)

  // Chronomètre temps réel : rafraîchissement dynamique des temps passés toutes les 10 secondes
  const [nowTick, setNowTick] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now())
    }, 10000)

    return () => clearInterval(timer)
  }, [])

  // 2. Appel API vers /api/direction/supervision avec transmission du filtre date
  const fetchSupervisionData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const response = await api.get('/direction/supervision', {
        params: { date: dateFiltre },
      })
      const data = response.data?.interventions || []
      setInterventionsList(data)
    } catch (err) {
      console.error('Erreur lors du chargement de la supervision:', err)
      if (!silent) {
        setError(err.response?.data?.message || 'Impossible de charger la supervision.')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Chargement initial des données et au changement de la date sélectionnée (dateFiltre)
  useEffect(() => {
    fetchSupervisionData(false)
  }, [dateFiltre])

  // 3. Écouteur temps réel dédié avec Laravel Echo (Reverb) sur les canaux 'garage' et 'atelier'
  useEffect(() => {
    const echoInstance = echo || window.Echo

    if (echoInstance) {
      const atelierChannel = echoInstance.channel('atelier')
      const garageChannel = echoInstance.channel('garage')

      const handleWebSocketEvent = (eventData) => {
        console.log('⚡ Événement temps réel Reverb capté sur la supervision quotidienne:', eventData)
        
        // Mise à jour instantanée en mémoire locale si l'ID d'intervention correspond
        if (eventData && eventData.id) {
          setInterventionsList((prevList) =>
            prevList.map((item) =>
              item.id === eventData.id
                ? {
                    ...item,
                    statut: eventData.statut || item.statut,
                    motif_blocage: eventData.motif_blocage ?? item.motif_blocage,
                    date_debut: eventData.date_debut || item.date_debut,
                  }
                : item
            )
          )
        }

        // Rafraîchissement silencieux des données fraîches
        fetchSupervisionData(true)
      }

      atelierChannel.listen('InterventionStatusChanged', handleWebSocketEvent)
      atelierChannel.listen('.InterventionStatusChanged', handleWebSocketEvent)
      atelierChannel.listen('.intervention.updated', handleWebSocketEvent)

      garageChannel.listen('TicketStatusUpdated', handleWebSocketEvent)
      garageChannel.listen('.TicketStatusUpdated', handleWebSocketEvent)
      garageChannel.listen('TicketCreated', handleWebSocketEvent)
      garageChannel.listen('.TicketCreated', handleWebSocketEvent)

      // Nettoyage impératif de l'écouteur au démontage
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
    }
  }, [dateFiltre])

  // 4. Transformation dynamique du payload API en groupes par technicien
  const equipeMap = {}

  interventionsList.forEach((item) => {
    const techId = item.technicien?.id || 0
    const techNom = item.technicien?.nom_complet || item.technicien?.nom || item.technicien?.name || 'Technicien Non Assigné'

    if (!equipeMap[techId]) {
      equipeMap[techId] = {
        id: techId,
        nom: techNom,
        vehiculesTraites: 0,
        statutGlobal: 'Actif',
        interventions: [],
      }
    }

    // Strict lecture du booléen est_variable renvoyé par l'API Backend
    const isVariable = Boolean(
      item.est_variable === true ||
      (item.catalogue && item.catalogue.est_variable === true) ||
      (item.vehicule?.prestations && item.vehicule.prestations.some((p) => p.est_variable === true))
    )

    const baremeMinutesOfficiel = item.temps_bareme_officiel ?? item.catalogue?.temps_bareme ?? (item.temps_bareme_total ?? item.bareme ?? 60)
    const baremeMin = isVariable ? 0 : baremeMinutesOfficiel
    // 🛑 ACTIONS STRICTES : Fallback robuste imposé
    // const tempsPasse = intervention.temps_passe_accumule || intervention.temps_passe_minutes || intervention.temps_passe || 0;
    let tempsPasseMinutes = Number(
      item.temps_passe_accumule ||
      item.temps_passe_minutes ||
      item.temps_passe ||
      0
    )

    // Fallback dynamique pour les anciens enregistrements terminés sans temps persisté (> 0)
    if (tempsPasseMinutes === 0 && item.date_debut && item.date_fin) {
      const dStart = new Date(item.date_debut).getTime()
      const dEnd = new Date(item.date_fin).getTime()
      if (!isNaN(dStart) && !isNaN(dEnd) && dEnd > dStart) {
        tempsPasseMinutes = Math.max(1, Math.round((dEnd - dStart) / 60000))
      }
    }

    const chronoStartTime = item.chrono_start_time || item.heure_reprise

    // Si et seulement si l'intervention est en cours et a un chrono de départ, ajouter le temps écoulé en direct
    if (item.statut === 'En cours' && chronoStartTime) {
      const repriseMs = new Date(chronoStartTime).getTime()
      if (!isNaN(repriseMs)) {
        tempsPasseMinutes = tempsPasseMinutes + Math.max(0, Math.floor((nowTick - repriseMs) / 60000))
      }
    }

    // Conversion en heures décimales pour la fonction formaterTemps et les calculs de rendement
    const tempsBaremeH = baremeMin / 60
    const tempsPasseH  = tempsPasseMinutes / 60

    equipeMap[techId].interventions.push({
      id: item.id,
      vehicule: item.vehicule ? `${item.vehicule.nom_complet || item.vehicule.marque} (${item.vehicule.matricule})` : 'Véhicule N/A',
      clientNom: item.client?.nom || 'Client Particulier',
      clientTel: item.client?.telephone || 'Non renseigné',
      type: item.type_intervention,
      statut: item.statut,
      motifBlocage: item.motif_blocage,
      tempsBareme: tempsBaremeH,
      tempsBaremeOfficiel: item.temps_bareme_officiel ?? item.catalogue?.temps_bareme,
      catalogue: item.catalogue,
      tempsPasse: tempsPasseH,
      tempsPasseMinutes: tempsPasseMinutes,
      temps_passe: tempsPasseMinutes,
      temps_passe_accumule: item.temps_passe_accumule || tempsPasseMinutes,
      temps_passe_minutes: item.temps_passe_minutes || tempsPasseMinutes,
      startedAt: item.started_at || item.date_debut || null,
      chronoStartTime: chronoStartTime,
      chrono_start_time: chronoStartTime,
      heureDebut: item.heure_debut,
      dateFin: item.date_fin,
      heureFin: item.heure_fin,
      createdAt: item.created_at,
      heureArrivee: item.heure_arrivee || item.heure_affectation,
      baremeMin: baremeMin,
      tempsPasseMin: tempsPasseMinutes,
      estVariable: isVariable,
      pontNom: item.pont?.nom || 'Non affecté',
    })

    equipeMap[techId].vehiculesTraites = equipeMap[techId].interventions.length
  })

  // Déduction dynamique du statut global de chaque technicien
  const equipeJour = Object.values(equipeMap).map((tech) => {
    const hasBloque = tech.interventions.some((i) => i.statut === 'Bloqué')
    const hasEnCours = tech.interventions.some((i) => i.statut === 'En cours' || i.statut === 'En attente')

    let statutGlobal = 'Terminé'
    if (hasBloque) statutGlobal = 'Bloqué'
    else if (hasEnCours) statutGlobal = 'Actif'

    // Calcul du rendement global du technicien
    const totalBareme = tech.interventions.reduce((sum, i) => sum + (i.tempsBareme || 0), 0)
    const totalPasse  = tech.interventions.reduce((sum, i) => sum + (i.tempsPasse || 0), 0)
    const rendement   = totalBareme > 0 ? Math.min(Math.round((totalPasse / totalBareme) * 100), 100) : 0
    const isDepassement = totalPasse > totalBareme && totalBareme > 0

    return {
      ...tech,
      statutGlobal,
      totalBareme,
      totalPasse,
      rendement,
      isDepassement,
    }
  })

  const technicienActif = equipeJour.find((t) => t.id === technicienActifId) || null

  // Formatage des temps décimaux en heures/minutes (UX)
  const formaterTemps = (heuresDecimales) => {
    if (!heuresDecimales || heuresDecimales <= 0) return '0m'
    const h = Math.floor(heuresDecimales)
    const m = Math.round((heuresDecimales - h) * 60)

    if (h > 0 && m > 0) return `${h}h${m.toString().padStart(2, '0')}`
    if (h > 0 && m === 0) return `${h}h`
    return `${m}m`
  }

  // Formatage des heures d'affectation / début (ex: 14h30)
  const formaterHeure = (dateVal) => {
    if (!dateVal) return '--:--'
    if (typeof dateVal === 'string' && /^([01]?\d|2[0-3])[:h][0-5]\d$/.test(dateVal.trim())) {
      return dateVal.trim().replace(':', 'h')
    }
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return '--:--'
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}h${m}`
  }

  // Calculs KPI globaux
  const totalVehicules = equipeJour.reduce((acc, t) => acc + t.vehiculesTraites, 0)
  const techniciensActifsCount = equipeJour.filter((t) => t.statutGlobal === 'Actif').length
  const techniciensBloquesCount = equipeJour.filter((t) => t.statutGlobal === 'Bloqué').length

  if (loading && equipeJour.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 animate-pulse">Chargement de la supervision quotidienne...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      {/* ── EN-TÊTE PRINCIPAL ── */}
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

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION LISTE COMPACTE DES TECHNICIENS
      ══════════════════════════════════════════════════════════════════════ */}
      {equipeJour.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
          Aucun technicien ou intervention enregistré pour cette date ({dateFiltre}).
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden">
          {/* En-tête du tableau */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Performance Équipe
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Rendement temps réel par technicien</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              {equipeJour.length} technicien{equipeJour.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Ligne d'en-têtes de colonnes */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-3">Technicien</div>
            <div className="col-span-1 text-center">Statut</div>
            <div className="col-span-1 text-center">Tâches</div>
            <div className="col-span-5">Rendement Journée</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* Lignes de techniciens */}
          <ul className="divide-y divide-slate-100">
            {equipeJour.map((technicien) => {
              // Badge Statut
              let badgeCls = ''
              let badgeDotCls = ''
              if (technicien.statutGlobal === 'Actif') {
                badgeCls = 'bg-emerald-50 text-emerald-700 border-emerald-200'
                badgeDotCls = 'bg-emerald-500'
              } else if (technicien.statutGlobal === 'Terminé') {
                badgeCls = 'bg-slate-50 text-slate-600 border-slate-200'
                badgeDotCls = 'bg-slate-400'
              } else if (technicien.statutGlobal === 'Bloqué') {
                badgeCls = 'bg-rose-50 text-rose-700 border-rose-200'
                badgeDotCls = 'bg-rose-500'
              }

              // Barre de progression
              let barColor = 'bg-emerald-500'
              let barTrack = 'bg-emerald-100'
              if (technicien.isDepassement) {
                barColor = 'bg-rose-500'
                barTrack = 'bg-rose-100'
              } else if (technicien.statutGlobal === 'Actif') {
                barColor = 'bg-blue-500'
                barTrack = 'bg-blue-100'
              }

              // Calcul du pourcentage réel plafonné à 100% pour la barre visuelle
              const pourcentageBrut = technicien.totalBareme > 0 
                ? Math.round((technicien.totalPasse / technicien.totalBareme) * 100) 
                : 0
              const largeurBarre = Math.min(pourcentageBrut, 100)

              return (
                <li
                  key={technicien.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center px-6 py-4 hover:bg-slate-50/60 transition-colors group"
                >
                  {/* COL 1 — Avatar + Nom */}
                  <div className="md:col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-yellow-400 font-bold flex items-center justify-center text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {technicien.nom.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                        {technicien.nom}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">Technicien Atelier</p>
                    </div>
                  </div>

                  {/* COL 2 — Badge Statut */}
                  <div className="md:col-span-1 flex md:justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${badgeCls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badgeDotCls} ${technicien.statutGlobal === 'Actif' ? 'animate-pulse' : ''}`} />
                      {technicien.statutGlobal}
                    </span>
                  </div>

                  {/* COL 3 — Compteur Tâches */}
                  <div className="md:col-span-1 flex md:justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black text-slate-800 leading-none">{technicien.vehiculesTraites}</span>
                      <span className="text-[10px] font-medium text-slate-400 leading-none">véh.</span>
                    </div>
                  </div>

                  {/* COL 4 — Barre de Progression Rendement */}
                  <div className="md:col-span-5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500">
                        {formaterTemps(technicien.totalPasse)}
                        <span className="text-slate-300 mx-1">/</span>
                        {formaterTemps(technicien.totalBareme)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {technicien.isDepassement ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs">
                            <span>Retard :</span>
                            <span className="font-black">+ {formaterTemps(technicien.totalPasse - technicien.totalBareme)}</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold tabular-nums text-slate-600">
                            {largeurBarre}%
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Container de la barre visuelle plafonnée à 100% */}
                    <div className={`w-full h-2 rounded-full overflow-hidden ${barTrack}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                        style={{ width: `${largeurBarre}%` }}
                      />
                    </div>
                  </div>

                  {/* COL 5 — Bouton Détails */}
                  <div className="md:col-span-2 flex md:justify-end">
                    <button
                      onClick={() => setTechnicienActifId(technicien.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-800 hover:text-yellow-400 hover:border-slate-800 active:scale-95 transition-all duration-200 cursor-pointer group/btn"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 016 0z" />
                      </svg>
                      Détails
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-0 -ml-1 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Pied du tableau */}
          <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
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

      {/* ── PANNEAU LATÉRAL (SLIDE-OVER / DRAWER / MODALE DÉTAILS) ── */}
      {technicienActif && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay arrière-plan sombre avec effet flouté */}
          <div
            onClick={() => setTechnicienActifId(null)}
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
                onClick={() => setTechnicienActifId(null)}
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
                      const isVariable = Boolean(
                        intervention.estVariable === true ||
                        intervention.est_variable === true ||
                        (intervention.catalogue && intervention.catalogue.est_variable === true)
                      )

                      // 🛑 ACTIONS STRICTES : Fallback robuste imposé
                      // const tempsPasse = intervention.temps_passe_accumule || intervention.temps_passe_minutes || intervention.temps_passe || 0;
                      const tempsPasseBrut = Number(
                        intervention.temps_passe_accumule ||
                        intervention.temps_passe_minutes ||
                        intervention.temps_passe ||
                        intervention.tempsPasseMin ||
                        (intervention.tempsPasse ? Math.round(intervention.tempsPasse * 60) : 0) ||
                        0
                      )
                      const tempsPasseHeures = tempsPasseBrut > 0 ? (tempsPasseBrut / 60) : (intervention.tempsPasse || 0)

                      const isDepasse = !isVariable && tempsPasseHeures > intervention.tempsBareme
                      const pourcent = isVariable ? 0 : Math.min(
                        Math.round((tempsPasseHeures / (intervention.tempsBareme || 1)) * 100),
                        100
                      )

                      // Configuration du Badge de Statut d'Intervention
                      let statusBadge = null
                      if (intervention.statut === 'En cours') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                            En cours
                          </span>
                        )
                      } else if (intervention.statut === 'Terminé') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Terminé
                          </span>
                        )
                      } else if (intervention.statut === 'En attente') {
                        statusBadge = (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            En attente
                          </span>
                        )
                      } else if (intervention.statut === 'Bloqué') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Bloqué
                          </span>
                        )
                      }

                      let barColorClass = 'bg-emerald-500'
                      if (isDepasse) {
                        barColorClass = 'bg-rose-500'
                      } else if (intervention.statut === 'En cours') {
                        barColorClass = 'bg-blue-500'
                      }

                      // 🛑 ÉTAPE 2 : DEBUGGING IMPOSÉ DANS LA CONSOLE REACT
                      console.log(`DEBUG INTERVENTION ${intervention.id} (${intervention.type}) :`, { 
                        donnee_brute: intervention, 
                        valeur_est_variable: intervention.est_variable ?? intervention.estVariable,
                        catalogue: intervention.catalogue 
                      });

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
                                Client : <span className="text-slate-700 font-semibold">{intervention.clientNom} ({intervention.clientTel})</span>
                              </p>
                              <p className="text-xs font-medium text-slate-500 mt-0.5">
                                Type : <span className="text-slate-700 font-semibold">{intervention.type}</span>
                              </p>
                              <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
                                <span>🕒 Affecté : <strong className="text-slate-700 font-semibold">{formaterHeure(intervention.heureArrivee || intervention.createdAt)}</strong></span>
                                <span className="text-slate-300">|</span>
                                <span>▶️ Début : <strong className="text-slate-700 font-semibold">{formaterHeure(intervention.heureDebut || intervention.startedAt)}</strong></span>
                                <span className="text-slate-300">|</span>
                                <span>⏹️ Fin : <strong className="text-slate-700 font-semibold">{formaterHeure(intervention.heureFin || intervention.dateFin)}</strong></span>
                              </p>
                            </div>
                            <div>{statusBadge}</div>
                          </div>

                          {/* BANNIÈRE D'ALERTE ROUGE CONDITIONNELLE MOTIF DE BLOCAGE */}
                          {intervention.statut === 'Bloqué' && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3.5 rounded-r-xl shadow-xs font-semibold my-2 flex items-start gap-2.5">
                              <span className="text-base leading-none shrink-0 mt-0.5">⚠️</span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wider text-red-800">
                                  MOTIF DE BLOCAGE : {intervention.motifBlocage || intervention.motif_blocage || 'Problème technique / En attente de pièces'}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* La Barre de Progression / Rendu Blindé */}
                          {isVariable ? (
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pt-1">
                              <span>
                                Temps passé : <strong className="text-slate-900 font-mono font-bold">{formaterTemps(tempsPasseHeures)}</strong> / Barème : <span className="text-blue-600 font-extrabold">Temps réel (Indéfini)</span>
                              </span>
                              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                Durée variable
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700">
                                  Temps passé : {formaterTemps(tempsPasseHeures)} / Barème : {formaterTemps(intervention.tempsBaremeOfficiel ? (intervention.tempsBaremeOfficiel / 60) : intervention.tempsBareme)}
                                </span>
                                {isDepasse ? (
                                  <span className="font-bold text-rose-600 flex items-center gap-1">
                                    <span>+ {formaterTemps(tempsPasseHeures - intervention.tempsBareme)}</span>
                                    <span className="text-[10px] uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-black">
                                      Retard
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
                                    width: `${Math.min(pourcent, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Pied du Panneau Latéral */}
            <div className="bg-white border-t border-slate-200 p-4 text-center text-xs text-slate-400">
              Tour de Contrôle Chef d'Atelier • Temps réel API
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
