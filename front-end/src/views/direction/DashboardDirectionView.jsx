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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-700">Taux d'occupation</h2>
          <p className="text-xs text-slate-400 mt-0.5">État des {total} ponts en ce moment</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
          {pct}% utilisé
        </span>
      </div>
      <div className="flex items-center gap-6">
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
        <div className="flex flex-col gap-3 flex-1">
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
    'Barème': item.bareme || 60,
    'Passé': item.temps_passe || 0,
  })), [chargeTravail])

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-700">Charge de travail</h2>
        <p className="text-xs text-slate-400 mt-0.5">Temps barémé vs. temps passé (min) — interventions en cours</p>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data.length > 0 ? data : [{ nom: 'Aucun', Barème: 0, Passé: 0 }]} barCategoryGap="35%" barGap={3}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="nom" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} tickFormatter={v => `${v}'`} />
          <Tooltip content={<BarTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="Barème" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Passé"  fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-3 rounded bg-blue-200 inline-block"/>Barème (réf 60')</span>
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
  const isRetard = statutUpper === 'EN_RETARD'

  const technicien = pont.technicien_assigne || 'Technicien non assigné'
  const intervention = pont.intervention
  const vehiculeLabel = intervention?.vehicule || 'Véhicule N/A'
  const interventionType = intervention?.type_intervention || 'Intervention'

  const tempsPasse = intervention?.temps_passe ?? 0
  const tempsBareme = intervention?.bareme ?? 60
  const pct = tempsBareme > 0 ? Math.min(100, Math.round((tempsPasse / tempsBareme) * 100)) : 0

  if (isMaintenance) {
    return (
      <div
        className="rounded-2xl border-2 border-slate-300 bg-slate-100 p-5 shadow-sm overflow-hidden relative"
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

  if (isLibre) {
    return (
      <div className="rounded-2xl border-2 border-emerald-300 bg-white p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">{pont.nom || `Pont ${pont.id}`}</p>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase tracking-wider">Libre</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 py-5">
          <IcoCheck cls="h-10 w-10 text-emerald-400" />
          <p className="text-sm font-semibold text-emerald-600">Prêt à l'emploi</p>
          <p className="text-xs text-slate-400 text-center">
            {technicien ? `Assigné à : ${technicien}` : 'Aucune intervention active'}
          </p>
        </div>
      </div>
    )
  }

  const borderCls   = isRetard ? 'border-red-500'   : 'border-blue-400'
  const badgeCls    = isRetard ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'
  const trackCls    = isRetard ? 'bg-red-100'        : 'bg-blue-100'
  const barCls      = isRetard ? 'bg-red-500'        : 'bg-blue-500'
  const avatarCls   = isRetard ? 'bg-red-500'        : 'bg-blue-500'
  const pulseCls    = isRetard ? 'pont-retard'       : ''

  return (
    <div className={`rounded-2xl border-2 ${borderCls} bg-white p-5 shadow-sm flex flex-col gap-3 ${pulseCls}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-700">{pont.nom || `Pont ${pont.id}`}</p>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeCls}`}>
          {isRetard ? 'En retard' : (intervention?.statut_intervention === 'Bloqué' ? 'Bloqué' : 'En cours')}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full ${avatarCls} flex items-center justify-center flex-shrink-0 text-white font-black text-xs`}>
          {technicien.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{technicien}</p>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <IcoCar cls="h-3.5 w-3.5" />
            <span className="font-mono truncate">{vehiculeLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <IcoWrench cls="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate">{interventionType}</span>
      </div>

      <div>
        <div className={`w-full h-2 rounded-full ${trackCls}`}>
          <div className={`h-2 rounded-full ${barCls} transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1">
            <IcoClock cls="h-3.5 w-3.5 text-slate-400" />
            <span className={`text-xs font-bold ${isRetard ? 'text-red-600' : 'text-slate-600'}`}>
              {tempsPasse} min passées
            </span>
          </div>
          <span className="text-xs text-slate-400">/ {tempsBareme} min réf</span>
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

  // 1. Chargement des données via useCallback
  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const response = await api.get('/direction/dashboard')
      setDashboardData(response.data)
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

  // 2. Écouteur WebSocket intelligent : Mise à jour ciblée de l'état local sans re-fetch HTTP lourd
  useEffect(() => {
    const echoInstance = echo || window.Echo

    if (echoInstance) {
      const channel = echoInstance.channel('atelier')

      const handleWebSocketEvent = (payload) => {
        console.log('⚡ Événement Reverb (Payload) :', payload)

        if (!payload || !payload.pont) {
          // Fallback silencieux en cas de payload incomplet
          fetchDashboardData(true)
          return
        }

        setDashboardData(prev => {
          if (!prev) return prev

          const isFinished = payload.statut === 'Terminé' || payload.statut === 'Annulé'

          const updatedPonts = prev.ponts.map(p => {
            if (p.id === payload.pont.id) {
              return {
                ...p,
                statut: isFinished ? 'LIBRE' : (payload.statut === 'Bloqué' ? 'EN_COURS' : 'EN_COURS'),
                technicien_assigne: payload.technicien?.name || p.technicien_assigne,
                intervention: isFinished ? null : {
                  id: payload.id,
                  vehicule: payload.vehicule ? `${payload.vehicule.marque} ${payload.vehicule.modele}` : 'Véhicule N/A',
                  matricule: payload.vehicule?.matricule,
                  type_intervention: payload.type_intervention,
                  temps_passe: payload.date_debut ? Math.max(0, Math.round((new Date() - new Date(payload.date_debut)) / 60000)) : 0,
                  bareme: 60,
                  statut_intervention: payload.statut,
                  motif_blocage: payload.motif_blocage,
                }
              }
            }
            return p
          })

          const occupes = updatedPonts.filter(p => p.statut === 'EN_COURS' || p.statut === 'EN_RETARD').length
          const libres = updatedPonts.filter(p => p.statut === 'LIBRE').length
          const total = updatedPonts.length || 5

          return {
            ...prev,
            ponts: updatedPonts,
            kpis: {
              ...prev.kpis,
              ponts_occupes: occupes,
              ponts_libres: libres,
              pourcentage_occupation: total > 0 ? Math.round((occupes / total) * 100) : 0,
              terminees_aujourdhui: isFinished ? (prev.kpis.terminees_aujourdhui + 1) : prev.kpis.terminees_aujourdhui,
            }
          }
        })
      }

      channel.listen('InterventionStatusChanged', handleWebSocketEvent)
      channel.listen('.InterventionStatusChanged', handleWebSocketEvent)
      channel.listen('.App\\Events\\InterventionStatusChanged', handleWebSocketEvent)

      return () => {
        channel.stopListening('InterventionStatusChanged')
        channel.stopListening('.InterventionStatusChanged')
        channel.stopListening('.App\\Events\\InterventionStatusChanged')
        echoInstance.leaveChannel('atelier')
      }
    }
  }, [fetchDashboardData])

  // 3. Valeurs dérivées mémorisées avec useMemo
  const kpis = useMemo(() => dashboardData?.kpis || {
    ponts_occupes: 0,
    pourcentage_occupation: 0,
    ponts_libres: 0,
    interventions_du_jour: 0,
    terminees_aujourdhui: 0,
  }, [dashboardData?.kpis])

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

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
            <IcoAlert cls="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Erreur de chargement</h3>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <style>{`
        @keyframes borderPulse {
          0%,100% { border-color: #ef4444; box-shadow: 0 0 0 0 rgba(239,68,68,.2); }
          50%      { border-color: #fca5a5; box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        .pont-retard { animation: borderPulse 2s ease-in-out infinite; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              Tour de Contrôle — Atelier
            </h1>
            <p className="text-sm text-slate-400 mt-0.5 capitalize">{today}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <IcoClock cls="h-4 w-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700 font-mono">{now}</span>
            <span className="text-xs text-slate-400">• en direct</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Ponts occupés',
              value: `${kpis.ponts_occupes} / ${pontsList.length || 5}`,
              sub: `${kpis.pourcentage_occupation}% d'occupation`,
              color: 'blue',
              icon: <IcoCar cls="h-5 w-5" />,
            },
            {
              label: 'Ponts libres',
              value: kpis.ponts_libres,
              sub: 'disponibles maintenant',
              color: 'emerald',
              icon: <IcoCheck cls="h-5 w-5" />,
            },
            {
              label: 'Interventions du jour',
              value: kpis.interventions_du_jour,
              sub: 'créées aujourd\'hui',
              color: 'indigo',
              icon: <IcoWrench cls="h-5 w-5" />,
            },
            {
              label: 'Terminées aujourd\'hui',
              value: kpis.terminees_aujourdhui,
              sub: 'interventions clôturées',
              color: 'emerald',
              icon: <IcoCheck cls="h-5 w-5" />,
            },
          ].map(k => (
            <div key={k.label} className={`bg-${k.color}-50 border border-${k.color}-200 rounded-2xl p-5 shadow-sm flex items-center gap-4`}>
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-${k.color}-100 text-${k.color}-500 flex items-center justify-center`}>
                {k.icon}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{k.label}</p>
                <p className={`text-2xl font-black leading-none text-${k.color}-600`}>{k.value}</p>
                <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OccupationDonut kpis={kpis} />
          <ChargeBarChart chargeTravail={chargeTravail} />
        </div>

        {/* Grille Ponts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-700">Supervision des {pontsList.length || 5} Ponts</h2>
            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"/>En cours</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"/>Libre</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"/>En retard</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"/>Maintenance</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {pontsList.map(pont => (
              <PontCard key={pont.id} pont={pont} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
