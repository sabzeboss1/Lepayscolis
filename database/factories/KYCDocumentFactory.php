<?php

namespace Database\Factories;

use App\Models\KYCDocument;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\KYCDocument>
 */
class KYCDocumentFactory extends Factory
{
    protected $model = KYCDocument::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $documentType = $this->faker->randomElement(['passport', 'idCard', 'driversLicense']);
        
        return [
            'user_id' => User::factory(),
            'document_type' => $documentType,
            'document_front_url' => $this->faker->url(),
            'document_back_url' => $documentType === 'idCard' ? $this->faker->url() : null,
            'selfie_url' => $this->faker->url(),
            'status' => 'pending',
            'rejection_reason' => null,
            'submitted_at' => now(),
            'reviewed_at' => null,
            'reviewed_by' => null,
        ];
    }

    /**
     * Indicate that the KYC document is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'reviewed_at' => now(),
            'reviewed_by' => User::factory(),
        ]);
    }

    /**
     * Indicate that the KYC document is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'rejection_reason' => $this->faker->sentence(),
            'reviewed_at' => now(),
            'reviewed_by' => User::factory(),
        ]);
    }

    /**
     * Indicate that the KYC document is for a passport.
     */
    public function passport(): static
    {
        return $this->state(fn (array $attributes) => [
            'document_type' => 'passport',
            'document_back_url' => null,
        ]);
    }

    /**
     * Indicate that the KYC document is for an ID card.
     */
    public function idCard(): static
    {
        return $this->state(fn (array $attributes) => [
            'document_type' => 'idCard',
            'document_back_url' => $this->faker->url(),
        ]);
    }

    /**
     * Indicate that the KYC document is for a driver's license.
     */
    public function driversLicense(): static
    {
        return $this->state(fn (array $attributes) => [
            'document_type' => 'driversLicense',
            'document_back_url' => null,
        ]);
    }
}
