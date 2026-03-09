<?php

namespace Tests\Unit;

use App\Models\KYCDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KYCDocumentModelTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test KYCDocument uses UUID primary key.
     */
    public function test_kyc_document_uses_uuid_primary_key(): void
    {
        $kycDocument = KYCDocument::factory()->create();
        
        $this->assertIsString($kycDocument->id);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $kycDocument->id
        );
    }

    /**
     * Test KYCDocument has correct fillable fields.
     */
    public function test_kyc_document_has_correct_fillable_fields(): void
    {
        $fillable = (new KYCDocument())->getFillable();
        
        $expectedFillable = [
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
        ];
        
        $this->assertEquals($expectedFillable, $fillable);
    }

    /**
     * Test KYCDocument casts document_type as string.
     */
    public function test_kyc_document_casts_document_type(): void
    {
        $kycDocument = KYCDocument::factory()->create([
            'document_type' => 'passport',
        ]);
        
        $this->assertIsString($kycDocument->document_type);
        $this->assertEquals('passport', $kycDocument->document_type);
    }

    /**
     * Test KYCDocument casts status as string.
     */
    public function test_kyc_document_casts_status(): void
    {
        $kycDocument = KYCDocument::factory()->create([
            'status' => 'pending',
        ]);
        
        $this->assertIsString($kycDocument->status);
        $this->assertEquals('pending', $kycDocument->status);
    }

    /**
     * Test KYCDocument casts submitted_at as datetime.
     */
    public function test_kyc_document_casts_submitted_at_as_datetime(): void
    {
        $kycDocument = KYCDocument::factory()->create();
        
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $kycDocument->submitted_at);
    }

    /**
     * Test KYCDocument casts reviewed_at as datetime when set.
     */
    public function test_kyc_document_casts_reviewed_at_as_datetime(): void
    {
        $kycDocument = KYCDocument::factory()->approved()->create();
        
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $kycDocument->reviewed_at);
    }

    /**
     * Test KYCDocument belongs to User.
     */
    public function test_kyc_document_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
        ]);
        
        $this->assertInstanceOf(User::class, $kycDocument->user);
        $this->assertEquals($user->id, $kycDocument->user->id);
    }

    /**
     * Test KYCDocument belongs to reviewer (User).
     */
    public function test_kyc_document_belongs_to_reviewer(): void
    {
        $reviewer = User::factory()->create();
        $kycDocument = KYCDocument::factory()->approved()->create([
            'reviewed_by' => $reviewer->id,
        ]);
        
        $this->assertInstanceOf(User::class, $kycDocument->reviewer);
        $this->assertEquals($reviewer->id, $kycDocument->reviewer->id);
    }

    /**
     * Test KYCDocument can be created with passport type.
     */
    public function test_kyc_document_can_be_created_with_passport_type(): void
    {
        $kycDocument = KYCDocument::factory()->passport()->create();
        
        $this->assertEquals('passport', $kycDocument->document_type);
        $this->assertNotNull($kycDocument->document_front_url);
        $this->assertNull($kycDocument->document_back_url);
        $this->assertNotNull($kycDocument->selfie_url);
    }

    /**
     * Test KYCDocument can be created with ID card type.
     */
    public function test_kyc_document_can_be_created_with_id_card_type(): void
    {
        $kycDocument = KYCDocument::factory()->idCard()->create();
        
        $this->assertEquals('idCard', $kycDocument->document_type);
        $this->assertNotNull($kycDocument->document_front_url);
        $this->assertNotNull($kycDocument->document_back_url);
        $this->assertNotNull($kycDocument->selfie_url);
    }

    /**
     * Test KYCDocument can be created with driver's license type.
     */
    public function test_kyc_document_can_be_created_with_drivers_license_type(): void
    {
        $kycDocument = KYCDocument::factory()->driversLicense()->create();
        
        $this->assertEquals('driversLicense', $kycDocument->document_type);
        $this->assertNotNull($kycDocument->document_front_url);
        $this->assertNull($kycDocument->document_back_url);
        $this->assertNotNull($kycDocument->selfie_url);
    }

    /**
     * Test KYCDocument defaults to pending status.
     */
    public function test_kyc_document_defaults_to_pending_status(): void
    {
        $kycDocument = KYCDocument::factory()->create();
        
        $this->assertEquals('pending', $kycDocument->status);
        $this->assertNull($kycDocument->rejection_reason);
        $this->assertNull($kycDocument->reviewed_at);
        $this->assertNull($kycDocument->reviewed_by);
    }

    /**
     * Test KYCDocument can be approved.
     */
    public function test_kyc_document_can_be_approved(): void
    {
        $reviewer = User::factory()->create();
        $kycDocument = KYCDocument::factory()->approved()->create([
            'reviewed_by' => $reviewer->id,
        ]);
        
        $this->assertEquals('approved', $kycDocument->status);
        $this->assertNotNull($kycDocument->reviewed_at);
        $this->assertEquals($reviewer->id, $kycDocument->reviewed_by);
        $this->assertNull($kycDocument->rejection_reason);
    }

    /**
     * Test KYCDocument can be rejected with reason.
     */
    public function test_kyc_document_can_be_rejected_with_reason(): void
    {
        $reviewer = User::factory()->create();
        $kycDocument = KYCDocument::factory()->rejected()->create([
            'reviewed_by' => $reviewer->id,
        ]);
        
        $this->assertEquals('rejected', $kycDocument->status);
        $this->assertNotNull($kycDocument->rejection_reason);
        $this->assertNotNull($kycDocument->reviewed_at);
        $this->assertEquals($reviewer->id, $kycDocument->reviewed_by);
    }

    /**
     * Test KYCDocument has submitted_at timestamp on creation.
     */
    public function test_kyc_document_has_submitted_at_timestamp(): void
    {
        $kycDocument = KYCDocument::factory()->create();
        
        $this->assertNotNull($kycDocument->submitted_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $kycDocument->submitted_at);
    }

    /**
     * Test User has many KYCDocuments relationship.
     */
    public function test_user_has_many_kyc_documents(): void
    {
        $user = User::factory()->create();
        $kycDocument1 = KYCDocument::factory()->create(['user_id' => $user->id]);
        $kycDocument2 = KYCDocument::factory()->create(['user_id' => $user->id]);
        
        $this->assertCount(2, $user->kycDocuments);
        $this->assertTrue($user->kycDocuments->contains($kycDocument1));
        $this->assertTrue($user->kycDocuments->contains($kycDocument2));
    }
}
