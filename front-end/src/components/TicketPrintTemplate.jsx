import React from 'react';

/**
 * TicketPrintTemplate
 *
 * Reçoit les données du véhicule via la prop `data`.
 * À l'impression, index.css cible #print-section pour rendre uniquement cet élément visible.
 */
export default function TicketPrintTemplate({ data }) {
  if (!data) return null;

  return (
    <div id="print-section" className="text-black bg-white text-sm font-mono">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold">AUTO ABDA</h1>
        <p>Ticket de Réception</p>
        <p>{new Date().toLocaleString('fr-FR')}</p>
      </div>
      
      <div className="border-t border-b border-dashed border-gray-400 py-3 my-3">
        <p className="font-bold text-lg mb-1">{data.immatriculation || data.immat}</p>
        <p className="text-gray-700">{data.marque}</p>
      </div>

      <div className="mb-4">
        <p className="font-semibold">Interventions :</p>
        <p>
          {Array.isArray(data.interventions)
            ? data.interventions.join(', ')
            : (data.interventions || 'Non spécifiées')}
        </p>
      </div>
      
      <div className="text-center mt-6">
        <p className="font-bold">Technicien assigné :</p>
        <p className="text-lg">{data.technicien || 'En attente'}</p>
      </div>
      
      <div className="text-center mt-8 text-xs text-gray-500 italic">
        Merci de votre confiance. Veuillez patienter en salle d'attente.
      </div>
    </div>
  );
}
