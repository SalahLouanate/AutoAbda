import React, { useState } from 'react';
import TicketPrintTemplate from '../../components/TicketPrintTemplate';

// Mock interventions list – could be imported from a shared constant if needed
const INTERVENTIONS_LIST = ['Vidange', 'Plaquettes', 'Diagnostic', 'Révision', 'Pneumatiques', 'Climatisation'];

export default function NouveauTicketView() {
  // ----- Form state -----
  const [immat, setImmat] = useState('');
  const [marque, setMarque] = useState('');
  const [selectedInterventions, setSelectedInterventions] = useState([]);
  const [isRendezVous, setIsRendezVous] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastTicket, setLastTicket] = useState(null);

  // ----- Queue helpers (local to this view) -----
  const [tickets, setTickets] = useState([]);
  const [nextId, setNextId] = useState(1);

  // ----- Helpers -----
  function toggleIntervention(label) {
    setSelectedInterventions((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  }

  function validate() {
    const newErrors = {};
    if (!immat.trim()) newErrors.immat = "L'immatriculation est requise.";
    if (!marque.trim()) newErrors.marque = 'La marque est requise.';
    if (selectedInterventions.length === 0) newErrors.interventions = 'Sélectionnez au moins une intervention.';
    return newErrors;
  }

  // ----- Submit -----
  function handleSubmit(e) {
    // Prevent native form reload
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const now = new Date();
    const heure = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTicket = {
      id: nextId,
      immat: immat.toUpperCase().trim(),
      marque: marque.trim(),
      interventions: [...selectedInterventions],
      rdv: isRendezVous,
      heure,
      technicien: 'Yassir Zimi', // mock technician
    };

    setTickets((prev) => [newTicket, ...prev]);
    setNextId((n) => n + 1);
    setLastTicket(newTicket);

    // Reset form fields
    setImmat('');
    setMarque('');
    setSelectedInterventions([]);
    setIsRendezVous(false);
    setErrors({});
  }

  // ----- Print -----
  function handlePrint(e) {
    if (e && e.preventDefault) e.preventDefault();
    setTimeout(() => {
      window.print();
    }, 300);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Immatriculation */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Immatriculation</label>
          <input
            type="text"
            value={immat}
            onChange={(e) => { setImmat(e.target.value); setErrors((err) => ({ ...err, immat: undefined })); }}
            placeholder="ex: 1234-A-50"
            className={`mt-1 block w-full rounded-md border ${errors.immat ? 'border-rose-400 bg-rose-50' : 'border-gray-300'} shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          />
          {errors.immat && <p className="mt-1 text-sm text-rose-600">{errors.immat}</p>}
        </div>

        {/* Marque / Modèle */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Marque / Modèle</label>
          <input
            type="text"
            value={marque}
            onChange={(e) => { setMarque(e.target.value); setErrors((err) => ({ ...err, marque: undefined })); }}
            placeholder="ex: Renault Express"
            className={`mt-1 block w-full rounded-md border ${errors.marque ? 'border-rose-400 bg-rose-50' : 'border-gray-300'} shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          />
          {errors.marque && <p className="mt-1 text-sm text-rose-600">{errors.marque}</p>}
        </div>

        {/* Interventions */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">Interventions prévues</legend>
          <div className="grid grid-cols-2 gap-2">
            {INTERVENTIONS_LIST.map((label) => {
              const checked = selectedInterventions.includes(label);
              return (
                <label key={label} className={`flex items-center p-2 border rounded cursor-pointer ${checked ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-200'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleIntervention(label)}
                    className="hidden"
                  />
                  <span className="ml-2 text-sm">{label}</span>
                </label>
              );
            })}
          </div>
          {errors.interventions && <p className="mt-1 text-sm text-rose-600">{errors.interventions}</p>}
        </fieldset>

        {/* RDV toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800">Client sur Rendez‑vous</p>
            <p className="text-xs text-gray-500">{isRendezVous ? 'Passage sur rendez‑vous' : 'Passage sans rendez‑vous'}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsRendezVous((prev) => !prev)}
            className={`w-11 h-6 flex items-center p-0.5 rounded-full transition-colors ${isRendezVous ? 'bg-yellow-400' : 'bg-gray-300'}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${isRendezVous ? 'translate-x-5' : 'translate-x-0'}`}></span>
          </button>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold py-2 rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm13-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" clipRule="evenodd" />
          </svg>
          Créer le Ticket
        </button>

        {/* Print button – appears only after a ticket has been created */}
        {lastTicket && (
          <button
            type="button"
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M6 9V2h12v7h4v9h-3v3H5v-3H2V9h4zm2 0h8V4H8v5zm9 5h5v5h-5v-5zM5 14h5v5H5v-5z" />
            </svg>
            Imprimer le Ticket
          </button>
        )}
      </form>

      {/* Hidden printable ticket – rendered only when a ticket exists */}
      {lastTicket && <TicketPrintTemplate data={lastTicket} />}
    </div>
  );
}
