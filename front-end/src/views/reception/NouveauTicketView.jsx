import React, { useState } from 'react';
import api from '../../api/axios';
import TicketPrintTemplate from '../../components/TicketPrintTemplate';

// Interventions de base / catalogue par défaut
const INTERVENTIONS_LIST = ['Vidange', 'Plaquettes', 'Diagnostic', 'Révision', 'Pneumatiques', 'Climatisation'];

export default function NouveauTicketView() {
  // ----- Form state -----
  const [immat, setImmat] = useState('');
  const [marque, setMarque] = useState('');
  const [clientNom, setClientNom] = useState('');
  const [clientTel, setClientTel] = useState('');
  const [selectedInterventions, setSelectedInterventions] = useState([]);
  const [errors, setErrors] = useState({});
  const [lastTicket, setLastTicket] = useState(null);

  // État de recherche / auto-complétion du véhicule (arrière-plan invisible)
  const [searchingVehicule, setSearchingVehicule] = useState(false);
  const [vehiculeReconnu, setVehiculeReconnu] = useState(null);

  // File locale
  const [tickets, setTickets] = useState([]);
  const [nextId, setNextId] = useState(1);

  // Recherche automatique et INVISIBLE en arrière-plan sur perte de focus (onBlur)
  const handleImmatBlur = async () => {
    const cleanImmat = immat.trim().toUpperCase();
    if (!cleanImmat || cleanImmat.length < 2) return;

    setSearchingVehicule(true);
    try {
      const res = await api.get('/reception/vehicules/search', {
        params: { plaque: cleanImmat },
      });
      if (res.data?.found && res.data?.vehicule) {
        const v = res.data.vehicule;
        if (v.nom_complet || v.marque) {
          setMarque(v.nom_complet || `${v.marque} ${v.modele || ''}`.trim());
        }
        if (v.client_nom) setClientNom(v.client_nom);
        if (v.client_telephone) setClientTel(v.client_telephone);
        setVehiculeReconnu(v);
      } else {
        setVehiculeReconnu(null);
      }
    } catch (err) {
      console.error('Erreur silencieuse lors de la recherche du véhicule:', err);
    } finally {
      setSearchingVehicule(false);
    }
  };

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

  function handleSubmit(e) {
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
      client_nom: clientNom.trim() || 'Client Passage',
      client_phone: clientTel.trim() || '-',
      interventions: [...selectedInterventions],
      heure,
      technicien: 'Technicien Assigné',
    };

    setTickets((prev) => [newTicket, ...prev]);
    setNextId((n) => n + 1);
    setLastTicket(newTicket);

    // Reset des champs
    setImmat('');
    setMarque('');
    setClientNom('');
    setClientTel('');
    setSelectedInterventions([]);
    setErrors({});
    setVehiculeReconnu(null);
  }

  function handlePrint(e) {
    if (e && e.preventDefault) e.preventDefault();
    setTimeout(() => {
      window.print();
    }, 300);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Nouveau Ticket de Prise en Charge</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Champ Immatriculation avec onBlur invisible */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Immatriculation</label>
            {searchingVehicule && (
              <span className="text-xs text-blue-600 animate-pulse font-medium">Vérification en arrière-plan...</span>
            )}
          </div>
          <input
            type="text"
            value={immat}
            onChange={(e) => {
              setImmat(e.target.value.toUpperCase());
              setErrors((err) => ({ ...err, immat: undefined }));
              if (vehiculeReconnu && e.target.value.toUpperCase() !== vehiculeReconnu.matricule) {
                setVehiculeReconnu(null);
              }
            }}
            onBlur={handleImmatBlur}
            placeholder="ex: 1234-A-50, AA-123-BB"
            className={`mt-1 block w-full rounded-md border uppercase font-mono font-bold ${
              errors.immat ? 'border-rose-400 bg-rose-50' : 'border-gray-300'
            } shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2`}
          />
          {errors.immat && <p className="mt-1 text-sm text-rose-600">{errors.immat}</p>}

          {/* Badge discret "Véhicule reconnu" */}
          {vehiculeReconnu && (
            <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">✅</span>
                <div>
                  <span className="font-bold uppercase">Véhicule reconnu : </span>
                  <span>{vehiculeReconnu.nom_complet || vehiculeReconnu.marque}</span>
                  {vehiculeReconnu.client_nom && (
                    <span className="text-emerald-700 font-normal"> (Client : {vehiculeReconnu.client_nom})</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Marque / Modèle */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Marque / Modèle</label>
          <input
            type="text"
            value={marque}
            onChange={(e) => { setMarque(e.target.value); setErrors((err) => ({ ...err, marque: undefined })); }}
            placeholder="ex: Renault Express, Peugeot 208"
            className={`mt-1 block w-full rounded-md border ${errors.marque ? 'border-rose-400 bg-rose-50' : 'border-gray-300'} shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2`}
          />
          {errors.marque && <p className="mt-1 text-sm text-rose-600">{errors.marque}</p>}
        </div>

        {/* Client Nom & Téléphone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Nom du Client (Optionnel)</label>
            <input
              type="text"
              value={clientNom}
              onChange={(e) => setClientNom(e.target.value)}
              placeholder="ex: Jean Dupont"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Téléphone Client (Optionnel)</label>
            <input
              type="text"
              value={clientTel}
              onChange={(e) => setClientTel(e.target.value)}
              placeholder="ex: 06 00 00 00 00"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-1.5 text-sm"
            />
          </div>
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



        {/* Submit button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold py-2 rounded shadow-sm cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm13-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" clipRule="evenodd" />
          </svg>
          Créer le Ticket
        </button>

        {/* Print button */}
        {lastTicket && (
          <button
            type="button"
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded shadow-sm cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M6 9V2h12v7h4v9h-3v3H5v-3H2V9h4zm2 0h8V4H8v5zm9 5h5v5h-5v-5zM5 14h5v5H5v-5z" />
            </svg>
            Imprimer le Ticket
          </button>
        )}
      </form>

      {/* Hidden printable ticket */}
      {lastTicket && <TicketPrintTemplate data={lastTicket} />}
    </div>
  );
}
