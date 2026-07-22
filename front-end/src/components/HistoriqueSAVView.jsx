import { useState } from 'react'

// ─── Mock Data ────────────────────────────────────────────────────────
const VEHICLE = {
  marque: 'Renault Express 2021',
  immat: '1234-A-50',
}

const HISTORIQUE = [
  {
    id: 1042,
    description: 'Vidange et Filtres',
    date: '15/05/2026',
    technicien: 'Yassir Zimi',
  },
  {
    id: 981,
    description: "Remplacement lève-vitre (système standard)",
    date: '10/01/2026',
    technicien: 'Meraouni Mustapha',
  },
  {
    id: 855,
    description: 'Diagnostic complet',
    date: '22/08/2025',
    technicien: 'Yassir Zimi',
  },
]

export default function HistoriqueSAVView() {
  const [search, setSearch] = useState('')
  const [hasSearched, setHasSearched] = useState(true) // for prototype we show results immediately

  function handleSearch(e) {
    e.preventDefault()
    setHasSearched(true)
    // In a real app you would fetch data based on `search`
  }

  function handleSAV() {
    alert('Génération du ticket SAV prioritaire lié à cette intervention')
  }

  return (
    <div className="flex flex-col gap-8 min-h-full">
      {/* ── Search Bar ── */}
      <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65a7 7 0 1110-10 7 7 0 01-10 10z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Saisir la plaque d'immatriculation..."
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2 rounded-xl bg-yellow-400 text-slate-900 font-semibold hover:bg-yellow-300 transition"
        >
          Rechercher
        </button>
      </form>

      {/* ── Result Card ── */}
      {hasSearched && (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
          {/* Vehicle Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-4">
            <div className="flex flex-col">
              <p className="text-xl font-bold text-slate-800">{VEHICLE.marque}</p>
              <p className="text-sm text-slate-500">Immatriculation : {VEHICLE.immat}</p>
            </div>
          </div>

          {/* Historique List */}
          <div className="flex flex-col gap-4">
            {HISTORIQUE.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between"
              >
                <div className="flex flex-col">
                  <p className="font-semibold text-slate-800">Ticket #{ticket.id}</p>
                  <p className="text-sm text-slate-600">{ticket.description}</p>
                  <p className="text-xs text-slate-400 mt-1">Clôturé le {ticket.date} • Technicien : {ticket.technicien}</p>
                </div>
                <button
                  onClick={handleSAV}
                  className="mt-3 md:mt-0 px-4 py-2 rounded-lg bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 transition"
                >
                  Déclarer Retour SAV
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
