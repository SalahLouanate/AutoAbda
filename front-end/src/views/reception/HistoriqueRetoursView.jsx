import { useState, useMemo } from "react";

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────
const MOCK_VEHICLES = [
  {
    id: "v1",
    immatriculation: "1234-A-50",
    marque: "Renault",
    modele: "Express",
    annee: 2021,
    tickets: [
      {
        id: "T-001",
        type: "Remplacement lève-vitre (système standard)",
        date: "2026-01-10",
        technicien: "Meraouni Mustapha",
        statut: "Clôturé",
      },
      {
        id: "T-002",
        type: "Vidange complète",
        date: "2026-05-15",
        technicien: "Yassir Zimi",
        statut: "Clôturé",
      },
    ],
  },
  {
    id: "v2",
    immatriculation: "IJ-789-KL",
    marque: "Dacia",
    modele: "Sandero",
    annee: null,
    tickets: [
      {
        id: "T-003",
        type: "Diagnostic moteur",
        date: "2026-06-20",
        technicien: "Yassir Zimi",
        statut: "Clôturé",
      },
    ],
  },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const MOIS_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatDate(isoDate) {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function getAllYears(vehicles) {
  const years = new Set();
  vehicles.forEach((v) =>
    v.tickets.forEach((t) => {
      if (t.date) years.add(t.date.split("-")[0]);
    })
  );
  return [...years].sort((a, b) => b - a);
}

// ─────────────────────────────────────────────
// ICONS (inline SVG)
// ─────────────────────────────────────────────
function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function CarIcon({ className = "h-8 w-8" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M3 11l2-5h14l2 5M3 11h18v6H3v-6zm3 6v1a1 1 0 002 0v-1m8 0v1a1 1 0 002 0v-1" />
    </svg>
  );
}

function WrenchIcon({ className = "h-4 w-4" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09.542-.56 1.007-1.05.77A7 7 0 1018.5 12.5c0-.282-.02-.56-.057-.832-.04-.3.228-.598.527-.558a4.5 4.5 0 01-6.627-4.17z" />
    </svg>
  );
}

function UserIcon({ className = "h-4 w-4" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function CalendarIcon({ className = "h-4 w-4" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function TicketIcon({ className = "h-4 w-4" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronRightIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 5.197z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// VEHICLE CARD (Master)
// ─────────────────────────────────────────────
function VehicleCard({ vehicle, onClick }) {
  const nbTickets = vehicle.tickets.length;
  return (
    <button
      onClick={() => onClick(vehicle)}
      className="group w-full text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 text-blue-500 group-hover:bg-blue-100 transition-colors duration-200">
          <CarIcon className="h-8 w-8" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-0.5">
            {vehicle.immatriculation}
          </p>
          <h3 className="text-base font-bold text-slate-800 truncate">
            {vehicle.marque} {vehicle.modele}{" "}
            {vehicle.annee && <span className="font-normal text-slate-500">{vehicle.annee}</span>}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            {nbTickets} intervention{nbTickets > 1 ? "s" : ""} enregistrée{nbTickets > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex-shrink-0 self-center text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200">
          <ChevronRightIcon />
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// TICKET ROW (Detail)
// ─────────────────────────────────────────────
function TicketRow({ ticket, onClick }) {
  return (
    <button
      onClick={() => onClick(ticket)}
      className="group w-full text-left bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors duration-200">
          <TicketIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{ticket.type}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <CalendarIcon /> {formatDate(ticket.date)}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <UserIcon /> {ticket.technicien}
            </span>
          </div>
        </div>
        <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 hidden sm:inline-flex">
          {ticket.statut}
        </span>
        <span className="flex-shrink-0 text-xs text-slate-300 font-mono hidden md:block">
          #{ticket.id}
        </span>
        <div className="flex-shrink-0 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200">
          <ChevronRightIcon className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// INFO BLOCK (used inside modal)
// ─────────────────────────────────────────────
function InfoBlock({ icon, label, value, fullWidth = false }) {
  return (
    <div className={`flex flex-col gap-1 p-3 bg-slate-50 rounded-lg border border-slate-100 ${fullWidth ? "col-span-2" : ""}`}>
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-700 leading-snug">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// MODALE Détail Ticket + SAV
// ─────────────────────────────────────────────
function TicketModal({ ticket, vehicle, onClose, onDeclarer }) {
  if (!ticket || !vehicle) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in"
        style={{ animation: "modalIn 0.2s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest">
              Détail de l'intervention
            </p>
            <h2 className="text-lg font-bold text-white mt-0.5">Ticket #{ticket.id}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer la modale"
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-700/50 transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Véhicule */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400"><CarIcon className="h-6 w-6" /></div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Véhicule</p>
              <p className="text-sm font-semibold text-slate-700">
                {vehicle.marque} {vehicle.modele} {vehicle.annee || ""}
                {" — "}
                <span className="text-blue-600">{vehicle.immatriculation}</span>
              </p>
            </div>
          </div>

          {/* Grille infos */}
          <div className="grid grid-cols-2 gap-3">
            <InfoBlock
              icon={<TicketIcon className="h-4 w-4" />}
              label="N° Ticket"
              value={`#${ticket.id}`}
            />
            <InfoBlock
              icon={<CalendarIcon className="h-4 w-4" />}
              label="Date de clôture"
              value={formatDate(ticket.date)}
            />
            <InfoBlock
              icon={<WrenchIcon className="h-4 w-4" />}
              label="Type d'intervention"
              value={ticket.type}
              fullWidth
            />
            <InfoBlock
              icon={<UserIcon className="h-4 w-4" />}
              label="Technicien"
              value={ticket.technicien}
            />
            <InfoBlock
              icon={<span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mt-0.5" />}
              label="Statut"
              value={ticket.statut}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onDeclarer}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 active:scale-95 text-white font-bold py-3 px-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
          >
            <AlertIcon />
            Déclarer un Retour SAV
          </button>
          <button
            onClick={onClose}
            className="flex-shrink-0 py-3 px-5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 active:scale-95 transition-all duration-200"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Keyframe pour l'animation d'ouverture */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────
export default function HistoriqueRetoursView() {
  const [searchQuery, setSearchQuery]     = useState("");
  const [filters, setFilters]             = useState({ jour: "", mois: "", annee: "" });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedTicket, setSelectedTicket]   = useState(null);

  const allYears = useMemo(() => getAllYears(MOCK_VEHICLES), []);

  // Filtrage Master : par plaque
  const filteredVehicles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return MOCK_VEHICLES;
    return MOCK_VEHICLES.filter((v) =>
      v.immatriculation.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filtrage Detail : tickets du véhicule sélectionné + filtres date
  const filteredTickets = useMemo(() => {
    if (!selectedVehicle) return [];
    return selectedVehicle.tickets.filter((t) => {
      if (!t.date) return true;
      const [year, month, day] = t.date.split("-");
      if (filters.annee && year !== filters.annee) return false;
      if (filters.mois  && month !== filters.mois.padStart(2, "0")) return false;
      if (filters.jour  && day   !== filters.jour.padStart(2, "0")) return false;
      return true;
    });
  }, [selectedVehicle, filters]);

  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedTicket(null);
    setFilters({ jour: "", mois: "", annee: "" });
  };

  const handleBack = () => {
    setSelectedVehicle(null);
    setSelectedTicket(null);
  };

  const handleDeclarer = () => {
    alert(`✅ Retour SAV déclaré pour le ticket #${selectedTicket.id}`);
    setSelectedTicket(null);
  };

  const totalTickets = MOCK_VEHICLES.reduce((acc, v) => acc + v.tickets.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Historique des Retours
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Consultez et gérez les interventions passées par véhicule.
            </p>
          </div>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
            {totalTickets} ticket{totalTickets > 1 ? "s" : ""} au total
          </span>
        </div>

        {/* ── TOP BAR : Recherche + Filtres ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Barre de recherche */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Retour à la liste si on tape une nouvelle recherche
                if (selectedVehicle) {
                  setSelectedVehicle(null);
                  setSelectedTicket(null);
                }
              }}
              placeholder="Saisir la plaque d'immatriculation..."
              className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-slate-400 shadow-sm hover:shadow transition-shadow"
            />
          </div>

          {/* Filtres date */}
          <div className="flex gap-2">
            <select
              value={filters.jour}
              onChange={(e) => setFilters((f) => ({ ...f, jour: e.target.value }))}
              className="text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="">Jour</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={String(d)}>{String(d).padStart(2, "0")}</option>
              ))}
            </select>

            <select
              value={filters.mois}
              onChange={(e) => setFilters((f) => ({ ...f, mois: e.target.value }))}
              className="text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="">Mois</option>
              {MOIS_LABELS.map((m, i) => (
                <option key={m} value={String(i + 1)}>{m}</option>
              ))}
            </select>

            <select
              value={filters.annee}
              onChange={(e) => setFilters((f) => ({ ...f, annee: e.target.value }))}
              className="text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="">Année</option>
              {allYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ══════════════════════════════════════
            MASTER VIEW — Liste des véhicules
        ══════════════════════════════════════ */}
        {!selectedVehicle && (
          <section className="space-y-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest px-1">
              {filteredVehicles.length} véhicule{filteredVehicles.length !== 1 ? "s" : ""} trouvé{filteredVehicles.length !== 1 ? "s" : ""}
            </p>

            {filteredVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                  <CarIcon className="h-8 w-8" />
                </div>
                <p className="text-slate-500 font-medium">Aucun véhicule trouvé</p>
                <p className="text-sm text-slate-400 mt-1">Essayez une autre plaque d'immatriculation.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredVehicles.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} onClick={handleVehicleClick} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════
            DETAIL VIEW — Interventions véhicule
        ══════════════════════════════════════ */}
        {selectedVehicle && (
          <section className="space-y-4">
            {/* Bouton retour */}
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors duration-200"
            >
              <ArrowLeftIcon />
              Retour à la liste
            </button>

            {/* En-tête véhicule sélectionné */}
            <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 text-blue-500">
                <CarIcon className="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
                  {selectedVehicle.immatriculation}
                </p>
                <h2 className="text-lg font-bold text-slate-800">
                  {selectedVehicle.marque} {selectedVehicle.modele}{" "}
                  {selectedVehicle.annee && (
                    <span className="font-normal text-slate-500">{selectedVehicle.annee}</span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedVehicle.tickets.length} intervention{selectedVehicle.tickets.length > 1 ? "s" : ""} au total
                </p>
              </div>
            </div>

            {/* Liste des tickets */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest px-1">
                Interventions ({filteredTickets.length})
              </p>

              {filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
                    <TicketIcon className="h-6 w-6" />
                  </div>
                  <p className="text-slate-500 font-medium">Aucune intervention pour ces filtres</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Modifiez les filtres date pour voir d'autres résultats.
                  </p>
                </div>
              ) : (
                filteredTickets.map((t) => (
                  <TicketRow key={t.id} ticket={t} onClick={setSelectedTicket} />
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* MODALE */}
      <TicketModal
        ticket={selectedTicket}
        vehicle={selectedVehicle}
        onClose={() => setSelectedTicket(null)}
        onDeclarer={handleDeclarer}
      />
    </div>
  );
}
