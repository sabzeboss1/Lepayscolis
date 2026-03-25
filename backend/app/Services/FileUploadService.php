<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\AutoEncoder;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\Encoders\PngEncoder;

class FileUploadService
{
    /**
     * Upload and resize avatar image to 200x200 pixels
     * Store in public storage (S3 or local) and return public URL
     *
     * @param UploadedFile $file
     * @param string $userId
     * @return string Public URL of uploaded avatar
     * @throws \Exception
     */
    public function uploadAvatar(UploadedFile $file, string $userId): string
    {
        // Validate file type
        $this->validateFileType($file, ['jpg', 'jpeg', 'png'], 'avatar');
        
        // Validate file size (2MB max)
        $this->validateFileSize($file, 2 * 1024 * 1024, 'avatar');
        
        // Generate unique filename
        $extension = $file->getClientOriginalExtension();
        $filename = "avatars/{$userId}_" . time() . ".{$extension}";
        
        // Create image manager with GD driver
        $manager = new ImageManager(new Driver());
        
        // Resize image to 200x200 pixels
        $image = $manager->read($file->getRealPath());
        $image->cover(200, 200);
        
        // Encode image based on original format
        $encoder = match(strtolower($extension)) {
            'jpg', 'jpeg' => new JpegEncoder(quality: 90),
            'png' => new PngEncoder(),
            default => new AutoEncoder(quality: 90),
        };
        
        $encodedImage = $image->encode($encoder);
        
        // Use local storage if AWS is not configured
        $disk = $this->getStorageDisk('public');
        
        // Upload to storage
        Storage::disk($disk)->put($filename, (string) $encodedImage);
        
        // Return public URL
        return Storage::disk($disk)->url($filename);
    }
    
    /**
     * Upload KYC document to private storage
     * Store in private bucket (S3 or local) and return URL
     *
     * @param UploadedFile $file
     * @param string $userId
     * @param string $type Document type (e.g., 'document_front', 'document_back', 'selfie')
     * @return string URL of uploaded document
     * @throws \Exception
     */
    public function uploadKYCDocument(UploadedFile $file, string $userId, string $type): string
    {
        // Validate file type
        $this->validateFileType($file, ['jpg', 'jpeg', 'png', 'pdf'], 'KYC document');
        
        // Validate file size (5MB max)
        $this->validateFileSize($file, 5 * 1024 * 1024, 'KYC document');
        
        // Generate unique filename
        $extension = $file->getClientOriginalExtension();
        $filename = "kyc/{$userId}/{$type}_" . time() . ".{$extension}";
        
        // Use local storage if AWS is not configured
        $disk = $this->getStorageDisk('private');
        
        // Upload to storage
        $path = $file->storeAs('', $filename, $disk);
        
        if (!$path) {
            throw new \Exception('Failed to upload KYC document');
        }
        
        // Return the path (not URL) for local storage, or URL for S3
        if ($disk === 'local') {
            return $path; // Return path like "kyc/6/document_front_123.jpg"
        }
        
        return Storage::disk($disk)->url($filename);
    }
    
    /**
     * Upload travel proof document to private storage
     * Store in private bucket (S3 or local) and return URL
     *
     * @param UploadedFile $file
     * @param string $tripId
     * @return string URL of uploaded travel proof
     * @throws \Exception
     */
    public function uploadTravelProof(UploadedFile $file, string $tripId): string
    {
        // Validate file type
        $this->validateFileType($file, ['pdf', 'jpg', 'jpeg', 'png'], 'travel proof');
        
        // Validate file size (5MB max)
        $this->validateFileSize($file, 5 * 1024 * 1024, 'travel proof');
        
        // Generate unique filename
        $extension = $file->getClientOriginalExtension();
        $filename = "travel-proofs/{$tripId}_" . time() . ".{$extension}";
        
        // Use local storage if AWS is not configured
        $disk = $this->getStorageDisk('private');
        
        // Upload to storage
        $path = $file->storeAs('', $filename, $disk);
        
        if (!$path) {
            throw new \Exception('Failed to upload travel proof');
        }
        
        // Return URL
        return Storage::disk($disk)->url($filename);
    }
    
    /**
     * Delete file from S3
     * Handle errors gracefully
     *
     * @param string $path File path in S3
     * @return bool True if deleted successfully, false otherwise
     */
    public function deleteFile(string $path): bool
    {
        try {
            // Determine which disk to use based on path
            $disk = $this->getDiskFromPath($path);
            
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->delete($path);
            }
            
            return false;
        } catch (\Exception $e) {
            // Log error but don't throw exception
            \Log::error('Failed to delete file from S3', [
                'path' => $path,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }
    
    /**
     * Validate file type
     *
     * @param UploadedFile $file
     * @param array $allowedExtensions
     * @param string $fileType
     * @throws \Exception
     */
    private function validateFileType(UploadedFile $file, array $allowedExtensions, string $fileType): void
    {
        $extension = strtolower($file->getClientOriginalExtension());
        
        if (!in_array($extension, $allowedExtensions)) {
            throw new \Exception(
                "Invalid file type for {$fileType}. Allowed types: " . implode(', ', $allowedExtensions)
            );
        }
        
        // Additional MIME type validation (more flexible for JPEG variants)
        $mimeType = $file->getMimeType();
        $allowedMimeTypes = [
            'jpg' => ['image/jpeg', 'image/jpg', 'image/pjpeg'],
            'jpeg' => ['image/jpeg', 'image/jpg', 'image/pjpeg'],
            'png' => ['image/png', 'image/x-png'],
            'pdf' => ['application/pdf', 'application/x-pdf'],
        ];
        
        if (isset($allowedMimeTypes[$extension])) {
            if (!in_array($mimeType, $allowedMimeTypes[$extension])) {
                // Log warning but don't throw exception - trust extension validation
                \Log::warning("MIME type mismatch for {$fileType}", [
                    'expected' => $allowedMimeTypes[$extension],
                    'actual' => $mimeType,
                    'extension' => $extension,
                ]);
            }
        }
    }
    
    /**
     * Validate file size
     *
     * @param UploadedFile $file
     * @param int $maxSize Maximum size in bytes
     * @param string $fileType
     * @throws \Exception
     */
    private function validateFileSize(UploadedFile $file, int $maxSize, string $fileType): void
    {
        if ($file->getSize() > $maxSize) {
            $maxSizeMB = $maxSize / (1024 * 1024);
            throw new \Exception(
                "File size exceeds maximum allowed size of {$maxSizeMB}MB for {$fileType}"
            );
        }
    }
    
    /**
     * Determine which S3 disk to use based on file path
     *
     * @param string $path
     * @return string Disk name
     */
    private function getDiskFromPath(string $path): string
    {
        // Avatars are stored in public bucket
        if (str_starts_with($path, 'avatars/')) {
            return 's3-public';
        }
        
        // KYC documents and travel proofs are stored in private bucket
        if (str_starts_with($path, 'kyc/') || str_starts_with($path, 'travel-proofs/')) {
            return 's3-private';
        }
        
        // Default to private for security
        return 's3-private';
    }
    
    /**
     * Get the appropriate storage disk (S3 or local fallback)
     *
     * @param string $type 'public' or 'private'
     * @return string Disk name
     */
    private function getStorageDisk(string $type = 'private'): string
    {
        // Check if AWS is configured
        $awsConfigured = !empty(env('AWS_ACCESS_KEY_ID')) && !empty(env('AWS_SECRET_ACCESS_KEY'));
        
        if (!$awsConfigured) {
            // Use local storage as fallback
            return $type === 'public' ? 'public' : 'local';
        }
        
        // Use S3 storage
        return $type === 'public' ? 's3-public' : 's3-private';
    }
}
