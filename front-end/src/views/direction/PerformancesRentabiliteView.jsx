import { useState, useMemo, useEffect } from 'react'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import api from '../../api/axios'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
// Formate un nombre d'heures en '+Xh Ym' ou '-Xh Ym'
function fmtH(v) {
  if (v === 0) return '0h 00m'
  const sign = v < 0 ? '-' : '+'
  const abs  = Math.abs(v)
  const h    = Math.floor(abs)
  const m    = Math.round((abs - h) * 60)
  return `${sign}${h}h ${String(m).padStart(2, '0')}m`
}

function fmtMAD(v) {
  return `${Number(v).toLocaleString('fr-FR')} MAD`
}

// ─────────────────────────────────────────────────────────────────────────────
function IcoCar({ cls = 'h-5 w-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M3 11l2-5h14l2 5M3 11h18v6H3v-6zm3 6v1a1 1 0 002 0v-1m8 0v1a1 1 0 002 0v-1" />
    </svg>
  )
}

function IcoClock({ cls = 'h-5 w-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function IcoTrend({ cls = 'h-5 w-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
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

function IcoCheck({ cls = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function IcoStar({ cls = 'h-5 w-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOLTIP BAR CHART
// ─────────────────────────────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.fill }} />
          <span className="text-slate-500">{p.name} :</span>
          <span className="font-black text-slate-800">{p.value}h</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function PerformancesRentabiliteView() {
  const todayISO = new Date().toISOString().slice(0, 10)
  const monthISO = new Date().toISOString().slice(0, 7)

  const [periode,          setPeriode]          = useState('aujourdhui')
  const [vueActuelle,      setVueActuelle]      = useState('Jour')
  const [dateSelectionnee, setDateSelectionnee] = useState(todayISO)
  const [tauxCommission,   setTauxCommission]   = useState(20)
  const [bilanData,        setBilanData]        = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState(null)

  const handleToggle = (nouvelleVue) => {
    setVueActuelle(nouvelleVue)
    if (nouvelleVue === 'Jour') {
      setPeriode('aujourdhui')
      setDateSelectionnee(todayISO)
    } else {
      setPeriode('mois')
      setDateSelectionnee(monthISO)
    }
  }

  const fetchBilanData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get('/direction/bilan', {
        params: {
          periode: periode,
          mode: periode === 'aujourdhui' ? 'today' : 'month',
          date: dateSelectionnee,
          rate: tauxCommission,
        },
      })
      setBilanData(response.data)
    } catch (err) {
      console.error('Erreur lors du chargement du bilan:', err)
      setError(err.response?.data?.message || 'Impossible de charger le bilan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBilanData()
  }, [periode, dateSelectionnee, tauxCommission])

  const donneesActuelles = useMemo(() => {
    if (!bilanData?.performances_techniciens) return []

    return bilanData.performances_techniciens.map((tech) => {
      const tempsVenduBareme = tech.temps_bareme_heures   || 0
      const tempsPasseReel   = tech.temps_passe_heures    || 0
      // ✅ Nouvelle règle : base prime = temps réel passé SI barème > 8h, sinon 0
      const basePrimeHeures  = tech.base_prime_heures     ?? 0
      const seuilDepasse     = tech.seuil_depasse         ?? (tech.temps_bareme_minutes > 480)
      const heuresSup        = tech.heures_gagnees        || 0
      const penaliteSAV      = tech.heures_perdues        || 0
      const bilanNet         = Number((heuresSup - penaliteSAV).toFixed(2))
      const nbrVehiculesTraites = tech.nbr_vehicules_traites ?? tech.interventions_cloturees ?? 0
      const prime            = tech.prime_montant         || 0
      const nombreRetours    = tech.nombre_retours        || 0

      return {
        id: tech.id,
        nom: tech.nom,
        nbrVehiculesTraites,
        heuresAchetees: tempsVenduBareme,
        heuresFacturees: tempsPasseReel,
        basePrimeHeures,
        seuilDepasse,
        heuresSup,
        nombreRetours,
        retoursSAV: nombreRetours,
        penaliteSAV,
        bilanNet,
        prime,
        primeFormatted: tech.prime_formatted,
        rentable: bilanNet >= 0,
      }
    })
  }, [bilanData])

  const totalVehicules  = useMemo(() => Number(bilanData?.kpis_globaux?.total_vehicules_traites ?? bilanData?.kpis_globaux?.total_interventions ?? donneesActuelles.reduce((s, t) => s + (t.nbrVehiculesTraites || 0), 0)), [bilanData, donneesActuelles])
  const totalAchetees   = useMemo(() => Number((bilanData?.kpis_globaux?.temps_bareme_total ?? donneesActuelles.reduce((s, t) => s + t.heuresAchetees, 0)).toFixed(2)), [bilanData, donneesActuelles])
  const totalFacturees  = useMemo(() => Number((bilanData?.kpis_globaux?.temps_passe_total ?? donneesActuelles.reduce((s, t) => s + t.heuresFacturees, 0)).toFixed(2)), [bilanData, donneesActuelles])
  const totalPrime      = useMemo(() => bilanData?.kpis_globaux?.total_primes_distribuees ?? donneesActuelles.reduce((s, t) => s + t.prime, 0), [bilanData, donneesActuelles])
  const tauxEfficacite  = useMemo(() => Math.round(bilanData?.kpis_globaux?.taux_efficacite_global ?? 0), [bilanData])
  const totalBilanNet   = useMemo(() => Number(donneesActuelles.reduce((s, t) => s + t.bilanNet, 0).toFixed(2)), [donneesActuelles])
  const totalMalusSAV   = useMemo(() => Number(donneesActuelles.reduce((s, t) => s + t.penaliteSAV, 0).toFixed(2)), [donneesActuelles])
  const totalRetoursSAV = useMemo(() => Number(donneesActuelles.reduce((s, t) => s + t.nombreRetours, 0)), [donneesActuelles])

  const chartData = useMemo(() => {
    return donneesActuelles.map((t) => ({
      nom:                    t.nom.split(' ')[0],
      'Temps Vendu (Barème)': t.heuresAchetees,
      'Temps Passé (Réel)':  t.heuresFacturees,
    }))
  }, [donneesActuelles])

  if (loading && !bilanData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 animate-pulse">Chargement des statistiques en direct...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Performances &amp; Rentabilité
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Analyse de rentabilité pure — Vue {vueActuelle} ({bilanData?.periode?.label || dateSelectionnee})
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => handleToggle('Jour')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  vueActuelle === 'Jour'
                    ? 'bg-yellow-400 text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Aujourd'hui
              </button>
              <button
                type="button"
                onClick={() => handleToggle('Mois')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  vueActuelle === 'Mois'
                    ? 'bg-yellow-400 text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Bilan Mensuel
              </button>
            </div>

            {vueActuelle === 'Jour' ? (
              <input
                type="date"
                value={dateSelectionnee}
                onChange={(e) => setDateSelectionnee(e.target.value)}
                className="text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition cursor-pointer"
              />
            ) : (
              <input
                type="month"
                value={dateSelectionnee}
                onChange={(e) => setDateSelectionnee(e.target.value)}
                className="text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition cursor-pointer"
              />
            )}

            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Taux Commission :
              </label>
              <input
                type="number"
                value={tauxCommission}
                onChange={(e) => setTauxCommission(e.target.value === '' ? '' : Number(e.target.value))}
                min={0}
                step={5}
                className="w-16 text-sm font-bold text-violet-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-500 text-right"
              />
              <span className="text-xs font-semibold text-slate-500">MAD/h</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <IcoCar />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Véhicules Traités</p>
              <p className="text-2xl font-black text-amber-800 leading-none">{totalVehicules}</p>
              <p className="text-xs text-slate-400 mt-1">Clôturés ({vueActuelle})</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
              <IcoClock />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Temps Vendu (Barème)</p>
              <p className="text-2xl font-black text-blue-700 leading-none">{totalAchetees}h</p>
              <p className="text-xs text-slate-400 mt-1">({donneesActuelles.length} techniciens)</p>
            </div>
          </div>

          <div className={`border rounded-2xl p-5 shadow-sm flex items-center gap-4 ${
            totalFacturees <= totalAchetees ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              totalFacturees <= totalAchetees ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'
            }`}>
              <IcoTrend />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Temps Passé (Réel)</p>
              <p className={`text-2xl font-black leading-none ${totalFacturees <= totalAchetees ? 'text-emerald-700' : 'text-red-700'}`}>
                {totalFacturees}h
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {totalBilanNet >= 0 ? `+${totalBilanNet}h net` : `${totalBilanNet}h net`}
              </p>
            </div>
          </div>

          <div className={`border rounded-2xl p-5 shadow-sm flex items-center gap-4 ${
            tauxEfficacite === 0
              ? 'bg-slate-50 border-slate-200'
              : tauxEfficacite >= 100
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              tauxEfficacite === 0
                ? 'bg-slate-100 text-slate-400'
                : tauxEfficacite >= 100
                ? 'bg-emerald-100 text-emerald-500'
                : 'bg-amber-100 text-amber-500'
            }`}>
              <IcoCheck />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Efficacité Globale</p>
              <p className={`text-2xl font-black leading-none ${
                tauxEfficacite === 0
                  ? 'text-slate-600'
                  : tauxEfficacite >= 100
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}>
                {tauxEfficacite}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Objectif : 100%</p>
            </div>
          </div>

          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <IcoStar />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Primes Estimées</p>
              <p className="text-2xl font-black text-violet-700 leading-none">{fmtMAD(totalPrime)}</p>
              <p className="text-xs text-slate-400 mt-1">Base : {tauxCommission} MAD/h</p>
            </div>
          </div>

        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-x-auto">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-700">Temps Vendu (Barème) vs. Temps Passé (Réel) par Technicien</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Vue {vueActuelle} — {donneesActuelles.length} techniciens
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-200 inline-block" />Temps Vendu (Barème)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" />Temps Passé (Réel)</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barCategoryGap="35%" barGap={6}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="nom" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}h`} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              <Bar dataKey="Temps Vendu (Barème)" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Temps Passé (Réel)" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              Détail des Performances Individuelles
            </h2>
            <span className="text-xs text-slate-400">
              {donneesActuelles.length} technicien{donneesActuelles.length > 1 ? 's' : ''} actif{donneesActuelles.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 pl-6 pr-3 font-bold">Technicien</th>
                  <th scope="col" className="py-3.5 px-3 text-center text-slate-700 font-extrabold whitespace-nowrap">
                    Véhicules traités
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-center text-blue-700 font-extrabold whitespace-nowrap">
                    Temps Vendu (Barème)
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-center text-slate-700 font-extrabold whitespace-nowrap">
                    Temps Passé (Réel)
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-center font-bold text-red-700 whitespace-nowrap">Retours SAV</th>
                  <th scope="col" className="py-3.5 pl-3 pr-6 text-right text-violet-700 font-black whitespace-nowrap">Prime (MAD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {donneesActuelles.map((tech) => (
                  <tr key={tech.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Technicien */}
                    <td className="py-3.5 pl-6 pr-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          tech.rentable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {tech.nom.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{tech.nom}</p>
                          {tech.nombreRetours > 0 && (
                            <p className="text-xs text-red-600 font-bold flex items-center gap-0.5 mt-0.5">
                              <IcoAlert cls="h-3 w-3 text-red-600" />{tech.nombreRetours} Retour{tech.nombreRetours > 1 ? 's' : ''} SAV
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Véhicules traités */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200/80 shadow-2xs">
                        <IcoCar cls="h-3.5 w-3.5 text-slate-500" />
                        <span>{tech.nbrVehiculesTraites} véh.</span>
                      </span>
                    </td>

                    {/* Temps Vendu (Barème) */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                        {tech.heuresAchetees}h
                      </span>
                    </td>

                    {/* Temps Passé (Réel) */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        tech.heuresFacturees <= tech.heuresAchetees
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {tech.heuresFacturees}h
                      </span>
                    </td>

                    {/* Retours SAV */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {tech.nombreRetours > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-700 border border-red-200 shadow-2xs">
                          <IcoAlert cls="h-3.5 w-3.5 text-red-600" />
                          <span>{tech.nombreRetours}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">0</span>
                      )}
                    </td>

                    {/* Prime (MAD) */}
                    <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                      {tech.prime > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 text-xs font-bold">
                          <IcoStar cls="h-3.5 w-3.5 text-violet-500" />
                          {tech.primeFormatted || fmtMAD(tech.prime)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 font-medium">0 MAD</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 text-xs font-bold">
                  <td className="py-4 pl-6 pr-3 font-black text-slate-600 uppercase tracking-wider">
                    TOTAL ATELIER
                  </td>
                  <td className="py-4 px-3 text-center font-black text-sm text-slate-800 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-900 border border-slate-300">
                      🚗 {totalVehicules} véh.
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center font-black text-sm text-blue-700 whitespace-nowrap">
                    {totalAchetees}h
                  </td>
                  <td className={`py-4 px-3 text-center font-black text-sm whitespace-nowrap ${totalFacturees <= totalAchetees ? 'text-emerald-700' : 'text-red-700'}`}>
                    {totalFacturees}h
                  </td>
                  <td className={`py-4 px-3 text-center font-black text-xs whitespace-nowrap ${totalRetoursSAV > 0 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                    {totalRetoursSAV > 0 ? `${totalRetoursSAV} SAV` : '0'}
                  </td>
                  <td className="py-4 pl-3 pr-6 text-right font-black text-sm text-violet-700 whitespace-nowrap">
                    {fmtMAD(totalPrime)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Encadré d'Information du Taux de Prime Explicite */}
          <div className="px-6 py-4 bg-violet-50/80 border-t border-violet-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-violet-950 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse shrink-0" />
              <span>
                💡 <strong>Règle de Prime :</strong> Prime débloquée uniquement si <strong>Temps Barémé &gt; 8h</strong>. Base = Temps Réel Passé.
              </span>
            </div>
            <div className="text-violet-800 font-bold bg-white px-3 py-1.5 rounded-xl border border-violet-200 shadow-2xs">
              Prime = Temps Réel Passé (si Barème &gt; 480 min) × {tauxCommission} MAD/h
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
