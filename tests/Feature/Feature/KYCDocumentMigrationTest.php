<?php

namespace Tests\Feature;

use App\Models\KYCDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KYCDocumentMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_kyc_documents_table_has_correct_columns(): void
    {
        $this->assertTrue(
            \Schema::hasTable('kyc_documents'),
            'KYC documents table does not exist'
        );

        $columns = [
            'id',
            'user_id',
            'document_type',
            'document_front_url',
            'document_back_url',
            'selfie_url',
            'status',
            'rejection_reason',
            'submitted_at',
            'reviewed_at',
            'reviewed_by',
            'created_at',
            'updated_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(
                \Schema::hasColumn('kyc_documents', $column),
                "KYC documents table is missing column: {$column}"
            );
        }
    }

    public function test_can_create_kyc_document_with_all_fields(): void
    {
        $user = User::factory()->create();
        $reviewer = User::factory()->create();

        $kycDocument = KYCDocument::create([
            'user_id' => $user->id,
            'document_type' => 'passport',
            'document_front_url' => 'kyc/front.jpg',
            'document_back_url' => null,
            'selfie_url' => 'kyc/selfie.jpg',
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        $this->assertDatabaseHas('kyc_documents', [
            'id' => $kycDocument->id,
            'user_id' => $user->id,
            'document_type' => 'passport',
        ]);
    }

    public function test_kyc_document_has_user_relationship(): void
    {
        $user = User::factory()->create();
        $kycDocument = KYCDocument::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(User::class, $kycDocument->user);
        $this->assertEquals($user->id, $kycDocument->user->id);
    }

    public function test_kyc_document_has_reviewer_relationship(): void
    {
        $reviewer = User::factory()->create();
        $kycDocument = KYCDocument::factory()->approved()->create(['reviewed_by' => $reviewer->id]);

        $this->assertInstanceOf(User::class, $kycDocument->reviewer);
        $this->assertEquals($reviewer->id, $kycDocument->reviewer->id);
    }

    public function test_kyc_document_type_enum_values(): void
    {
        $user = User::factory()->create();
        $documentTypes = ['passport', 'idCard', 'driversLicense'];

        foreach ($documentTypes as $type) {
            $kycDocument = KYCDocument::factory()->create([
                'user_id' => $user->id,
                'document_type' => $type,
            ]);

            $this->assertEquals($type, $kycDocument->document_type);
        }
    }

    public function test_kyc_document_status_enum_values(): void
    {
        $user = User::factory()->create();
        $statuses = ['pending', 'approved', 'rejected'];

        foreach ($statuses as $status) {
            $kycDocument = KYCDocument::factory()->create([
                'user_id' => $user->id,
                'status' => $status,
            ]);

            $this->assertEquals($status, $kycDocument->status);
        }
    }

    public function test_passport_does_not_require_back_document(): void
    {
        $kycDocument = KYCDocument::factory()->passport()->create();

        $this->assertEquals('passport', $kycDocument->document_type);
        $this->assertNull($kycDocument->document_back_url);
    }

    public function test_id_card_requires_back_document(): void
    {
        $kycDocument = KYCDocument::factory()->idCard()->create();

        $this->assertEquals('idCard', $kycDocument->document_type);
        $this->assertNotNull($kycDocument->document_back_url);
    }

    public function test_drivers_license_does_not_require_back_document(): void
    {
        $kycDocument = KYCDocument::factory()->driversLicense()->create();

        $this->assertEquals('driversLicense', $kycDocument->document_type);
        $this->assertNull($kycDocument->document_back_url);
    }

    public function test_kyc_document_defaults_to_pending_status(): void
    {
        $kycDocument = KYCDocument::factory()->create();

        $this->assertEquals('pending', $kycDocument->status);
        $this->assertNull($kycDocument->reviewed_at);
        $this->assertNull($kycDocument->reviewed_by);
    }

    public function test_approved_kyc_document_has_review_metadata(): void
    {
        $kycDocument = KYCDocument::factory()->approved()->create();

        $this->assertEquals('approved', $kycDocument->status);
        $this->assertNotNull($kycDocument->reviewed_at);
        $this->assertNotNull($kycDocument->reviewed_by);
    }

    public function test_rejected_kyc_document_has_rejection_reason(): void
    {
        $kycDocument = KYCDocument::factory()->rejected()->create();

        $this->assertEquals('rejected', $kycDocument->status);
        $this->assertNotNull($kycDocument->rejection_reason);
        $this->assertNotNull($kycDocument->reviewed_at);
        $this->assertNotNull($kycDocument->reviewed_by);
    }

    public function test_kyc_document_has_submitted_at_timestamp(): void
    {
        $kycDocument = KYCDocument::factory()->create();

        $this->assertNotNull($kycDocument->submitted_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $kycDocument->submitted_at);
    }
}
