<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class TravelProofController extends Controller
{
    /**
     * Serve travel proof file for a trip
     * 
     * @param string $tripId
     * @return Response
     */
    public function show(string $tripId): Response
    {
        $trip = Trip::find($tripId);
        
        if (!$trip || !$trip->travel_proof_url) {
            abort(404, 'Travel proof not found');
        }
        
        // Extract the file path from the URL
        // travel_proof_url format: /storage/travel-proofs/filename.pdf
        $relativePath = str_replace('/storage/', '', $trip->travel_proof_url);
        // Don't add 'private/' because the local disk root is already storage/app/private
        $path = $relativePath;
        
        if (!Storage::disk('local')->exists($path)) {
            abort(404, 'File not found');
        }
        
        $file = Storage::disk('local')->get($path);
        $mimeType = Storage::disk('local')->mimeType($path);
        
        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', 'inline')
            ->header('Cache-Control', 'public, max-age=3600');
    }
}
