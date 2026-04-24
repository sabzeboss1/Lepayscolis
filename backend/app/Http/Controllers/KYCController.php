<?php

namespace App\Http\Controllers;

use App\Http\Requests\KYC\ApproveKYCRequest;
use App\Http\Requests\KYC\RejectKYCRequest;
use App\Http\Requests\KYC\SubmitKYCRequest;
use App\Http\Resources\KYCDocumentResource;
use App\Models\KYCDocument;
use App\Services\KYCVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KYCController extends Controller
{
    public function __construct(
        private KYCVerificationService $kycVerificationService
    ) {}

    /**
     * Get the authenticated user's KYC document
     * 
     * GET /api/kyc
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function show(Request $request): JsonResponse
    {
        $kycDocument = KYCDocument::where('user_id', $request->user()->id)
            ->with(['user', 'reviewer'])
            ->latest()
            ->first();

        if (!$kycDocument) {
            return response()->json([
                'message' => 'No KYC document found',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'message' => 'KYC document retrieved successfully',
            'data' => new KYCDocumentResource($kycDocument),
        ]);
    }

    /**
     * Submit a new KYC document
     * 
     * POST /api/kyc
     * 
     * @param SubmitKYCRequest $request
     * @return JsonResponse
     */
    public function store(SubmitKYCRequest $request): JsonResponse
    {
        try {
            \Log::info('KYC submission started', [
                'user_id' => $request->user()->id,
                'document_type' => $request->input('document_type'),
                'has_document_front' => $request->hasFile('document_front'),
                'has_document_back' => $request->hasFile('document_back'),
                'has_selfie' => $request->hasFile('selfie'),
            ]);

            $files = [
                'document_front' => $request->file('document_front'),
                'selfie' => $request->file('selfie'),
            ];

            // Add document_back if provided (required for ID cards)
            if ($request->hasFile('document_back')) {
                $files['document_back'] = $request->file('document_back');
            }

            $kycDocument = $this->kycVerificationService->submitKYCDocument(
                $request->user(),
                $request->input('document_type'),
                $files
            );

            \Log::info('KYC submission successful', [
                'user_id' => $request->user()->id,
                'kyc_document_id' => $kycDocument->id,
            ]);

            return response()->json([
                'message' => 'KYC document submitted successfully',
                'data' => new KYCDocumentResource($kycDocument->load(['user', 'reviewer'])),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('KYC validation failed', [
                'user_id' => $request->user()->id,
                'errors' => $e->errors(),
            ]);
            
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('KYC submission failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Failed to submit KYC document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get the authenticated user's KYC status
     * 
     * GET /api/kyc/status
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $kycDocument = KYCDocument::where('user_id', $user->id)
            ->latest()
            ->first();

        return response()->json([
            'message' => 'KYC status retrieved successfully',
            'data' => [
                'kyc_status' => $user->kyc_status,
                'has_submitted' => $kycDocument !== null,
                'document_status' => $kycDocument?->status,
                'submitted_at' => $kycDocument?->submitted_at,
                'reviewed_at' => $kycDocument?->reviewed_at,
                'rejection_reason' => $kycDocument?->rejection_reason,
            ],
        ]);
    }

    /**
     * Serve KYC image with proper authentication and CORS headers
     * 
     * GET /api/kyc/images/{userId}/{filename}
     * 
     * @param Request $request
     * @param string $userId
     * @param string $filename
     * @return \Illuminate\Http\Response
     */
    public function serveImage(Request $request, string $userId, string $filename)
    {
        $user = $request->user();
        
        // Check if user is admin or accessing their own images
        if (!$user->isAdmin() && $user->id != $userId) {
            return response()->json([
                'message' => 'Unauthorized to access this image',
            ], 403);
        }

        // Construct the file path
        $path = "kyc/{$userId}/{$filename}";
        
        // Check if file exists in storage
        if (!\Storage::disk('public')->exists($path)) {
            return response()->json([
                'message' => 'Image not found',
            ], 404);
        }

        // Get the file
        $file = \Storage::disk('public')->get($path);
        $mimeType = \Storage::disk('public')->mimeType($path);

        // Return the file with proper headers
        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Access-Control-Allow-Origin', config('cors.allowed_origins')[0] ?? '*')
            ->header('Access-Control-Allow-Credentials', 'true')
            ->header('Cache-Control', 'private, max-age=3600');
    }

    /**
     * List all pending KYC documents (admin only)
     * 
     * GET /api/admin/kyc/pending
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function pending(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 15);
        
        $kycDocuments = KYCDocument::where('status', 'pending')
            ->with(['user', 'reviewer'])
            ->orderBy('submitted_at', 'asc')
            ->paginate($perPage);

        return response()->json([
            'message' => 'Pending KYC documents retrieved successfully',
            'data' => KYCDocumentResource::collection($kycDocuments),
            'meta' => [
                'current_page' => $kycDocuments->currentPage(),
                'last_page' => $kycDocuments->lastPage(),
                'per_page' => $kycDocuments->perPage(),
                'total' => $kycDocuments->total(),
            ],
        ]);
    }

    /**
     * Approve a KYC document (admin only)
     * 
     * POST /api/admin/kyc/{id}/approve
     * 
     * @param ApproveKYCRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function approve(ApproveKYCRequest $request, string $id): JsonResponse
    {
        $kycDocument = KYCDocument::findOrFail($id);

        if ($kycDocument->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending KYC documents can be approved',
                'current_status' => $kycDocument->status,
            ], 422);
        }

        try {
            $approvedDocument = $this->kycVerificationService->approveKYC(
                $kycDocument,
                $request->user()
            );

            return response()->json([
                'message' => 'KYC document approved successfully',
                'data' => new KYCDocumentResource($approvedDocument),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to approve KYC document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject a KYC document with reason (admin only)
     * 
     * POST /api/admin/kyc/{id}/reject
     * 
     * @param RejectKYCRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function reject(RejectKYCRequest $request, string $id): JsonResponse
    {
        $kycDocument = KYCDocument::findOrFail($id);

        if ($kycDocument->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending KYC documents can be rejected',
                'current_status' => $kycDocument->status,
            ], 422);
        }

        try {
            $rejectedDocument = $this->kycVerificationService->rejectKYC(
                $kycDocument,
                $request->user(),
                $request->input('rejection_reason')
            );

            return response()->json([
                'message' => 'KYC document rejected successfully',
                'data' => new KYCDocumentResource($rejectedDocument),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reject KYC document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
