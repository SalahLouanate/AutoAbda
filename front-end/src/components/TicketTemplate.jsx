import React from 'react'

/**
 * Composant TicketTemplate (Ultra-basique & visible pour validation infaillible react-to-print)
 */
const TicketTemplate = React.forwardRef((props, ref) => {
  const data = props.data

  return (
    <div ref={ref} className="p-10 bg-white text-black min-h-[300px] border-2 border-slate-900 rounded-2xl shadow-xl my-8">
      <h1 className="text-3xl font-bold">GARAGE AUTO ABDA</h1>
      <p className="mt-4 text-lg font-semibold">Ceci est un ticket de test. Si cela s'imprime, le bug est résolu.</p>

      {data && (
        <div className="mt-6 font-mono text-sm border-t border-slate-300 pt-4 space-y-2">
          <p><strong>Code Ticket :</strong> TK-{String(data.id || 1).padStart(4, '0')}</p>
          <p><strong>Immatriculation :</strong> {data.immat || data.immatriculation || 'Non spécifié'}</p>
          <p><strong>Véhicule :</strong> {data.marque || 'Non spécifié'}</p>
          <p><strong>Heure :</strong> {data.heure || 'Récemment'}</p>
          <p>
            <strong>Prestations :</strong>{' '}
            {Array.isArray(data.interventions) ? data.interventions.join(', ') : data.interventions || 'Aucune'}
          </p>
        </div>
      )}
    </div>
  )
})

TicketTemplate.displayName = 'TicketTemplate'

export default TicketTemplate
