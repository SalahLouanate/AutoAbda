import { useState, useMemo } from 'react'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — 5 Techniciens (configuration réelle du garage)
// ─────────────────────────────────────────────────────────────────────────────
const DONNEES_JOUR = [
  { id: 1, nom: 'Yassir Zimi',       heuresAchetees: 8, heuresFacturees: 9.5, retoursSAV: 0, penaliteSAV: 0   },
  { id: 2, nom: 'Meraouni Mustapha', heuresAchetees: 8, heuresFacturees: 6.0, retoursSAV: 1, penaliteSAV: 2   },
  { id: 3, nom: 'Karim Amrani',      heuresAchetees: 8, heuresFacturees: 8.5, retoursSAV: 0, penaliteSAV: 0   },
  { id: 4, nom: 'Hamza Bennani',     heuresAchetees: 8, heuresFacturees: 7.0, retoursSAV: 1, penaliteSAV: 1.5 },
  { id: 5, nom: 'Sofiane Touati',    heuresAchetees: 8, heuresFacturees: 9.0, retoursSAV: 0, penaliteSAV: 0   },
]

const DONNEES_MOIS = [
  { id: 1, nom: 'Yassir Zimi',       heuresAchetees: 160, heuresFacturees: 185, retoursSAV: 1, penaliteSAV: 2 },
  { id: 2, nom: 'Meraouni Mustapha', heuresAchetees: 160, heuresFacturees: 130, retoursSAV: 3, penaliteSAV: 6 },
  { id: 3, nom: 'Karim Amrani',      heuresAchetees: 160, heuresFacturees: 168, retoursSAV: 1, penaliteSAV: 2 },
  { id: 4, nom: 'Hamza Bennani',     heuresAchetees: 160, heuresFacturees: 152, retoursSAV: 2, penaliteSAV: 3 },
  { id: 5, nom: 'Sofiane Touati',    heuresAchetees: 160, heuresFacturees: 178, retoursSAV: 0, penaliteSAV: 0 },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function enrichir(tech, taux) {
  const heuresSup = Number((tech.heuresFacturees - tech.heuresAchetees).toFixed(2))
  const bilanNet  = Number((tech.heuresFacturees - tech.heuresAchetees - tech.penaliteSAV).toFixed(2))
  const prime     = bilanNet > 0 ? Math.round(bilanNet * taux) : 0
  return {
    ...tech,
    heuresSup,
    bilanNet,
    prime,
    rentable: bilanNet >= 0,
  }
}

function fmtH(v) {
  if (v === 0) return '0h00'
  const sign = v < 0 ? '-' : '+'
  const abs  = Math.abs(v)
  const h    = Math.floor(abs)
  const m    = Math.round((abs - h) * 60)
  return `${sign}${h}h${String(m).padStart(2, '0')}`
}

function fmtMAD(v) {
  return `${Number(v).toLocaleString('fr-FR')} MAD`
}

// ─────────────────────────────────────────────────────────────────────────────
// ICÔNES
// ─────────────────────────────────────────────────────────────────────────────
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

  const [vueActuelle,      setVueActuelle]      = useState('Jour')
  const [dateSelectionnee, setDateSelectionnee] = useState(todayISO)
  const [tauxCommission,   setTauxCommission]   = useState(50)

  // ── Données enrichies dynamiques ──────────────────────────────────────────
  const donneesActuelles = useMemo(() => {
    const rawData = vueActuelle === 'Jour' ? DONNEES_JOUR : DONNEES_MOIS
    const validTaux = Number.isNaN(Number(tauxCommission)) ? 0 : Math.max(0, Number(tauxCommission))
    return rawData.map((t) => enrichir(t, validTaux))
  }, [vueActuelle, tauxCommission])

  // ── Agrégats totaux ──────────────────────────────────────────────────────
  const totalAchetees   = useMemo(() => donneesActuelles.reduce((s, t) => s + t.heuresAchetees, 0), [donneesActuelles])
  const totalFacturees  = useMemo(() => donneesActuelles.reduce((s, t) => s + t.heuresFacturees, 0), [donneesActuelles])
  const totalPrime      = useMemo(() => donneesActuelles.reduce((s, t) => s + t.prime, 0), [donneesActuelles])
  const tauxEfficacite  = useMemo(() => (totalAchetees > 0 ? Math.round((totalFacturees / totalAchetees) * 100) : 0), [totalAchetees, totalFacturees])
  const totalBilanNet   = useMemo(() => donneesActuelles.reduce((s, t) => s + t.bilanNet, 0), [donneesActuelles])
  const totalMalusSAV   = useMemo(() => donneesActuelles.reduce((s, t) => s + t.penaliteSAV, 0), [donneesActuelles])

  // ── Formattage Recharts BarChart ──────────────────────────────────────────
  const chartData = useMemo(() => {
    return donneesActuelles.map((t) => ({
      nom:         t.nom.split(' ')[0],
      'Achetées':  t.heuresAchetees,
      'Facturées': t.heuresFacturees,
    }))
  }, [donneesActuelles])

  const handleToggle = (vue) => {
    setVueActuelle(vue)
    setDateSelectionnee(vue === 'Jour' ? todayISO : monthISO)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── EN-TÊTE & FILTRES ──────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Performances & Rentabilité
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Analyse de rentabilité — Vue {vueActuelle} ({dateSelectionnee})
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Toggle Jour / Mois */}
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

            {/* Input Date / Mois */}
            {vueActuelle === 'Jour' ? (
              <input
                type="date"
                value={dateSelectionnee}
                onChange={(e) => setDateSelectionnee(e.target.value)}
                max={todayISO}
                className="text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition cursor-pointer"
              />
            ) : (
              <input
                type="month"
                value={dateSelectionnee}
                onChange={(e) => setDateSelectionnee(e.target.value)}
                max={monthISO}
                className="text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition cursor-pointer"
              />
            )}

            {/* Input Taux Commission */}
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

        {/* ── KPI CARDS GLOBAL ───────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

          {/* 1. Total H. Achetées */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
              <IcoClock />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Total H. Achetées</p>
              <p className="text-2xl font-black text-blue-700 leading-none">{totalAchetees}h</p>
              <p className="text-xs text-slate-400 mt-1">({donneesActuelles.length} techniciens)</p>
            </div>
          </div>

          {/* 2. Total H. Facturées */}
          <div className={`border rounded-2xl p-5 shadow-sm flex items-center gap-4 ${
            totalFacturees >= totalAchetees ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              totalFacturees >= totalAchetees ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'
            }`}>
              <IcoTrend />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Total H. Facturées</p>
              <p className={`text-2xl font-black leading-none ${totalFacturees >= totalAchetees ? 'text-emerald-700' : 'text-red-700'}`}>
                {totalFacturees}h
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {totalBilanNet >= 0 ? `+${totalBilanNet}h net` : `${totalBilanNet}h net`}
              </p>
            </div>
          </div>

          {/* 3. Taux d'Efficacité */}
          <div className={`border rounded-2xl p-5 shadow-sm flex items-center gap-4 ${
            tauxEfficacite >= 100 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              tauxEfficacite >= 100 ? 'bg-emerald-100 text-emerald-500' : 'bg-amber-100 text-amber-500'
            }`}>
              <IcoCheck />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Efficacité Globale</p>
              <p className={`text-2xl font-black leading-none ${tauxEfficacite >= 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {tauxEfficacite}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Objectif : 100%</p>
            </div>
          </div>

          {/* 4. Total Primes Estimées */}
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

        {/* ── BARCHART RECHARTS ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-700">Heures Achetées vs Facturées par Technicien</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Vue {vueActuelle} — {donneesActuelles.length} techniciens
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-200 inline-block" />Achetées</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" />Facturées</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barCategoryGap="35%" barGap={6}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="nom" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}h`} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              <Bar dataKey="Achetées" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Facturées" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── TABLEAU DÉTAILLÉ DE PRODUCTIVITÉ (GRID 12 COLONNES UNIFORME) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Header section */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-700">Tableau de Productivité Détaillé</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bilan Net = (Facturées − Achetées) − Malus SAV | Prime = max(0, Bilan Net × Taux)
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              {donneesActuelles.length} Techniciens
            </span>
          </div>

          {/* Table Header (Grid 12 colonnes) */}
          <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-2">Technicien</div>
            <div className="col-span-2 text-center">H. Achetées</div>
            <div className="col-span-2 text-center">H. Facturées</div>
            <div className="col-span-2 text-center">H. Sup.</div>
            <div className="col-span-1 text-center">Malus SAV</div>
            <div className="col-span-1 text-center">Bilan Net</div>
            <div className="col-span-2 text-right text-violet-600 font-bold">Prime (MAD)</div>
          </div>

          {/* Table Body */}
          <ul className="divide-y divide-slate-100">
            {donneesActuelles.map((tech) => (
              <li key={tech.id} className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-slate-50/80 transition-colors">
                
                {/* 1. Technicien */}
                <div className="col-span-2 flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    tech.rentable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {tech.nom.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{tech.nom}</p>
                    {tech.retoursSAV > 0 && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-0.5">
                        <IcoAlert cls="h-3 w-3" />{tech.retoursSAV} SAV
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. H. Achetées */}
                <div className="col-span-2 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                    {tech.heuresAchetees}h
                  </span>
                </div>

                {/* 3. H. Facturées */}
                <div className="col-span-2 text-center">
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    tech.heuresFacturees >= tech.heuresAchetees
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {tech.heuresFacturees}h
                  </span>
                </div>

                {/* 4. H. Sup */}
                <div className="col-span-2 text-center">
                  <span className={`text-xs font-bold ${
                    tech.heuresSup > 0 ? 'text-emerald-600' : tech.heuresSup < 0 ? 'text-red-600' : 'text-slate-400'
                  }`}>
                    {fmtH(tech.heuresSup)}
                  </span>
                </div>

                {/* 5. Malus SAV */}
                <div className="col-span-1 text-center">
                  {tech.penaliteSAV > 0 ? (
                    <span className="text-xs font-bold text-red-600 flex items-center justify-center gap-0.5">
                      <IcoAlert cls="h-3.5 w-3.5" />-{tech.penaliteSAV}h
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </div>

                {/* 6. Bilan Net */}
                <div className="col-span-1 text-center">
                  <span className={`text-xs font-bold ${tech.bilanNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmtH(tech.bilanNet)}
                  </span>
                </div>

                {/* 7. Prime Estimée (MAD) */}
                <div className="col-span-2 text-right">
                  {tech.prime > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 text-xs font-bold">
                      <IcoStar cls="h-3.5 w-3.5 text-violet-500" />
                      {fmtMAD(tech.prime)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300 font-medium">0 MAD</span>
                  )}
                </div>

              </li>
            ))}
          </ul>

          {/* Table Totals Row */}
          <div className="grid grid-cols-12 items-center px-6 py-4 bg-slate-50 border-t-2 border-slate-200">
            <div className="col-span-2">
              <p className="text-xs font-black text-slate-600 uppercase tracking-wider">TOTAL ATELIER</p>
            </div>
            <div className="col-span-2 text-center font-black text-sm text-blue-700">
              {totalAchetees}h
            </div>
            <div className={`col-span-2 text-center font-black text-sm ${totalFacturees >= totalAchetees ? 'text-emerald-700' : 'text-red-700'}`}>
              {totalFacturees}h
            </div>
            <div className="col-span-2 text-center font-black text-xs text-slate-700">
              {fmtH(totalFacturees - totalAchetees)}
            </div>
            <div className="col-span-1 text-center font-black text-xs text-red-600">
              {totalMalusSAV > 0 ? `-${totalMalusSAV}h` : '—'}
            </div>
            <div className={`col-span-1 text-center font-black text-xs ${totalBilanNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {fmtH(totalBilanNet)}
            </div>
            <div className="col-span-2 text-right font-black text-sm text-violet-700">
              {fmtMAD(totalPrime)}
            </div>
          </div>

          {/* Footer bar */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>
              Efficacité Globale : <strong className={tauxEfficacite >= 100 ? 'text-emerald-600' : 'text-amber-600'}>{tauxEfficacite}%</strong>
            </span>
            <span className="text-violet-600 font-semibold">
              Total Primes Estimées : {fmtMAD(totalPrime)}
            </span>
          </div>

        </div>

      </div>
    </div>
  )
}
