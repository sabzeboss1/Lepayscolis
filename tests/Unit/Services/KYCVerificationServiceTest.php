<?php

namespace Tests\Unit\Services;

use App\Models\KYCDocument;
use App\Models\User;
use App\Services\FileUploadService;
use App\Services\KYCVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class KYCVerificationServiceTest extends TestCase
{
    use RefreshDatabase;

    private KYCVerificationService $service;
    private FileUploadService $fileUploadService;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock S3 storage
        Storage::fake('s3-private');
        
        $this->fileUploadService = $this->app->make(FileUploadService::class);
        $this->service = new KYCVerificationService($this->fileUploadService);
    }

    /** @test */
    public function it_submits_passport_kyc_document_with_required_files()
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        
        $files = [
            'document_front' => UploadedFile::fake()->image('passport.jpg', 800, 600),
            'selfie' => UploadedFile::fake()->image('selfie.jpg', 800, 600),
        ];

        $kycDocument = $this->service->submitKYCDocument($user, 'passport', $files);

        $this->assertInstanceOf(KYCDocument::class, $kycDocument);
        $this->assertEquals($user->id, $kycDocument->user_id);
        $this->assertEquals('passport', $kycDocument->document_type);
        $this->assertEquals('pending', $kycDocument->status);
        $this->assertNotNull($kycDocument->document_front_url);
        $this->assertNull($kycDocument->document_back_url);
        $this->assertNotNull($kycDocument->selfie_url);
        $this->assertNotNull($kycDocument->submitted_at);
        
        // Verify files were uploaded to S3
        Storage::disk('s3-private')->assertExists("kyc/{$user->id}/document_front_" . $kycDocument->submitted_at->timestamp . ".jpg");
        Storage::disk('s3-private')->assertExists("kyc/{$user->id}/selfie_" . $kycDocument->submitted_at->timestamp . ".jpg");
    }

    /** @test */
    public function it_submits_id_card_kyc_document_with_all_required_files()
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        
        $files = [
            'document_front' => UploadedFile::fake()->image('id_front.jpg', 800, 600),
            'document_back' => UploadedFile::fake()->image('id_back.jpg', 800, 600),
            'selfie' => UploadedFile::fake()->image('selfie.jpg', 800, 600),
        ];

        $kycDocument = $this->service->submitKYCDocument($user, 'idCard', $files);

        $this->assertInstanceOf(KYCDocument::class, $kycDocument);
        $this->assertEquals('idCard', $kycDocument->document_type);
        $this->assertNotNull($kycDocument->document_front_url);
        $this->assertNotNull($kycDocument->document_back_url);
        $this->assertNotNull($kycDocument->selfie_url);
    }

    /** @test */
    public function it_submits_drivers_license_kyc_document_with_required_files()
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        
        $files = [
            'document_front' => UploadedFile::fake()->image('license.jpg', 800, 600),
            'selfie' => UploadedFile::fake()->image('selfie.jpg', 800, 600),
        ];

        $kycDocument = $this->service->submitKYCDocument($user, 'driversLicense', $files);

        $this->assertInstanceOf(KYCDocument::class, $kycDocument);
        $this->assertEquals('driversLicense', $kycDocument->document_type);
        $this->assertNotNull($kycDocument->document_front_url);
        $this->assertNull($kycDocument->document_back_url);
        $this->assertNotNull($kycDocument->selfie_url);
    }

    /** @test */
    public function it_rejects_invalid_document_type()
    {
        $user = User::factory()->create();
        
        $files = [
            'document_front' => UploadedFile::fake()->image('doc.jpg'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
        ];

        $this->expectException(ValidationException::class);
        $this->service->submitKYCDocument($user, 'invalidType', $files);
    }

    /** @test */
    public function it_rejects_passport_submission_without_document_front()
    {
        $user = User::factory()->create();
        
        $files = [
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Document front is required');
        
        $this->service->submitKYCDocument($user, 'passport', $files);
    }

    /** @test */
    public function it_rejects_passport_submission_without_selfie()
    {
        $user = User::factory()->create();
        
        $files = [
            'document_front' => UploadedFile::fake()->image('passport.jpg'),
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Selfie is required');
        
        $this->service->submitKYCDocument($user, 'passport', $files);
    }

    /** @test */
    public function it_rejects_id_card_submission_without_document_back()
    {
        $user = User::factory()->create();
        
        $files = [
            'document_front' => UploadedFile::fake()->image('id_front.jpg'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Document back is required for ID card');
        
        $this->service->submitKYCDocument($user, 'idCard', $files);
    }

    /** @test */
    public function it_rejects_files_with_invalid_type()
    {
        $user = User::factory()->create();
        
        $files = [
            'document_front' => UploadedFile::fake()->create('document.txt', 100),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('File must be JPEG, PNG, or PDF format');
        
        $this->service->submitKYCDocument($user, 'passport', $files);
    }

    /** @test */
    public function it_rejects_files_exceeding_5mb_size()
    {
        $user = User::factory()->create();
        
        // Create a file larger than 5MB (5 * 1024 KB + 1 KB)
        $files = [
            'document_front' => UploadedFile::fake()->create('document.jpg', 5121),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('File size must not exceed 5MB');
        
        $this->service->submitKYCDocument($user, 'passport', $files);
    }

    /** @test */
    public function it_accepts_pdf_files_for_kyc_documents()
    {
        $user = User::factory()->create();
        
        $files = [
            'document_front' => UploadedFile::fake()->create('passport.pdf', 1000, 'application/pdf'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
        ];

        $kycDocument = $this->service->submitKYCDocument($user, 'passport', $files);

        $this->assertInstanceOf(KYCDocument::class, $kycDocument);
        $this->assertStringContainsString('.pdf', $kycDocument->document_front_url);
    }

    /** @test */
    public function it_approves_kyc_document_and_updates_user_status()
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        $admin = User::factory()->create();
        
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $approvedDocument = $this->service->approveKYC($kycDocument, $admin);

        $this->assertEquals('approved', $approvedDocument->status);
        $this->assertNotNull($approvedDocument->reviewed_at);
        $this->assertEquals($admin->id, $approvedDocument->reviewed_by);
        
        // Verify user KYC status was updated
        $user->refresh();
        $this->assertEquals('approved', $user->kyc_status);
    }

    /** @test */
    public function it_rejects_kyc_document_with_reason_and_updates_user_status()
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        $admin = User::factory()->create();
        
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $reason = 'Document is blurry and unreadable';
        $rejectedDocument = $this->service->rejectKYC($kycDocument, $admin, $reason);

        $this->assertEquals('rejected', $rejectedDocument->status);
        $this->assertEquals($reason, $rejectedDocument->rejection_reason);
        $this->assertNotNull($rejectedDocument->reviewed_at);
        $this->assertEquals($admin->id, $rejectedDocument->reviewed_by);
        
        // Verify user KYC status was updated
        $user->refresh();
        $this->assertEquals('rejected', $user->kyc_status);
    }

    /** @test */
    public function it_requires_rejection_reason_when_rejecting_kyc()
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        $admin = User::factory()->create();
        
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Rejection reason is required');
        
        $this->service->rejectKYC($kycDocument, $admin, '');
    }

    /** @test */
    public function it_requires_non_empty_rejection_reason()
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        $admin = User::factory()->create();
        
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Rejection reason is required');
        
        $this->service->rejectKYC($kycDocument, $admin, '   ');
    }

    /** @test */
    public function it_records_review_metadata_on_approval()
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        $admin = User::factory()->create();
        
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'reviewed_at' => null,
            'reviewed_by' => null,
        ]);

        $beforeApproval = now()->subSecond();
        $approvedDocument = $this->service->approveKYC($kycDocument, $admin);
        $afterApproval = now()->addSecond();

        $this->assertNotNull($approvedDocument->reviewed_at);
        $this->assertTrue($approvedDocument->reviewed_at->between($beforeApproval, $afterApproval));
        $this->assertEquals($admin->id, $approvedDocument->reviewed_by);
    }

    /** @test */
    public function it_records_review_metadata_on_rejection()
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        $admin = User::factory()->create();
        
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'reviewed_at' => null,
            'reviewed_by' => null,
        ]);

        $beforeRejection = now()->subSecond();
        $rejectedDocument = $this->service->rejectKYC($kycDocument, $admin, 'Invalid document');
        $afterRejection = now()->addSecond();

        $this->assertNotNull($rejectedDocument->reviewed_at);
        $this->assertTrue($rejectedDocument->reviewed_at->between($beforeRejection, $afterRejection));
        $this->assertEquals($admin->id, $rejectedDocument->reviewed_by);
    }

    /** @test */
    public function it_stores_kyc_documents_privately_in_s3()
    {
        $user = User::factory()->create();
        
        $files = [
            'document_front' => UploadedFile::fake()->image('passport.jpg'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg'),
        ];

        $kycDocument = $this->service->submitKYCDocument($user, 'passport', $files);

        // Verify files are stored in the private S3 bucket (s3-private disk)
        $this->assertStringContainsString('kyc/', $kycDocument->document_front_url);
        $this->assertStringContainsString('kyc/', $kycDocument->selfie_url);
        
        // Verify the URLs are from the private disk
        $this->assertStringContainsString($user->id, $kycDocument->document_front_url);
        $this->assertStringContainsString($user->id, $kycDocument->selfie_url);
    }
}
