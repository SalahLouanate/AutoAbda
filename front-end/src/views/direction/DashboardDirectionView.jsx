import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import api from '../../api/axios'
import echo from '../../echo'

// ─────────────────────────────────────────────────────────────────────────────
// ICÔNES SVG inline
// ─────────────────────────────────────────────────────────────────────────────
const IcoCar = memo(({ cls = 'h-4 w-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M3 11l2-5h14l2 5M3 11h18v6H3v-6zm3 6v1a1 1 0 002 0v-1m8 0v1a1 1 0 002 0v-1"/>
  </svg>
))

const IcoClock = memo(({ cls = 'h-4 w-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
  </svg>
))

const IcoAlert = memo(({ cls = 'h-4 w-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
  </svg>
))

const IcoCheck = memo(({ cls = 'h-8 w-8' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
  </svg>
))

const IcoGear = memo(({ cls = 'h-10 w-10' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
  </svg>
))

const IcoWrench = memo(({ cls = 'h-3.5 w-3.5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.653-4.655m5.867-5.914 1.768 1.768a2.25 2.25 0 0 1 0 3.182l-1.768-1.768a2.25 2.25 0 0 1 0-3.182Z"/>
  </svg>
))

// ─────────────────────────────────────────────────────────────────────────────
// DONUT CHART — Memoized Component
// ─────────────────────────────────────────────────────────────────────────────
const DONUT_COLORS = ['#3b82f6', '#22c55e', '#94a3b8']

const DonutTooltip = memo(function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-slate-700">
      {payload[0].name} : <span className="font-black">{payload[0].value}</span> pont{payload[0].value > 1 ? 's' : ''}
    </div>
  )
})

const OccupationDonut = memo(function OccupationDonut({ kpis }) {
  const occupes = kpis?.ponts_occupes ?? 0
  const libres  = kpis?.ponts_libres ?? 0
  const pct     = kpis?.pourcentage_occupation ?? 0
  const total   = occupes + libres || 5
  
  const data = useMemo(() => [
    { name: 'Occupés', value: occupes },
    { name: 'Libres',  value: libres },
  ], [occupes, libres])

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-700">Taux d'occupation</h2>
          <p className="text-xs text-slate-400 mt-0.5">État des {total} ponts en ce moment</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
          {pct}% utilisé
        </span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={48} outerRadius={70}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-3 flex-1 w-full sm:w-auto">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: DONUT_COLORS[i] }} />
              <span className="text-xs text-slate-500 flex-1">{d.name}</span>
              <span className="text-xs font-black text-slate-800">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// BAR CHART — Memoized Component
// ─────────────────────────────────────────────────────────────────────────────
const BarTooltip = memo(function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-slate-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-xs" style={{ color: p.fill }}>
          {p.name} : <span className="font-black">{p.value} min</span>
        </p>
      ))}
    </div>
  )
})

const ChargeBarChart = memo(function ChargeBarChart({ chargeTravail }) {
  const data = useMemo(() => (chargeTravail || []).map(item => ({
    nom: item.technicien ? item.technicien.split(' ')[0] : 'Tech',
    'Temps Barémé': item.temps_bareme ?? item.bareme ?? item.duree_estimee ?? 0,
    'Temps Passé': item.temps_passe ?? 0,
  })), [chargeTravail])

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm overflow-x-auto">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-700">Charge de travail</h2>
        <p className="text-xs text-slate-400 mt-0.5">Temps barémé vs. temps passé (min) — interventions en cours</p>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data.length > 0 ? data : [{ nom: 'Aucun', 'Temps Barémé': 0, 'Temps Passé': 0 }]} barCategoryGap="35%" barGap={3}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="nom" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} tickFormatter={v => `${v}'`} />
          <Tooltip content={<BarTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="Temps Barémé" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Temps Passé"  fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-3 rounded bg-blue-200 inline-block"/>Temps Barémé</span>
        <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-3 rounded bg-blue-500 inline-block"/>Temps passé</span>
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// CARTE PONT DYNAMIQUE (Memoized Component)
// ─────────────────────────────────────────────────────────────────────────────
const PontCard = memo(function PontCard({ pont }) {
  const statutUpper = pont.statut ? pont.statut.toUpperCase() : 'LIBRE'
  const isMaintenance = statutUpper === 'MAINTENANCE'
  const isLibre = statutUpper === 'LIBRE'

  const technicien = pont.technicien_assigne || 'Technicien non assigné'
  const intervention = pont.intervention
  const vehiculeLabel = intervention?.vehicule || 'Véhicule N/A'
  const interventionType = intervention?.type_intervention || 'Intervention'

  const tempsBareme = intervention?.bareme ?? intervention?.temps_bareme_total ?? 60

  // ── Calcul dynamique du temps passé depuis started_at ─────────────────────
  const calcTemps = () => {
    const startedAt = intervention?.started_at || intervention?.date_debut || null
    if (!startedAt) return intervention?.temps_passe ?? 0
    const debut = new Date(startedAt)
    if (isNaN(debut.getTime())) return intervention?.temps_passe ?? 0
    return Math.max(0, Math.round((Date.now() - debut.getTime()) / 60000))
  }

  const [tempsPasse, setTempsPasse] = useState(calcTemps)

  useEffect(() => {
    const startedAt = intervention?.started_at || intervention?.date_debut || null
    if (!startedAt || isLibre || isMaintenance) return

    // Rafraîchissement toutes les 30 secondes (précis sans surcharger)
    const timer = setInterval(() => {
      setTempsPasse(calcTemps())
    }, 30000)

    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervention?.started_at, intervention?.date_debut, isLibre, isMaintenance])

  const isRetard = !isLibre && !isMaintenance && tempsBareme > 0 && tempsPasse > tempsBareme
  const pct = tempsBareme > 0 ? Math.min(100, Math.round((tempsPasse / tempsBareme) * 100)) : 0

  if (isMaintenance) {
    return (
      <div
        className="rounded-2xl border-2 border-slate-300 bg-slate-100 p-4 sm:p-5 shadow-sm overflow-hidden relative"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(148,163,184,.15) 8px,rgba(148,163,184,.15) 16px)' }}
      >
        <div className="absolute top-3 right-3">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 uppercase tracking-wider">Hors service</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-4 text-slate-400">
          <IcoGear cls="h-10 w-10 text-slate-400" />
          <div className="text-center">
            <p className="text-sm font-bold text-slate-600">{pont.nom || `Pont ${pont.id}`}</p>
            <p className="text-xs text-slate-400 mt-0.5">En maintenance</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <IcoAlert cls="h-4 w-4 text-amber-500" />
          <span className="text-xs font-semibold text-amber-600">Inutilisable aujourd'hui</span>
        </div>
      </div>
    )
  }

  if (isLibre || !intervention) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700">{pont.nom || `Pont ${pont.id}`}</span>
          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
            Libre
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-emerald-400">
          <IcoCheck cls="h-10 w-10 text-emerald-500 mb-1" />
          <p className="text-xs font-bold text-emerald-700">Disponible pour affectation</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5 font-medium">{technicien}</p>
        </div>
        <div className="text-center pt-2 border-t border-emerald-200/60 text-emerald-700 text-xs font-semibold">
          Prêt à recevoir un véhicule
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border-2 p-4 sm:p-5 shadow-sm flex flex-col justify-between bg-white ${
      isRetard ? 'border-red-400 bg-red-50/30' : 'border-blue-300'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-800">{pont.nom || `Pont ${pont.id}`}</span>
        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
          isRetard ? 'bg-red-100 text-red-700 border-red-300 animate-pulse' : 'bg-blue-100 text-blue-700 border-blue-300'
        }`}>
          {isRetard ? 'En retard' : 'En cours'}
        </span>
      </div>

      <div className="my-3 space-y-2">
        <div className="flex items-center gap-2">
          <IcoCar cls="h-4 w-4 text-slate-500 shrink-0" />
          <span className="text-sm font-black text-slate-800 truncate">{vehiculeLabel}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <IcoWrench cls="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span className="truncate">{interventionType}</span>
        </div>

        <div className="text-xs text-slate-500">
          Tech : <strong className="text-slate-800 font-bold">{technicien}</strong>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Temps passé : {tempsPasse} min</span>
          <span className="text-slate-400">Réf : {tempsBareme} min</span>
        </div>

        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isRetard ? 'bg-red-500' : 'bg-blue-600'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {isRetard && (
          <div className="flex items-center gap-1 mt-1.5 bg-red-50 rounded-lg px-2 py-1">
            <IcoAlert cls="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
            <span className="text-xs font-bold text-red-600">
              +{tempsPasse - tempsBareme} min de dépassement
            </span>
          </div>
        )}
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL — DashboardDirectionView (Optimsed with Memoization & Smart Echo)
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardDirectionView() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialisation des KPIs dynamiques du jour avec état initial propre
  const [kpis, setKpis] = useState({
    total_aujourdhui: 0,
    cloturees_aujourdhui: 0,
    ponts_occupes: 0,
    ponts_libres: 5,
    pourcentage_occupation: 0,
  })

  // 1. Chargement des données via useCallback & Axios GET /api/direction/dashboard
  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const response = await api.get('/direction/dashboard')
      if (response.data) {
        setDashboardData(response.data)
        const d = response.data
        const loadedKpis = response.data.kpis || response.data
        setKpis({
          total_aujourdhui:       loadedKpis.total_aujourdhui       ?? loadedKpis.interventions_du_jour ?? d.total_aujourdhui       ?? 0,
          cloturees_aujourdhui:    loadedKpis.cloturees_aujourdhui    ?? loadedKpis.terminees_aujourdhui  ?? d.cloturees_aujourdhui    ?? 0,
          ponts_occupes:          loadedKpis.ponts_occupes          ?? d.ponts_occupes                  ?? 0,
          ponts_libres:           loadedKpis.ponts_libres           ?? d.ponts_libres                   ?? 5,
          pourcentage_occupation: loadedKpis.pourcentage_occupation ?? d.pourcentage_occupation         ?? 0,
        })
      }
    } catch (err) {
      console.error('Erreur chargement dashboard:', err)
      if (!silent) {
        setError(err.response?.data?.message || 'Impossible de charger la Tour de Contrôle.')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData(false)
  }, [fetchDashboardData])

  // 2. Écouteur WebSocket Reverb dédié sur le canal public 'atelier'
  useEffect(() => {
    const echoInstance = echo || window.Echo

    if (echoInstance) {
      const channel = echoInstance.channel('atelier')

      const handleInterventionUpdated = (e) => {
        console.log('⚡ Événement Reverb (intervention.updated) capté sur Dashboard Direction :', e)
        fetchDashboardData(true)
      }

      channel.listen('.intervention.updated', handleInterventionUpdated)
      channel.listen('intervention.updated', handleInterventionUpdated)

      return () => {
        channel.stopListening('.intervention.updated')
        channel.stopListening('intervention.updated')
        echoInstance.leaveChannel('atelier')
      }
    }
  }, [fetchDashboardData])

  // 3. Valeurs dérivées mémorisées avec useMemo
  const pontsList = useMemo(() => dashboardData?.ponts || [], [dashboardData?.ponts])
  const chargeTravail = useMemo(() => dashboardData?.charge_travail || [], [dashboardData?.charge_travail])

  const now   = useMemo(() => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), [])
  const today = useMemo(() => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), [])

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-600 animate-pulse">
            Chargement de la Tour de Contrôle...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-3 sm:p-6 space-y-4 sm:space-y-6 font-sans">
      {/* EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tour de Contrôle Atelier • Temps Réel
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-1">
            Supervision Direction
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Vision globale de l'atelier, statut des ponts et rendement des techniciens
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-[11px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-slate-200">
            {today} — {now}
          </span>
        </div>
      </div>

      {/* ERREUR EVENTUELLE */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* KPI & GRAPHIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <OccupationDonut kpis={kpis} />
        <ChargeBarChart chargeTravail={chargeTravail} />

        {/* CARTE KPI SYNTHÈSE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-700">Synthèse Journée</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Volumétrie globale des interventions du jour</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 my-3 sm:my-4">
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase">Aujourd'hui</p>
              <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{kpis.total_aujourdhui}</p>
            </div>

            <div className="bg-emerald-50 p-3.5 sm:p-4 rounded-xl border border-emerald-100 text-center">
              <p className="text-xs font-semibold text-emerald-600 uppercase">Clôturées</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{kpis.cloturees_aujourdhui}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Ponts Libres : <strong className="text-slate-800">{kpis.ponts_libres}</strong></span>
            <span>Ponts Occupés : <strong className="text-blue-600">{kpis.ponts_occupes}</strong></span>
          </div>
        </div>
      </div>

      {/* GRILLE DES PONTS (SUPERVISION ATELIER) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            Supervision des Ponts en Direct
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold">
              {pontsList.length} Ponts
            </span>
          </h2>
          <span className="text-xs text-slate-400">Actualisation temps réel Reverb</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {pontsList.map((pont) => (
            <PontCard key={pont.id} pont={pont} />
          ))}
        </div>
      </div>
    </div>
  )
}
