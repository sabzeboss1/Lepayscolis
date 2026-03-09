<?php

namespace Tests\Feature;

use App\Models\KYCDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KYCDocumentObserverIntegrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test KYCDocument observer updates user kyc_status when document is approved.
     * Validates: Requirements 2.7
     */
    public function test_observer_updates_user_kyc_status_to_approved(): void
    {
        // Create a user with pending KYC status
        $user = User::factory()->create([
            'kyc_status' => 'pending',
        ]);
        
        // Create a pending KYC document
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        
        // Verify initial state
        $this->assertEquals('pending', $user->fresh()->kyc_status);
        
        // Approve the KYC document
        $reviewer = User::factory()->create();
        $kycDocument->update([
            'status' => 'approved',
            'reviewed_at' => now(),
            'reviewed_by' => $reviewer->id,
        ]);
        
        // Verify user's kyc_status is updated to approved
        $this->assertEquals('approved', $user->fresh()->kyc_status);
    }

    /**
     * Test KYCDocument observer updates user kyc_status when document is rejected.
     * Validates: Requirements 2.8
     */
    public function test_observer_updates_user_kyc_status_to_rejected(): void
    {
        // Create a user with pending KYC status
        $user = User::factory()->create([
            'kyc_status' => 'pending',
        ]);
        
        // Create a pending KYC document
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        
        // Verify initial state
        $this->assertEquals('pending', $user->fresh()->kyc_status);
        
        // Reject the KYC document
        $reviewer = User::factory()->create();
        $kycDocument->update([
            'status' => 'rejected',
            'rejection_reason' => 'Document is not clear',
            'reviewed_at' => now(),
            'reviewed_by' => $reviewer->id,
        ]);
        
        // Verify user's kyc_status is updated to rejected
        $this->assertEquals('rejected', $user->fresh()->kyc_status);
    }

    /**
     * Test KYCDocument observer does not update user kyc_status when other fields change.
     */
    public function test_observer_does_not_update_user_kyc_status_when_other_fields_change(): void
    {
        // Create a user with pending KYC status
        $user = User::factory()->create([
            'kyc_status' => 'pending',
        ]);
        
        // Create a pending KYC document
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        
        // Update a field other than status
        $kycDocument->update([
            'document_front_url' => 'kyc/updated_front.jpg',
        ]);
        
        // Verify user's kyc_status remains unchanged
        $this->assertEquals('pending', $user->fresh()->kyc_status);
    }

    /**
     * Test KYCDocument observer handles status change from approved to rejected.
     */
    public function test_observer_handles_status_change_from_approved_to_rejected(): void
    {
        // Create a user with approved KYC status
        $user = User::factory()->create([
            'kyc_status' => 'approved',
        ]);
        
        // Create an approved KYC document
        $reviewer = User::factory()->create();
        $kycDocument = KYCDocument::factory()->approved()->create([
            'user_id' => $user->id,
            'reviewed_by' => $reviewer->id,
        ]);
        
        // Verify initial state
        $this->assertEquals('approved', $user->fresh()->kyc_status);
        
        // Change status to rejected
        $kycDocument->update([
            'status' => 'rejected',
            'rejection_reason' => 'Document expired',
        ]);
        
        // Verify user's kyc_status is updated to rejected
        $this->assertEquals('rejected', $user->fresh()->kyc_status);
    }

    /**
     * Test KYCDocument observer handles status change from rejected to approved.
     */
    public function test_observer_handles_status_change_from_rejected_to_approved(): void
    {
        // Create a user with rejected KYC status
        $user = User::factory()->create([
            'kyc_status' => 'rejected',
        ]);
        
        // Create a rejected KYC document
        $reviewer = User::factory()->create();
        $kycDocument = KYCDocument::factory()->rejected()->create([
            'user_id' => $user->id,
            'reviewed_by' => $reviewer->id,
        ]);
        
        // Verify initial state
        $this->assertEquals('rejected', $user->fresh()->kyc_status);
        
        // Change status to approved (e.g., user resubmitted valid documents)
        $kycDocument->update([
            'status' => 'approved',
            'rejection_reason' => null,
        ]);
        
        // Verify user's kyc_status is updated to approved
        $this->assertEquals('approved', $user->fresh()->kyc_status);
    }

    /**
     * Test KYCDocument observer handles multiple KYC documents for same user.
     */
    public function test_observer_handles_multiple_kyc_documents_for_same_user(): void
    {
        // Create a user with pending KYC status
        $user = User::factory()->create([
            'kyc_status' => 'pending',
        ]);
        
        // Create first KYC document (pending)
        $kycDocument1 = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        
        // Reject the first document
        $reviewer = User::factory()->create();
        $kycDocument1->update([
            'status' => 'rejected',
            'rejection_reason' => 'Document not clear',
            'reviewed_at' => now(),
            'reviewed_by' => $reviewer->id,
        ]);
        
        // User's status should be rejected
        $this->assertEquals('rejected', $user->fresh()->kyc_status);
        
        // Create second KYC document (pending)
        $kycDocument2 = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        
        // Approve the second document
        $kycDocument2->update([
            'status' => 'approved',
            'reviewed_at' => now(),
            'reviewed_by' => $reviewer->id,
        ]);
        
        // User's status should be approved
        $this->assertEquals('approved', $user->fresh()->kyc_status);
    }

    /**
     * Test KYCDocument observer does not fail when user is deleted.
     */
    public function test_observer_handles_missing_user_gracefully(): void
    {
        // Create a user and KYC document
        $user = User::factory()->create([
            'kyc_status' => 'pending',
        ]);
        
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        
        // Delete the user (this should cascade delete the KYC document due to foreign key)
        // But let's test the observer's null check
        $user->delete();
        
        // This should not throw an error even though user is soft deleted
        $kycDocument->update([
            'status' => 'approved',
        ]);
        
        // Test passes if no exception is thrown
        $this->assertTrue(true);
    }

    /**
     * Test KYCDocument approval workflow with review metadata.
     * Validates: Requirements 2.7, 2.11
     */
    public function test_kyc_approval_workflow_with_review_metadata(): void
    {
        // Create a user with pending KYC status
        $user = User::factory()->create([
            'kyc_status' => 'pending',
        ]);
        
        // Create a pending KYC document
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'submitted_at' => now()->subDays(2),
        ]);
        
        // Admin reviews and approves
        $admin = User::factory()->create();
        $reviewTime = now();
        
        $kycDocument->update([
            'status' => 'approved',
            'reviewed_at' => $reviewTime,
            'reviewed_by' => $admin->id,
        ]);
        
        // Verify all fields are updated correctly
        $kycDocument->refresh();
        $this->assertEquals('approved', $kycDocument->status);
        $this->assertNotNull($kycDocument->reviewed_at);
        $this->assertEquals($admin->id, $kycDocument->reviewed_by);
        $this->assertEquals('approved', $user->fresh()->kyc_status);
    }

    /**
     * Test KYCDocument rejection workflow with review metadata and reason.
     * Validates: Requirements 2.8, 2.11
     */
    public function test_kyc_rejection_workflow_with_review_metadata_and_reason(): void
    {
        // Create a user with pending KYC status
        $user = User::factory()->create([
            'kyc_status' => 'pending',
        ]);
        
        // Create a pending KYC document
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'submitted_at' => now()->subDays(1),
        ]);
        
        // Admin reviews and rejects
        $admin = User::factory()->create();
        $reviewTime = now();
        $rejectionReason = 'The document image is blurry and unreadable';
        
        $kycDocument->update([
            'status' => 'rejected',
            'rejection_reason' => $rejectionReason,
            'reviewed_at' => $reviewTime,
            'reviewed_by' => $admin->id,
        ]);
        
        // Verify all fields are updated correctly
        $kycDocument->refresh();
        $this->assertEquals('rejected', $kycDocument->status);
        $this->assertEquals($rejectionReason, $kycDocument->rejection_reason);
        $this->assertNotNull($kycDocument->reviewed_at);
        $this->assertEquals($admin->id, $kycDocument->reviewed_by);
        $this->assertEquals('rejected', $user->fresh()->kyc_status);
    }
}
