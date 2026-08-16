import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'

export default function TicketPrintView() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/reception/tickets/${id}`)
        const data = res.data?.ticket || res.data?.data || res.data
        if (data) {
          setTicket(data)
        } else {
          setError('Ticket non trouvé')
        }
      } catch (err) {
        console.error('Erreur chargement ticket pour impression:', err)
        setError('Impossible de charger les données du ticket.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchTicket()
    }
  }, [id])

  // Déclenchement automatique de l'impression une fois le ticket chargé
  useEffect(() => {
    if (ticket && !loading) {
      const timer = setTimeout(() => {
        window.print()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [ticket, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-800 font-sans print:hidden">
        <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold">Préparation du ticket pour impression...</p>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-800 font-sans print:hidden">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-bold mb-4">
          ⚠️ {error || 'Ticket introuvable.'}
        </div>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
        >
          Fermer cette fenêtre
        </button>
      </div>
    )
  }

  const listPrestations = Array.isArray(ticket?.interventions)
    ? ticket.interventions
    : Array.isArray(ticket?.prestations)
    ? ticket.prestations.map((p) => (typeof p === 'object' ? p.nom || p.label || p.name : p))
    : ticket?.type_intervention
    ? [ticket.type_intervention]
    : []

  const techNom = typeof ticket.technicien === 'object' && ticket.technicien
    ? (ticket.technicien.nom || ticket.technicien.name)
    : (ticket.technicien || 'Non assigné')

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-6 max-w-3xl mx-auto">
      {/* Barre d'action supérieure (cachée à l'impression) */}
      <div className="print:hidden mb-6 p-4 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700">Aperçu d'impression - Ticket #{ticket.id}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <span>🖨️ Imprimer à nouveau</span>
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* ─── FICHE REÇU OFFICIELLE D'IMPRESSION ─── */}
      <div className="border border-slate-300 rounded-2xl p-8 bg-white shadow-none space-y-6">
        
        {/* En-tête Garage & N° Ticket */}
        <div className="flex items-start justify-between border-b border-slate-300 pb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              GARAGE AUTO ABDA
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Maintenance, Diagnostic &amp; Entretien Automobile
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Zone Industrielle, Safi - Tél: 0524-001122
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 mb-1">
              TICKET N° #{ticket.id}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Date: {ticket.date_creation || new Date().toLocaleDateString('fr-FR')}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Heure: {ticket.heure || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Status Priorité / RDV */}
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs">
          <div>
            <span className="text-slate-500 uppercase font-sans text-[10px] block font-bold">Régime de Passage</span>
            <span className="font-extrabold text-sm text-slate-900">
              {ticket.rdv ? '⭐ CLIENT SUR RENDEZ-VOUS (PRIORITAIRE)' : '👤 PASSAGE STANDARD (FILE D\'ATTENTE)'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 uppercase font-sans text-[10px] block font-bold">Statut Actuel</span>
            <span className="font-extrabold text-sm text-blue-700">
              {ticket.statut || 'En attente'}
            </span>
          </div>
        </div>

        {/* Information Véhicule & Client */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-6">
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Information Véhicule</h3>
            <p className="text-sm font-black text-slate-900">{ticket.marque || 'Véhicule Non Renseigné'}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-300 border-2 border-slate-900 rounded-lg font-mono font-black text-slate-900 text-sm tracking-wider">
              <span>MA</span>
              <span>{ticket.immat || 'SANS-IMMAT'}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-right">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Information Client &amp; Affectation</h3>
            <p className="text-sm font-bold text-slate-900">{ticket.client_nom || 'Client Passage'}</p>
            <p className="text-xs text-slate-600 font-mono">Tél: {ticket.client_phone || '-'}</p>
            <p className="text-xs text-slate-700 font-semibold pt-1">
              Tech Assigné: <strong className="text-slate-900">{techNom}</strong>
            </p>
          </div>
        </div>

        {/* Détails des prestations */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Prestations / Interventions Demandées
          </h3>
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Désignation de la prestation</th>
                <th className="p-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {(listPrestations || []).length > 0 ? (
                (listPrestations || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{typeof item === 'object' ? item?.nom || item?.name : item}</td>
                    <td className="p-3 text-right text-slate-600 font-mono">{ticket?.statut || 'En attente'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-3 text-center text-slate-400">Aucune prestation spécifiée</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Emplacement Signature & Remarques */}
        <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs font-medium text-slate-600">
          <div>
            <p className="font-bold text-slate-800 mb-8">Visa Réception / Technicien :</p>
            <div className="border-b border-dashed border-slate-400 w-48" />
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-800 mb-8">Signature Client :</p>
            <div className="border-b border-dashed border-slate-400 w-48 ml-auto" />
          </div>
        </div>

        {/* Bas de page */}
        <div className="pt-4 text-center text-[10px] text-slate-400 border-t border-slate-100">
          Merci de votre confiance. Gardez ce récépissé pour le retrait de votre véhicule.
        </div>
      </div>
    </div>
  )
}
