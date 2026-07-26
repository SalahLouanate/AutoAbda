<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prestation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogueController extends Controller
{
    /**
     * Récupère la liste complète des prestations & barèmes du catalogue.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Prestation::query();

        if ($request->has('categorie') && !empty($request->categorie)) {
            $query->where('categorie', $request->categorie);
        }

        if ($request->has('search') && !empty($request->search)) {
            $query->where('nom', 'like', '%' . $request->search . '%');
        }

        $prestations = $query->orderBy('categorie')->orderBy('nom')->get();

        $formattedPrestations = $prestations->map(function ($item) {
            return [
                'id'                  => $item->id,
                'nom'                 => $item->nom,
                'categorie'           => $item->categorie,
                'temps_bareme'        => (int) $item->temps_bareme,
                'temps_bareme_heures' => round($item->temps_bareme / 60, 2),
                'tarif'               => (float) $item->tarif,
                'tarif_formatted'     => number_format($item->tarif, 2, ',', ' ') . ' MAD',
                'description'         => $item->description,
            ];
        });

        $grouped = $formattedPrestations->groupBy('categorie');
        $categoriesList = Prestation::distinct()->pluck('categorie')->values();

        return response()->json([
            'message'            => 'Catalogue et barèmes récupérés avec succès.',
            'total_prestations'  => $formattedPrestations->count(),
            'categories_count'   => $categoriesList->count(),
            'categories'         => $categoriesList,
            'grouped'            => $grouped,
            'prestations'        => $formattedPrestations,
        ], 200);
    }

    /**
     * Créer une nouvelle prestation dans le catalogue.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom'          => 'required|string|max:255',
            'categorie'    => 'required|string|max:255',
            'temps_bareme' => 'required|numeric|min:1',
            'tarif'        => 'required|numeric|min:0',
            'description'  => 'nullable|string|max:1000',
        ]);

        $prestation = Prestation::create($validated);

        return response()->json([
            'message'    => 'Prestation ajoutée avec succès.',
            'prestation' => $prestation,
        ], 201);
    }

    /**
     * Mettre à jour une prestation existante.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $prestation = Prestation::findOrFail($id);

        $validated = $request->validate([
            'nom'          => 'sometimes|required|string|max:255',
            'categorie'    => 'sometimes|required|string|max:255',
            'temps_bareme' => 'sometimes|required|numeric|min:1',
            'tarif'        => 'sometimes|required|numeric|min:0',
            'description'  => 'nullable|string|max:1000',
        ]);

        $prestation->update($validated);

        return response()->json([
            'message'    => 'Prestation mise à jour avec succès.',
            'prestation' => $prestation,
        ], 200);
    }

    /**
     * Supprimer une prestation du catalogue.
     */
    public function destroy($id): JsonResponse
    {
        $prestation = Prestation::findOrFail($id);
        $prestation->delete();

        return response()->json([
            'message' => 'Prestation supprimée avec succès.',
        ], 200);
    }
}
