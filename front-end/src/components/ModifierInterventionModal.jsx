import { useState, useEffect, useMemo } from 'react'
import Select from 'react-select'
import api from '../api/axios'

// ─── Styles personnalisés pour le Select React (Catalogue) ─────────────────────
const selectCustomStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '0.75rem',
    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    paddingTop: '2px',
    paddingBottom: '2px',
    backgroundColor: '#ffffff',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: '0.5rem',
    fontSize: '0.8125rem',
    fontWeight: state.isSelected ? '600' : '500',
    backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'transparent',
    color: state.isSelected ? '#ffffff' : state.isFocused ? '#1d4ed8' : '#1e293b',
    cursor: 'pointer',
    padding: '8px 12px',
    margin: '2px 0',
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '0.5rem',
    padding: '1px 4px',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: '0.75rem',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#3b82f6',
    borderRadius: '0.375rem',
    ':hover': {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
    padding: '6px',
    zIndex: 9999,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
}

export default function ModifierInterventionModal({
  isOpen,
  intervention,
  onClose,
  onSaved,
}) {
  // ── Form States (Épuré : uniquement Véhicule, Prestations, Technicien, Motif) ──
  const [immatriculation, setImmatriculation] = useState('')
  const [marque, setMarque] = useState('')
  const [selectedPrestations, setSelectedPrestations] = useState([])
  const [technicienId, setTechnicienId] = useState('')
  const [motifBlocage, setMotifBlocage] = useState('')

  // ── Data Sources ────────────────────────────────────────────────────────────
  const [catalogueList, setCatalogueList] = useState([])
  const [techniciensList, setTechniciensList] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // ── Chargement Catalogue & Techniciens ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const fetchData = async () => {
      setLoadingData(true)
      try {
        const [catalogueRes, techRes] = await Promise.allSettled([
          api.get('/catalogue').catch(() => api.get('/reception/catalogue')),
          api.get('/techniciens-disponibles').catch(() => api.get('/reception/techniciens-disponibles')),
        ])

        if (isMounted) {
          if (catalogueRes.status === 'fulfilled' && catalogueRes.value?.data) {
            const data = catalogueRes.value.data
            const items = data.prestations || data.catalogue || data.interventions || []
            setCatalogueList(items)
          }

          if (techRes.status === 'fulfilled' && techRes.value?.data) {
            const data = techRes.value.data
            const techs = data.techniciens || data.personnel || []
            setTechniciensList(techs)
          }
        }
      } catch (err) {
        console.error('Erreur chargement catalogue/techniciens dans le modal:', err)
      } finally {
        if (isMounted) setLoadingData(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  // ── Options pour le Multi-Select Catalogue (Dédupliqué) ─────────────────────
  const selectOptions = useMemo(() => {
    const seen = new Set()
    const options = []

    catalogueList.forEach((item) => {
      if (!item) return
      const idVal = item.id
      const nomVal = (item.nom || item.nom_intervention || '').trim()
      const key = `${idVal || ''}-${nomVal.toLowerCase()}`

      if (seen.has(key)) return
      seen.add(key)

      const baremeVal = Number(item.temps_bareme) || 0
      const isVar = Boolean(item.est_variable)

      let labelText = nomVal
      if (isVar) {
        labelText += ' (Durée variable)'
      } else if (baremeVal > 0) {
        labelText += ` (${baremeVal} min)`
      }

      options.push({
        value: idVal,
        label: labelText,
        nom: nomVal,
        temps_bareme: baremeVal,
        est_variable: isVar,
        categorie: item.categorie,
        tarif: item.tarif,
      })
    })

    return options
  }, [catalogueList])

  // ── Normalisation et extraction complète des données de l'intervention ──────
  useEffect(() => {
    if (!isOpen || !intervention) return

    setErrors({})

    // 1. Extraction robuste de l'immatriculation (Réception + Direction/Chef)
    let rawImmat =
      intervention.immat ||
      intervention.immatriculation ||
      intervention.matricule ||
      intervention.vehicule?.matricule ||
      intervention.vehicule?.immatriculation ||
      intervention.vehiculeObj?.matricule ||
      intervention.raw?.vehicule?.matricule ||
      ''

    // Si vehicule est une chaîne "Marque Modèle (12345-A-26)" (format courant côté Chef)
    if (!rawImmat && typeof intervention.vehicule === 'string') {
      const match = intervention.vehicule.match(/\(([^)]+)\)/)
      if (match) {
        rawImmat = match[1].trim()
      }
    }
    setImmatriculation(rawImmat.toUpperCase())

    // 2. Extraction robuste de la Marque & Modèle
    let rawMarque =
      intervention.marque ||
      (typeof intervention.vehicule === 'object' && intervention.vehicule !== null
        ? `${intervention.vehicule.marque || ''} ${intervention.vehicule.modele || ''}`.trim() ||
          intervention.vehicule.nom_complet
        : '') ||
      (typeof intervention.vehiculeObj === 'object' && intervention.vehiculeObj !== null
        ? `${intervention.vehiculeObj.marque || ''} ${intervention.vehiculeObj.modele || ''}`.trim()
        : '') ||
      (typeof intervention.raw?.vehicule === 'object' && intervention.raw?.vehicule !== null
        ? `${intervention.raw.vehicule.marque || ''} ${intervention.raw.vehicule.modele || ''}`.trim()
        : '') ||
      ''

    // Si vehicule est une chaîne sans propriété marque distincte
    if (!rawMarque && typeof intervention.vehicule === 'string') {
      const cleanName = intervention.vehicule.replace(/\s*\([^)]*\)/, '').trim()
      if (cleanName && cleanName !== 'Véhicule N/A' && cleanName !== 'Inconnu') {
        rawMarque = cleanName
      }
    }
    setMarque(rawMarque)

    // 3. Motif de blocage
    setMotifBlocage(intervention.motif_blocage || intervention.motifBlocage || '')

    // 4. Extraction robuste du technicien assigné
    let tId =
      intervention.technicien?.id ||
      intervention.technicien_id ||
      intervention.user_id ||
      intervention.user?.id ||
      intervention.raw?.technicien?.id ||
      intervention.raw?.user_id ||
      (typeof intervention.technicien === 'number' ? intervention.technicien : '')

    // Fallback par nom si l'ID n'est pas direct
    if (!tId && intervention.technicien) {
      const techName =
        typeof intervention.technicien === 'object'
          ? intervention.technicien.nom_complet ||
            intervention.technicien.name ||
            intervention.technicien.nom
          : String(intervention.technicien)

      if (techName && techniciensList.length > 0) {
        const found = techniciensList.find(
          (t) =>
            (t.nom || t.name || '').toLowerCase() === techName.toLowerCase() ||
            (t.nom_complet || '').toLowerCase() === techName.toLowerCase()
        )
        if (found) {
          tId = found.id
        }
      }
    }
    setTechnicienId(tId ? String(tId) : '')

    // 5. Extraction robuste et DÉDUPLIQUÉE des prestations existantes
    const rawPrestationsList = []
    const seenRaw = new Set()

    const addRawPrestation = (item) => {
      if (!item) return
      let idStr = ''
      let nameStr = ''
      if (typeof item === 'object' && item !== null) {
        idStr = item.id !== undefined && item.id !== null ? String(item.id).trim().toLowerCase() : ''
        nameStr = (item.nom || item.name || item.nom_intervention || '').trim().toLowerCase()
      } else {
        nameStr = String(item).trim().toLowerCase()
      }

      const key = idStr ? `id:${idStr}` : `name:${nameStr}`
      if (key && !seenRaw.has(key)) {
        seenRaw.add(key)
        if (nameStr) seenRaw.add(`name:${nameStr}`)
        rawPrestationsList.push(item)
      }
    }

    const collectPrestations = (src) => {
      if (Array.isArray(src)) {
        src.forEach((item) => addRawPrestation(item))
      } else if (typeof src === 'string' && src.trim()) {
        src.split(',').forEach((p) => {
          const trimmed = p.trim()
          if (trimmed) addRawPrestation(trimmed)
        })
      }
    }

    // 🛑 PRIORITÉ STRICTE : Une seule source primaire pour éviter les doublons croisés
    if (Array.isArray(intervention.vehicule?.prestations) && intervention.vehicule.prestations.length > 0) {
      collectPrestations(intervention.vehicule.prestations)
    } else if (Array.isArray(intervention.prestations) && intervention.prestations.length > 0) {
      collectPrestations(intervention.prestations)
    } else if (Array.isArray(intervention.interventions) && intervention.interventions.length > 0) {
      collectPrestations(intervention.interventions)
    } else if (Array.isArray(intervention.raw?.vehicule?.prestations) && intervention.raw.vehicule.prestations.length > 0) {
      collectPrestations(intervention.raw.vehicule.prestations)
    } else if (intervention.catalogue) {
      collectPrestations([intervention.catalogue])
    } else if (intervention.type_intervention) {
      collectPrestations(intervention.type_intervention)
    } else if (intervention.type) {
      collectPrestations(intervention.type)
    }

    // 🛑 DÉDUPLICATION STRICTE des options React-Select (par ID et par libellé)
    const deduplicateOptions = (options) => {
      if (!Array.isArray(options)) return []
      const seenIds = new Set()
      const seenLabels = new Set()

      return options.filter((item) => {
        if (!item) return false
        const idVal = item.value !== undefined && item.value !== null ? String(item.value).trim().toLowerCase() : null
        const nameVal = (item.nom || item.label || item.name || '').trim().toLowerCase()

        if (idVal && seenIds.has(idVal)) return false
        if (nameVal && seenLabels.has(nameVal)) return false

        if (idVal) seenIds.add(idVal)
        if (nameVal) seenLabels.add(nameVal)
        return true
      })
    }

    // Matching avec les options du catalogue
    if (selectOptions.length > 0 && rawPrestationsList.length > 0) {
      const matched = selectOptions.filter((opt) =>
        rawPrestationsList.some((ex) => {
          if (typeof ex === 'object' && ex !== null) {
            return (
              (ex.id && String(opt.value) === String(ex.id)) ||
              (ex.nom && opt.nom.toLowerCase() === ex.nom.toLowerCase()) ||
              (ex.name && opt.nom.toLowerCase() === ex.name.toLowerCase()) ||
              (ex.nom_intervention && opt.nom.toLowerCase() === ex.nom_intervention.toLowerCase())
            )
          }
          if (typeof ex === 'number') {
            return opt.value === ex
          }
          if (typeof ex === 'string') {
            return opt.nom.toLowerCase() === ex.toLowerCase()
          }
          return false
        })
      )

      if (matched.length > 0) {
        // Écrase la valeur précédente sans push
        setSelectedPrestations(deduplicateOptions(matched))
      } else {
        // Fallback affichage des éléments originaux
        const fallbackOpts = rawPrestationsList.map((item) => {
          const nom = typeof item === 'object' && item !== null ? item.nom || item.name : String(item)
          const id = typeof item === 'object' && item !== null && item.id !== undefined ? item.id : `fallback-${nom.toLowerCase()}`
          return { value: id, label: nom, nom, temps_bareme: item.temps_bareme || 60 }
        })
        setSelectedPrestations(deduplicateOptions(fallbackOpts))
      }
    } else if (rawPrestationsList.length > 0) {
      // Si le catalogue n'est pas encore arrivé, pré-remplir immédiatement
      const tempOpts = rawPrestationsList.map((item) => {
        const nom = typeof item === 'object' && item !== null ? item.nom || item.name : String(item)
        const id = typeof item === 'object' && item !== null && item.id !== undefined ? item.id : `temp-${nom.toLowerCase()}`
        return { value: id, label: nom, nom, temps_bareme: item.temps_bareme || 60 }
      })
      setSelectedPrestations(deduplicateOptions(tempOpts))
    } else {
      setSelectedPrestations([])
    }
  }, [isOpen, intervention, selectOptions, techniciensList])

  // ── Recalcul en temps réel du Temps Barémé Estimé (Feedback Visuel) ─────────
  const { totalTempsBareme, aPrestationVariable } = useMemo(() => {
    let total = 0
    let hasVariable = false

    selectedPrestations.forEach((p) => {
      if (p.est_variable) {
        hasVariable = true
      } else {
        total += Number(p.temps_bareme) || 0
      }
    })

    return {
      totalTempsBareme: total > 0 ? total : selectedPrestations.length > 0 ? 60 : 0,
      aPrestationVariable: hasVariable,
    }
  }, [selectedPrestations])

  if (!isOpen || !intervention) return null

  // ── Validation du Formulaire ────────────────────────────────────────────────
  const validateForm = () => {
    const errs = {}
    if (!immatriculation.trim()) {
      errs.immatriculation = "L'immatriculation du véhicule est requise."
    }
    if (!marque.trim()) {
      errs.marque = 'La marque et le modèle sont requis.'
    }
    if (selectedPrestations.length === 0) {
      errs.prestations = 'Veuillez sélectionner au moins une prestation dans le catalogue.'
    }
    return errs
  }

  // ── Soumission Axios PUT ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const formErrors = validateForm()
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    // Extraction des IDs d'interventions
    const catalogueIds = selectedPrestations
      .map((item) => item.value)
      .filter((v) => v !== undefined && v !== null && !String(v).startsWith('custom-'))

    const payload = {
      immatriculation: immatriculation.trim().toUpperCase(),
      matricule: immatriculation.trim().toUpperCase(),
      marque: marque.trim(),
      interventions: catalogueIds.length > 0 ? catalogueIds : selectedPrestations.map((p) => p.nom),
      catalogue_ids: catalogueIds,
      type_intervention: selectedPrestations.map((p) => p.nom).join(', '),
      technicien_id: technicienId ? parseInt(technicienId, 10) : null,
      motif_blocage: motifBlocage.trim() || null,
    }

    try {
      const response = await api.put(`/interventions/${intervention.id}`, payload)

      const updated = response.data?.ticket || response.data?.intervention || {
        ...intervention,
        ...payload,
        immat: payload.immatriculation,
        technicien: techniciensList.find((t) => String(t.id) === String(technicienId)) || null,
        interventions: selectedPrestations.map((p) => p.nom),
        temps_bareme: totalTempsBareme,
      }

      if (onSaved) {
        onSaved(updated)
      }
      onClose()
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de l'intervention:", err)
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Une erreur est survenue lors de l'enregistrement des modifications."
      setErrors({ api: errorMsg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop sombre flouté */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Boîte Modale */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Barre d'accentuation en dégradé */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />

        {/* En-tête de la Modale */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Modifier l'Intervention #{intervention.id}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Véhicule, prestations du catalogue et réattribution du technicien
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message d'erreur API global */}
        {errors.api && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>{errors.api}</span>
          </div>
        )}

        {/* Formulaire Épuré */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* ── SECTION 1 : VÉHICULE (Épuré : Immatriculation & Marque/Modèle) ── */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-600">
                <path d="M6.5 3c-1.051 0-2.093.04-3.125.117A1.49 1.49 0 0 0 2 4.607V10.5h9V4.606c0-.771-.582-1.428-1.353-1.489A42.08 42.08 0 0 0 6.5 3ZM12.5 10.5h5.5V4.607c0-.771-.582-1.428-1.353-1.489A42.08 42.08 0 0 0 13.5 3c-.34 0-.678.004-1 .013V10.5ZM2 12v3.25A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25V12H2Z" />
              </svg>
              <span>1. Informations du Véhicule</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Immatriculation */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Immatriculation <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={immatriculation}
                    onChange={(e) => {
                      setImmatriculation(e.target.value.toUpperCase())
                      setErrors((prev) => ({ ...prev, immatriculation: undefined }))
                    }}
                    placeholder="ex: 12345-A-26"
                    className={`w-full font-mono font-bold text-sm px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 uppercase transition placeholder:font-normal placeholder:normal-case ${
                      errors.immatriculation
                        ? 'border-rose-300 focus:ring-rose-400 text-rose-900'
                        : 'border-slate-300 focus:ring-blue-500 text-slate-800'
                    }`}
                  />
                  {immatriculation && (
                    <span className="absolute right-2.5 top-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-slate-900 text-yellow-400 pointer-events-none">
                      MA
                    </span>
                  )}
                </div>
                {errors.immatriculation && (
                  <p className="text-rose-500 text-[11px] font-medium mt-1">{errors.immatriculation}</p>
                )}
              </div>

              {/* Marque & Modèle */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Marque &amp; Modèle <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={marque}
                  onChange={(e) => {
                    setMarque(e.target.value)
                    setErrors((prev) => ({ ...prev, marque: undefined }))
                  }}
                  placeholder="ex: Dacia Sandero Stepway"
                  className={`w-full text-sm px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 transition ${
                    errors.marque
                      ? 'border-rose-300 focus:ring-rose-400 text-rose-900'
                      : 'border-slate-300 focus:ring-blue-500 text-slate-800'
                  }`}
                />
                {errors.marque && (
                  <p className="text-rose-500 text-[11px] font-medium mt-1">{errors.marque}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── SECTION 2 : PRESTATIONS & TEMPS BARÉMÉ (CATALOGUE) ── */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-600">
                  <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 0 1 8.75 1h2.5A2.75 2.75 0 0 1 14 3.75v.443c.572.055 1.14.122 1.706.2 1.453.202 2.544 1.437 2.544 2.905v9.452a2.75 2.75 0 0 1-2.75 2.75H4.5A2.75 2.75 0 0 1 1.75 16.75V7.298c0-1.468 1.091-2.703 2.544-2.905.565-.078 1.134-.145 1.706-.2V3.75Zm2.75-.75a1.25 1.25 0 0 0-1.25 1.25v.328c.833.02 1.666.052 2.5.094.834-.042 1.667-.074 2.5-.094V4.25A1.25 1.25 0 0 0 11.25 3h-2.5Z" clipRule="evenodd" />
                </svg>
                <span>2. Prestations &amp; Barèmes (Catalogue Garage)</span>
              </div>

              {/* Badge Barème Total Recalculé */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-2xs">
                <span>⏱️ Barème total :</span>
                <span className="text-indigo-900">{totalTempsBareme} min</span>
                {aPrestationVariable && (
                  <span className="text-[10px] text-amber-700 font-semibold">(+ variable)</span>
                )}
              </div>
            </div>

            <div>
              <Select
                isMulti
                options={selectOptions}
                value={selectedPrestations}
                onChange={(selected) => {
                  setSelectedPrestations(selected || [])
                  setErrors((prev) => ({ ...prev, prestations: undefined }))
                }}
                isLoading={loadingData}
                placeholder="Sélectionnez une ou plusieurs prestations du catalogue..."
                styles={selectCustomStyles}
                noOptionsMessage={() => 'Aucune prestation trouvée dans le catalogue'}
                menuPlacement="auto"
              />
              {errors.prestations && (
                <p className="text-rose-500 text-[11px] font-medium mt-1.5">{errors.prestations}</p>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              💡 <span className="font-semibold">Recalcul automatique :</span> Le barème et la prime du technicien seront instantanément recalculés en base selon les prestations choisies.
            </p>
          </div>

          {/* ── SECTION 3 : ATTRIBUTION TECHNICIEN ── */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-600">
                <path fillRule="evenodd" d="M10 2a4 4 0 0 0-4 4v1H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V6a4 4 0 0 0-4-4Zm-2 5V6a2 2 0 1 1 4 0v1H8Z" clipRule="evenodd" />
              </svg>
              <span>3. Technicien Assigné</span>
            </div>

            <div>
              <select
                value={technicienId}
                onChange={(e) => setTechnicienId(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition cursor-pointer"
              >
                <option value="">-- Non assigné (File d'attente générale) --</option>
                {techniciensList.map((tech) => {
                  const isMaint =
                    tech.is_maintenance ||
                    (tech.pont_statut &&
                      (tech.pont_statut.toLowerCase().includes('maint') ||
                        tech.pont_statut.toLowerCase().includes('hors')))

                  return (
                    <option key={tech.id} value={tech.id}>
                      {tech.nom || tech.name} {tech.specialite ? `· ${tech.specialite}` : ''}
                      {tech.pont_nom ? ` (${tech.pont_nom})` : ''}
                      {isMaint ? ' ⚠️ [Pont en Maintenance]' : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* ── SECTION 4 : MOTIF DE BLOCAGE (Optionnel) ── */}
          {(motifBlocage || intervention.statut === 'Bloqué' || intervention.statut === 'En pause') && (
            <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 space-y-2">
              <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                Motif de blocage ou Note technique
              </label>
              <textarea
                rows={2}
                value={motifBlocage}
                onChange={(e) => setMotifBlocage(e.target.value)}
                placeholder="Préciser la pièce manquante ou la raison du blocage..."
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 transition resize-none"
              />
            </div>
          )}

          {/* ── ACTIONS / BOUTONS ── */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
