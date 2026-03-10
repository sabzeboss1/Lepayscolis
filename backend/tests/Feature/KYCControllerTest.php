<?php

namespace Tests\Feature;

use App\Models\KYCDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class KYCControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('s3-public');
        Storage::fake('s3-private');
    }

    /** @test */
    public function user_can_get_their_kyc_document()
    {
        $user = User::factory()->create();
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/kyc');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'user_id',
                    'document_type',
                    'status',
                    'submitted_at',
                ],
            ]);
    }

    /** @test */
    public function user_gets_404_when_no_kyc_document_exists()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/kyc');

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'No KYC document found',
                'data' => null,
            ]);
    }

    /** @test */
    public function user_can_submit_kyc_document_with_passport()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/kyc', [
                'document_type' => 'passport',
                'document_front' => UploadedFile::fake()->image('passport.jpg'),
                'selfie' => UploadedFile::fake()->image('selfie.jpg'),
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'user_id',
                    'document_type',
                    'status',
                ],
            ]);

        $this->assertDatabaseHas('kyc_documents', [
            'user_id' => $user->id,
            'document_type' => 'passport',
            'status' => 'pending',
        ]);
    }

    /** @test */
    public function user_can_get_their_kyc_status()
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/kyc/status');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'KYC status retrieved successfully',
                'data' => [
                    'kyc_status' => 'pending',
                    'has_submitted' => true,
                    'document_status' => 'pending',
                ],
            ]);
    }

    /** @test */
    public function admin_can_list_pending_kyc_documents()
    {
        $admin = User::factory()->create();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        KYCDocument::factory()->create([
            'user_id' => $user1->id,
            'status' => 'pending',
        ]);
        KYCDocument::factory()->create([
            'user_id' => $user2->id,
            'status' => 'pending',
        ]);
        KYCDocument::factory()->create([
            'user_id' => $user1->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/kyc/pending');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'user_id',
                        'status',
                    ],
                ],
                'meta',
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    /** @test */
    public function admin_can_approve_pending_kyc_document()
    {
        $admin = User::factory()->create();
        $user = User::factory()->create(['kyc_status' => 'pending']);
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/kyc/{$kycDocument->id}/approve");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'KYC document approved successfully',
            ]);

        $this->assertDatabaseHas('kyc_documents', [
            'id' => $kycDocument->id,
            'status' => 'approved',
            'reviewed_by' => $admin->id,
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'kyc_status' => 'approved',
        ]);
    }

    /** @test */
    public function admin_can_reject_pending_kyc_document_with_reason()
    {
        $admin = User::factory()->create();
        $user = User::factory()->create(['kyc_status' => 'pending']);
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/kyc/{$kycDocument->id}/reject", [
                'rejection_reason' => 'Document is not clear enough',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'KYC document rejected successfully',
            ]);

        $this->assertDatabaseHas('kyc_documents', [
            'id' => $kycDocument->id,
            'status' => 'rejected',
            'rejection_reason' => 'Document is not clear enough',
            'reviewed_by' => $admin->id,
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'kyc_status' => 'rejected',
        ]);
    }

    /** @test */
    public function cannot_approve_non_pending_kyc_document()
    {
        $admin = User::factory()->create();
        $user = User::factory()->create();
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/kyc/{$kycDocument->id}/approve");

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Only pending KYC documents can be approved',
            ]);
    }

    /** @test */
    public function cannot_reject_non_pending_kyc_document()
    {
        $admin = User::factory()->create();
        $user = User::factory()->create();
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/kyc/{$kycDocument->id}/reject", [
                'rejection_reason' => 'Some reason',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Only pending KYC documents can be rejected',
            ]);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_kyc_endpoints()
    {
        $response = $this->getJson('/api/kyc');
        $response->assertStatus(401);

        $response = $this->postJson('/api/kyc');
        $response->assertStatus(401);

        $response = $this->getJson('/api/kyc/status');
        $response->assertStatus(401);
    }
}
