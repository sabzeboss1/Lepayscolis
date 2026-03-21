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
        Storage::disk('public')->put($filename, (string) $encodedImage);

        // Return public URL (accessible via /storage symlink)
        return Storage::disk('public')->url($filename);
    }

    /**
     * Upload KYC document to private local storage
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

        // Upload to local private storage
        $path = $file->storeAs('', $filename, 'local');

        if (!$path) {
            throw new \Exception('Failed to upload KYC document');
        }

        // Return URL (served by Laravel via local disk with serve => true)
        return Storage::disk('local')->url($filename);
    }

    /**
     * Upload travel proof document to private local storage
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

        // Upload to local private storage
        $path = $file->storeAs('', $filename, 'local');

        if (!$path) {
            throw new \Exception('Failed to upload travel proof');
        }

        // Return URL (served by Laravel via local disk with serve => true)
        return Storage::disk('local')->url($filename);
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

        // Store on public disk
        Storage::disk('public')->put($filename, file_get_contents($file->getRealPath()));

        return Storage::disk('public')->url($filename);
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
            \Log::error('Failed to delete file from storage', [
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

        // Additional MIME type validation
        $mimeType = $file->getMimeType();
        $allowedMimeTypes = [
            'jpg' => ['image/jpeg', 'image/jpg'],
            'jpeg' => ['image/jpeg', 'image/jpg'],
            'png' => ['image/png'],
            'pdf' => ['application/pdf'],
            'svg' => ['image/svg+xml'],
            'ico' => ['image/x-icon', 'image/vnd.microsoft.icon'],
        ];

        if (isset($allowedMimeTypes[$extension])) {
            if (!in_array($mimeType, $allowedMimeTypes[$extension])) {
                throw new \Exception(
                    "File MIME type does not match extension for {$fileType}"
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

        // KYC documents and travel proofs are stored in local (private) disk
        if (str_starts_with($path, 'kyc/') || str_starts_with($path, 'travel-proofs/')) {
            return 'local';
        }

        // Default to local (private) for security
        return 'local';
    }
}
