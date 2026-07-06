<?php

namespace App\Services;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\AutoEncoder;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\Encoders\PngEncoder;

class FileUploadService
{
    /**
     * Upload and resize avatar image to 200x200 pixels
     * Store in public disk and return public URL
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

        // Upload to public disk (storage/app/public)
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');
        $stored = $disk->put($filename, (string) $encodedImage);

        if (!$stored) {
            throw new \Exception('Failed to upload avatar');
        }

        // Return relative path — URL is built in UserResource
        return $filename;
    }

    /**
     * Upload KYC document to public storage
     *
     * @param UploadedFile $file
     * @param string $userId
     * @param string $type Document type (e.g., 'document_front', 'document_back', 'selfie')
     * @return string Relative path stored in DB (e.g., kyc/11/document_front_xxx.png)
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

        // Store on public disk (accessible via /storage symlink)
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');
        $stored = $disk->put($filename, file_get_contents($file->getRealPath()));

        if (!$stored) {
            throw new \Exception('Failed to upload KYC document');
        }

        // Return relative path (e.g. kyc/11/document_front_xxx.png)
        return $filename;
    }

    /**
     * Upload travel proof document to public storage
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

        // Upload to public storage
        $disk = Storage::disk('public');
        $stored = $disk->put($filename, file_get_contents($file->getRealPath()));

        if (!$stored) {
            throw new \Exception('Failed to upload travel proof');
        }

        return asset('storage/' . $filename);
    }

    /**
     * Upload branding asset (logo or favicon) to public storage.
     *
     * @param UploadedFile $file
     * @param string $type 'logo' or 'favicon'
     * @return string Public URL of uploaded asset
     * @throws \Exception
     */
    public function uploadBrandingAsset(UploadedFile $file, string $type): string
    {
        $allowedExtensions = $type === 'favicon'
            ? ['ico', 'png', 'svg']
            : ['png', 'jpg', 'jpeg', 'svg'];

        $this->validateFileType($file, $allowedExtensions, $type);
        $this->validateFileSize($file, 2 * 1024 * 1024, $type);

        $extension = $file->getClientOriginalExtension();
        $filename = "branding/{$type}_" . time() . ".{$extension}";

        try {
            // Store on public disk
            $path = Storage::disk('public')->put($filename, file_get_contents($file->getRealPath()));

            if (!$path) {
                throw new \Exception("Échec de l'enregistrement du fichier {$type}");
            }

            $url = Storage::disk('public')->url($filename);

            Log::info('Branding asset stored successfully', [
                'type' => $type,
                'filename' => $filename,
                'url' => $url,
            ]);

            return $url;
        } catch (\Exception $e) {
            Log::error('Failed to store branding asset', [
                'type' => $type,
                'filename' => $filename,
                'error' => $e->getMessage(),
            ]);

            throw new \Exception("Échec de l'upload du {$type}: " . $e->getMessage());
        }
    }

    /**
     * Delete file from storage
     * Handle errors gracefully
     *
     * @param string $path File path in storage
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
            Log::error('Failed to delete file from storage', [
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
            'svg' => ['image/svg+xml'],
            'ico' => ['image/x-icon', 'image/vnd.microsoft.icon'],
        ];

        if (isset($allowedMimeTypes[$extension])) {
            if (!in_array($mimeType, $allowedMimeTypes[$extension])) {
                // MED-3: Hard rejection — MIME type must match the declared extension
                throw new \Exception(
                    "File content type '{$mimeType}' does not match extension '.{$extension}' for {$fileType}. Upload rejected."
                );
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
     * Determine which disk to use based on file path
     *
     * @param string $path
     * @return string Disk name
     */
    private function getDiskFromPath(string $path): string
    {
        // Avatars and branding assets are stored in public disk
        if (str_starts_with($path, 'avatars/') || str_starts_with($path, 'branding/')) {
            return 'public';
        }

        // KYC documents and travel proofs are stored on public disk
        if (str_starts_with($path, 'kyc/') || str_starts_with($path, 'travel-proofs/')) {
            return 'public';
        }

        // Default to local (private) for security
        return 'local';
    }
    
    /**
     * Get the appropriate storage disk (S3 or local fallback)
     *
     * @param string $type 'public' or 'private'
     * @return string Disk name
     */
    private function getStorageDisk(string $type = 'private'): string
    {
        // HIGH-5: Use config() not env() so this works with config:cache in production
        $awsConfigured = !empty(config('services.aws.key')) && !empty(config('services.aws.secret'));
        
        if (!$awsConfigured) {
            // Use local storage as fallback
            return $type === 'public' ? 'public' : 'local';
        }
        
        // Use S3 storage
        return $type === 'public' ? 's3-public' : 's3-private';
    }
}
