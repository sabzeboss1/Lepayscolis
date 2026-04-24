<?php

namespace App\Services;

use App\Models\KYCDocument;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class KYCVerificationService
{
    public function __construct(
        private FileUploadService $fileUploadService
    ) {}

    /**
     * Submit KYC document with validation and file uploads
     * 
     * @param User $user
     * @param string $documentType One of: passport, idCard, driversLicense
     * @param array $files Array of UploadedFile objects with keys: document_front, document_back (optional), selfie
     * @return KYCDocument
     * @throws ValidationException
     * @throws \Exception
     */
    public function submitKYCDocument(User $user, string $documentType, array $files): KYCDocument
    {
        // Validate document type
        $allowedTypes = ['passport', 'idCard', 'driversLicense'];
        if (!in_array($documentType, $allowedTypes)) {
            throw ValidationException::withMessages([
                'document_type' => ['Invalid document type. Allowed types: ' . implode(', ', $allowedTypes)]
            ]);
        }

        // Validate required files based on document type
        $this->validateDocumentFiles($documentType, $files);

        // Validate file types and sizes
        $this->validateFiles($files);

        DB::beginTransaction();
        try {
            // Upload files to S3 private bucket
            $documentFrontUrl = $this->fileUploadService->uploadKYCDocument(
                $files['document_front'],
                $user->id,
                'document_front'
            );

            $documentBackUrl = null;
            if (isset($files['document_back'])) {
                $documentBackUrl = $this->fileUploadService->uploadKYCDocument(
                    $files['document_back'],
                    $user->id,
                    'document_back'
                );
            }

            $selfieUrl = $this->fileUploadService->uploadKYCDocument(
                $files['selfie'],
                $user->id,
                'selfie'
            );

            // Create KYC document record
            $kycDocument = KYCDocument::create([
                'user_id' => $user->id,
                'document_type' => $documentType,
                'document_front_url' => $documentFrontUrl,
                'document_back_url' => $documentBackUrl,
                'selfie_url' => $selfieUrl,
                'status' => 'pending',
                'submitted_at' => now(),
            ]);

            // Update user KYC status to pending after successful submission
            $user->update([
                'kyc_status' => 'pending',
            ]);

            // Clear admin dashboard cache to update pending KYC count
            $this->clearDashboardCache();

            DB::commit();

            return $kycDocument;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Approve KYC document and update user status
     * 
     * @param KYCDocument $kycDocument
     * @param User $adminUser
     * @return KYCDocument
     */
    public function approveKYC(KYCDocument $kycDocument, User $adminUser): KYCDocument
    {
        DB::beginTransaction();
        try {
            // Update KYC document status
            $kycDocument->update([
                'status' => 'approved',
                'reviewed_at' => now(),
                'reviewed_by' => $adminUser->id,
            ]);

            // Update user KYC status
            $kycDocument->user->update([
                'kyc_status' => 'approved',
            ]);

            // Clear admin dashboard cache to update pending KYC count
            $this->clearDashboardCache();

            DB::commit();

            return $kycDocument->fresh(['user', 'reviewer']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Reject KYC document with reason and update user status
     * 
     * @param KYCDocument $kycDocument
     * @param User $adminUser
     * @param string $reason
     * @return KYCDocument
     * @throws ValidationException
     */
    public function rejectKYC(KYCDocument $kycDocument, User $adminUser, string $reason): KYCDocument
    {
        // Validate rejection reason is provided
        if (empty(trim($reason))) {
            throw ValidationException::withMessages([
                'rejection_reason' => ['Rejection reason is required']
            ]);
        }

        DB::beginTransaction();
        try {
            // Update KYC document status
            $kycDocument->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
                'reviewed_at' => now(),
                'reviewed_by' => $adminUser->id,
            ]);

            // Update user KYC status
            $kycDocument->user->update([
                'kyc_status' => 'rejected',
            ]);

            // Clear admin dashboard cache to update pending KYC count
            $this->clearDashboardCache();

            DB::commit();

            return $kycDocument->fresh(['user', 'reviewer']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Validate that required files are present based on document type
     * 
     * Requirements:
     * - passport: document_front + selfie
     * - idCard: document_front + document_back + selfie
     * - driversLicense: document_front + selfie
     * 
     * @param string $documentType
     * @param array $files
     * @throws ValidationException
     */
    private function validateDocumentFiles(string $documentType, array $files): void
    {
        $errors = [];

        // All document types require document_front and selfie
        if (!isset($files['document_front']) || !($files['document_front'] instanceof UploadedFile)) {
            $errors['document_front'] = ['Document front is required'];
        }

        if (!isset($files['selfie']) || !($files['selfie'] instanceof UploadedFile)) {
            $errors['selfie'] = ['Selfie is required'];
        }

        // ID card requires document_back
        if ($documentType === 'idCard') {
            if (!isset($files['document_back']) || !($files['document_back'] instanceof UploadedFile)) {
                $errors['document_back'] = ['Document back is required for ID card'];
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * Validate file types and sizes
     * 
     * Requirements:
     * - File types: JPEG, PNG, PDF
     * - Max size: 5MB per file
     * 
     * @param array $files
     * @throws ValidationException
     */
    private function validateFiles(array $files): void
    {
        $errors = [];
        $allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/pdf',
        ];
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        $maxSize = 5 * 1024 * 1024; // 5MB in bytes

        foreach ($files as $key => $file) {
            if (!($file instanceof UploadedFile)) {
                continue;
            }

            // Validate file type
            $mimeType = $file->getMimeType();
            $extension = strtolower($file->getClientOriginalExtension());

            if (!in_array($mimeType, $allowedMimeTypes) || !in_array($extension, $allowedExtensions)) {
                $errors[$key][] = 'File must be JPEG, PNG, or PDF format';
            }

            // Validate file size
            if ($file->getSize() > $maxSize) {
                $errors[$key][] = 'File size must not exceed 5MB';
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * Clear admin dashboard cache to reflect updated KYC counts
     * 
     * @return void
     */
    private function clearDashboardCache(): void
    {
        Cache::forget('admin_dashboard_metrics');
        Cache::forget('admin_dashboard_charts');
        
        // Also clear activity feed cache as it might include KYC submissions
        for ($limit = 10; $limit <= 50; $limit += 10) {
            Cache::forget("admin_activity_feed_{$limit}");
        }
    }
}
