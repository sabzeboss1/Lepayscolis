<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FCMTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_update_fcm_token(): void
    {
        $user = User::factory()->create(['fcm_token' => null]);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/users/fcm-token', [
            'fcm_token' => 'new_fcm_token_123',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'FCM token updated successfully',
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'fcm_token' => 'new_fcm_token_123',
        ]);
    }

    public function test_user_can_update_existing_fcm_token(): void
    {
        $user = User::factory()->create(['fcm_token' => 'old_token']);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/users/fcm-token', [
            'fcm_token' => 'new_token',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'fcm_token' => 'new_token',
        ]);
    }

    public function test_fcm_token_update_requires_authentication(): void
    {
        $response = $this->postJson('/api/users/fcm-token', [
            'fcm_token' => 'test_token',
        ]);

        $response->assertStatus(401);
    }

    public function test_fcm_token_update_validates_required_field(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/users/fcm-token', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['fcm_token']);
    }

    public function test_fcm_token_update_validates_string_type(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/users/fcm-token', [
            'fcm_token' => 123,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['fcm_token']);
    }

    public function test_fcm_token_update_validates_max_length(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/users/fcm-token', [
            'fcm_token' => str_repeat('a', 256),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['fcm_token']);
    }
}
