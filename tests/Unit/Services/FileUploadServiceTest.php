<?php

namespace Tests\Unit\Services;

use App\Services\FileUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FileUploadServiceTest extends TestCase
{
    private FileUploadService $service;
    
    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new FileUploadService();
        
        // Fake S3 storage
        Storage::fake('s3-public');
        Storage::fake('s3-private');
    }
    
    /** @test */
    public function it_uploads_avatar_with_valid_image()
    {
        $file = UploadedFile::fake()->image('avatar.jpg', 500, 500);
        $userId = 'user-123';
        
        $url = $this->service->uploadAvatar($file, $userId);
        
        $this->assertNotEmpty($url);
        $this->assertStringContainsString('avatars/', $url);
        $this->assertStringContainsString($userId, $url);
        
        // Verify file was stored in public bucket
        $files = Storage::disk('s3-public')->files('avatars');
        $this->assertCount(1, $files);
    }
    
    /** @test */
    public function it_uploads_avatar_with_png_format()
    {
        $file = UploadedFile::fake()->image('avatar.png', 500, 500);
        $userId = 'user-456';
        
        $url = $this->service->uploadAvatar($file, $userId);
        
        $this->assertNotEmpty($url);
        $this->assertStringContainsString('.png', $url);
    }
    
    /** @test */
    public function it_rejects_avatar_with_invalid_file_type()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid file type for avatar');
        
        $file = UploadedFile::fake()->create('document.pdf', 100);
        $userId = 'user-123';
        
        $this->service->uploadAvatar($file, $userId);
    }
    
    /** @test */
    public function it_rejects_avatar_exceeding_size_limit()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('File size exceeds maximum allowed size of 2MB for avatar');
        
        // Create a file larger than 2MB
        $file = UploadedFile::fake()->create('avatar.jpg', 3000); // 3MB
        $userId = 'user-123';
        
        $this->service->uploadAvatar($file, $userId);
    }
    
    /** @test */
    public function it_uploads_kyc_document_with_valid_image()
    {
        $file = UploadedFile::fake()->image('passport.jpg');
        $userId = 'user-123';
        $type = 'document_front';
        
        $url = $this->service->uploadKYCDocument($file, $userId, $type);
        
        $this->assertNotEmpty($url);
        $this->assertStringContainsString('kyc/', $url);
        $this->assertStringContainsString($userId, $url);
        $this->assertStringContainsString($type, $url);
        
        // Verify file was stored in private bucket
        $files = Storage::disk('s3-private')->allFiles("kyc/{$userId}");
        $this->assertCount(1, $files);
    }
    
    /** @test */
    public function it_uploads_kyc_document_with_pdf_format()
    {
        $file = UploadedFile::fake()->create('passport.pdf', 1000, 'application/pdf');
        $userId = 'user-123';
        $type = 'document_front';
        
        $url = $this->service->uploadKYCDocument($file, $userId, $type);
        
        $this->assertNotEmpty($url);
        $this->assertStringContainsString('.pdf', $url);
    }
    
    /** @test */
    public function it_uploads_kyc_document_for_different_types()
    {
        $userId = 'user-123';
        $types = ['document_front', 'document_back', 'selfie'];
        
        foreach ($types as $type) {
            $file = UploadedFile::fake()->image("{$type}.jpg");
            $url = $this->service->uploadKYCDocument($file, $userId, $type);
            
            $this->assertStringContainsString($type, $url);
        }
        
        // Verify all files were stored
        $files = Storage::disk('s3-private')->allFiles("kyc/{$userId}");
        $this->assertCount(3, $files);
    }
    
    /** @test */
    public function it_rejects_kyc_document_with_invalid_file_type()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid file type for KYC document');
        
        $file = UploadedFile::fake()->create('document.txt', 100);
        $userId = 'user-123';
        
        $this->service->uploadKYCDocument($file, $userId, 'document_front');
    }
    
    /** @test */
    public function it_rejects_kyc_document_exceeding_size_limit()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('File size exceeds maximum allowed size of 5MB for KYC document');
        
        // Create a file larger than 5MB
        $file = UploadedFile::fake()->create('passport.jpg', 6000); // 6MB
        $userId = 'user-123';
        
        $this->service->uploadKYCDocument($file, $userId, 'document_front');
    }
    
    /** @test */
    public function it_uploads_travel_proof_with_valid_pdf()
    {
        $file = UploadedFile::fake()->create('ticket.pdf', 1000, 'application/pdf');
        $tripId = 'trip-123';
        
        $url = $this->service->uploadTravelProof($file, $tripId);
        
        $this->assertNotEmpty($url);
        $this->assertStringContainsString('travel-proofs/', $url);
        $this->assertStringContainsString($tripId, $url);
        
        // Verify file was stored in private bucket
        $files = Storage::disk('s3-private')->files('travel-proofs');
        $this->assertCount(1, $files);
    }
    
    /** @test */
    public function it_uploads_travel_proof_with_valid_image()
    {
        $file = UploadedFile::fake()->image('ticket.jpg');
        $tripId = 'trip-456';
        
        $url = $this->service->uploadTravelProof($file, $tripId);
        
        $this->assertNotEmpty($url);
        $this->assertStringContainsString('.jpg', $url);
    }
    
    /** @test */
    public function it_rejects_travel_proof_with_invalid_file_type()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid file type for travel proof');
        
        $file = UploadedFile::fake()->create('document.txt', 100);
        $tripId = 'trip-123';
        
        $this->service->uploadTravelProof($file, $tripId);
    }
    
    /** @test */
    public function it_rejects_travel_proof_exceeding_size_limit()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('File size exceeds maximum allowed size of 5MB for travel proof');
        
        // Create a file larger than 5MB
        $file = UploadedFile::fake()->create('ticket.pdf', 6000); // 6MB
        $tripId = 'trip-123';
        
        $this->service->uploadTravelProof($file, $tripId);
    }
    
    /** @test */
    public function it_deletes_file_from_public_bucket()
    {
        // First upload a file
        $file = UploadedFile::fake()->image('avatar.jpg');
        $userId = 'user-123';
        $url = $this->service->uploadAvatar($file, $userId);
        
        // Extract path from URL
        $files = Storage::disk('s3-public')->files('avatars');
        $this->assertCount(1, $files);
        $path = $files[0];
        
        // Delete the file
        $result = $this->service->deleteFile($path);
        
        $this->assertTrue($result);
        $this->assertFalse(Storage::disk('s3-public')->exists($path));
    }
    
    /** @test */
    public function it_deletes_file_from_private_bucket()
    {
        // First upload a file
        $file = UploadedFile::fake()->image('passport.jpg');
        $userId = 'user-123';
        $url = $this->service->uploadKYCDocument($file, $userId, 'document_front');
        
        // Extract path from URL
        $files = Storage::disk('s3-private')->allFiles("kyc/{$userId}");
        $this->assertCount(1, $files);
        $path = $files[0];
        
        // Delete the file
        $result = $this->service->deleteFile($path);
        
        $this->assertTrue($result);
        $this->assertFalse(Storage::disk('s3-private')->exists($path));
    }
    
    /** @test */
    public function it_returns_false_when_deleting_non_existent_file()
    {
        $result = $this->service->deleteFile('avatars/non-existent-file.jpg');
        
        $this->assertFalse($result);
    }
    
    /** @test */
    public function it_generates_unique_filenames_with_timestamps()
    {
        $file1 = UploadedFile::fake()->image('avatar.jpg');
        $file2 = UploadedFile::fake()->image('avatar.jpg');
        $userId = 'user-123';
        
        $url1 = $this->service->uploadAvatar($file1, $userId);
        
        // Sleep for 1 second to ensure different timestamp
        sleep(1);
        
        $url2 = $this->service->uploadAvatar($file2, $userId);
        
        $this->assertNotEquals($url1, $url2);
        
        // Verify both files exist
        $files = Storage::disk('s3-public')->files('avatars');
        $this->assertCount(2, $files);
    }
    
    /** @test */
    public function it_validates_mime_type_matches_extension()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('File MIME type does not match extension');
        
        // Create a file with mismatched extension and MIME type
        $file = UploadedFile::fake()->create('avatar.jpg', 100, 'application/pdf');
        $userId = 'user-123';
        
        $this->service->uploadAvatar($file, $userId);
    }
}
