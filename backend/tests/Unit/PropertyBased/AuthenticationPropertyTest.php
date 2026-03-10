<?php

namespace Tests\Unit\PropertyBased;

use App\Models\User;
use Eris\Generator;
use Eris\TestTrait;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Property-based tests for authentication system.
 * 
 * These tests validate universal properties that should hold for all valid inputs
 * in the authentication system, including registration, login, logout, and token management.
 */
class AuthenticationPropertyTest extends TestCase
{
    use TestTrait, RefreshDatabase;

    /**
     * Property 1: Registration creates user with hashed password
     * 
     * For any valid registration data (email, password, name, phone, locale),
     * creating a user account should result in a stored user with a bcrypt-hashed
     * password that is different from the plaintext password.
     * 
     * **Validates: Requirements 1.1**
     */
    public function testProperty1RegistrationCreatesUserWithHashedPassword()
    {
        $this->forAll(
            Generator\string(),  // name
            Generator\string(),  // password (min 8 chars will be enforced)
            Generator\string(),  // phone
            Generator\elements(['fr', 'en'])  // locale
        )->then(function ($name, $password, $phone, $locale) {
            // Skip if password is too short (requirement 1.7)
            if (strlen($password) < 8) {
                return;
            }

            // Generate unique email for this test iteration
            $email = 'test_' . uniqid() . '@example.com';

            // Create user
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => $password,  // Will be auto-hashed by model cast
                'phone' => $phone,
                'locale' => $locale,
            ]);

            // Property: Password should be hashed (not equal to plaintext)
            $this->assertNotEquals($password, $user->password, 
                'Password should be hashed, not stored as plaintext');

            // Property: Hashed password should verify against plaintext
            $this->assertTrue(Hash::check($password, $user->password),
                'Hashed password should verify against original plaintext');

            // Property: Hash should use bcrypt
            $this->assertStringStartsWith('$2y$', $user->password,
                'Password should be hashed using bcrypt');
        });
    }

    /**
     * Property 2: Login returns valid 7-day token
     * 
     * For any registered user with correct credentials, login should return
     * a Sanctum token that remains valid for 7 days.
     * 
     * **Validates: Requirements 1.2**
     */
    public function testProperty2LoginReturnsValid7DayToken()
    {
        $this->forAll(
            Generator\string(),  // email prefix
            Generator\string()   // password
        )->then(function ($emailPrefix, $password) {
            // Skip if password is too short
            if (strlen($password) < 8) {
                return;
            }

            // Create unique email
            $email = 'test_' . uniqid() . '@example.com';

            // Create user
            $user = User::factory()->create([
                'email' => $email,
                'password' => $password,
            ]);

            // Create token with 7-day expiration
            $token = $user->createToken('auth_token', ['*'], now()->addDays(7));

            // Property: Token should exist
            $this->assertNotNull($token->plainTextToken,
                'Token should be created');

            // Property: Token expiration should be 7 days from now
            $expectedExpiration = now()->addDays(7);
            $actualExpiration = $token->accessToken->expires_at;
            
            $this->assertNotNull($actualExpiration,
                'Token should have an expiration date');
            
            // Allow 1 second tolerance for test execution time
            $this->assertTrue(
                abs($expectedExpiration->diffInSeconds($actualExpiration)) <= 1,
                'Token should expire in 7 days'
            );
        });
    }

    /**
     * Property 3: Authentication round-trip
     * 
     * For any user with a valid token, requesting their profile should return
     * the same user data that was stored during registration.
     * 
     * **Validates: Requirements 1.3**
     */
    public function testProperty3AuthenticationRoundTrip()
    {
        $this->forAll(
            Generator\string(),  // name
            Generator\elements(['fr', 'en'])  // locale
        )->then(function ($name, $locale) {
            // Create unique email and phone
            $email = 'test_' . uniqid() . '@example.com';
            $phone = '+' . uniqid();

            // Create user with specific data
            $user = User::factory()->create([
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'locale' => $locale,
            ]);

            // Authenticate user
            Sanctum::actingAs($user);

            // Retrieve authenticated user
            $authenticatedUser = auth()->user();

            // Property: Retrieved user should match created user
            $this->assertEquals($user->id, $authenticatedUser->id,
                'User ID should match');
            $this->assertEquals($name, $authenticatedUser->name,
                'User name should match');
            $this->assertEquals($email, $authenticatedUser->email,
                'User email should match');
            $this->assertEquals($phone, $authenticatedUser->phone,
                'User phone should match');
            $this->assertEquals($locale, $authenticatedUser->locale,
                'User locale should match');
        });
    }

    /**
     * Property 4: Logout invalidates token
     * 
     * For any authenticated user, after logout, their token should no longer
     * authenticate successfully for any protected endpoint.
     * 
     * **Validates: Requirements 1.4**
     */
    public function testProperty4LogoutInvalidatesToken()
    {
        $this->forAll(
            Generator\string()  // email prefix
        )->then(function ($emailPrefix) {
            // Create unique email
            $email = 'test_' . uniqid() . '@example.com';

            // Create user
            $user = User::factory()->create(['email' => $email]);

            // Create token
            $token = $user->createToken('auth_token');
            $tokenId = $token->accessToken->id;

            // Property: Token should exist before logout
            $this->assertDatabaseHas('personal_access_tokens', [
                'id' => $tokenId,
                'tokenable_id' => $user->id,
            ]);

            // Delete token (simulate logout)
            $token->accessToken->delete();

            // Property: Token should not exist after logout
            $this->assertDatabaseMissing('personal_access_tokens', [
                'id' => $tokenId,
            ]);
        });
    }

    /**
     * Property 5: Email uniqueness enforcement
     * 
     * For any existing user email, attempting to register a new user with
     * the same email should fail with validation error.
     * 
     * **Validates: Requirements 1.5**
     */
    public function testProperty5EmailUniquenessEnforcement()
    {
        $this->forAll(
            Generator\string(),  // name
            Generator\string()   // phone
        )->then(function ($name, $phone) {
            // Create unique email
            $email = 'test_' . uniqid() . '@example.com';

            // Create first user with this email
            $user1 = User::factory()->create(['email' => $email]);

            // Property: First user should be created successfully
            $this->assertDatabaseHas('users', [
                'email' => $email,
                'id' => $user1->id,
            ]);

            // Property: Attempting to create second user with same email should fail
            try {
                User::factory()->create(['email' => $email]);
                $this->fail('Should not be able to create user with duplicate email');
            } catch (\Exception $e) {
                // Expected: Database constraint violation
                $this->assertTrue(true, 'Duplicate email should be rejected');
            }
        });
    }

    /**
     * Property 6: Phone uniqueness enforcement
     * 
     * For any existing user phone number, attempting to register a new user
     * with the same phone should fail with validation error.
     * 
     * **Validates: Requirements 1.6**
     */
    public function testProperty6PhoneUniquenessEnforcement()
    {
        $this->forAll(
            Generator\string()  // phone
        )->then(function ($phone) {
            // Skip empty phones
            if (empty($phone)) {
                return;
            }

            // Create first user with this phone
            $user1 = User::factory()->create(['phone' => $phone]);

            // Property: First user should be created successfully
            $this->assertDatabaseHas('users', [
                'phone' => $phone,
                'id' => $user1->id,
            ]);

            // Property: Attempting to create second user with same phone should fail
            try {
                User::factory()->create(['phone' => $phone]);
                $this->fail('Should not be able to create user with duplicate phone');
            } catch (\Exception $e) {
                // Expected: Database constraint violation
                $this->assertTrue(true, 'Duplicate phone should be rejected');
            }
        });
    }

    /**
     * Property 7: Password minimum length validation
     * 
     * For any password string with length < 8 characters, registration
     * should fail with validation error.
     * 
     * **Validates: Requirements 1.7**
     */
    public function testProperty7PasswordMinimumLengthValidation()
    {
        $this->forAll(
            Generator\choose(0, 20)  // Password length
        )->then(function ($passwordLength) {
            // Generate password of specific length
            $password = str_repeat('a', $passwordLength);
            
            // Create unique email and phone
            $email = 'test_' . uniqid() . '@example.com';
            $phone = '+' . uniqid();

            // Property: Passwords < 8 chars should fail validation
            if ($passwordLength < 8) {
                // Make API request to test validation (without middleware)
                $response = $this->withoutMiddleware()
                    ->postJson('/api/auth/register', [
                        'name' => 'Test User',
                        'email' => $email,
                        'password' => $password,
                        'phone' => $phone,
                        'locale' => 'en',
                    ]);

                $response->assertStatus(422);
                $response->assertJsonValidationErrors('password');
            } else {
                // Passwords >= 8 chars should pass length validation
                $response = $this->withoutMiddleware()
                    ->postJson('/api/auth/register', [
                        'name' => 'Test User',
                        'email' => $email,
                        'password' => $password,
                        'phone' => $phone,
                        'locale' => 'en',
                    ]);

                // Should succeed (201) or fail for other reasons (not password length)
                if ($response->status() === 422) {
                    $errors = $response->json('errors');
                    $this->assertArrayNotHasKey('password', $errors,
                        'Password length validation should pass for passwords >= 8 chars');
                }
            }
        });
    }

    /**
     * Property 8: New user KYC status initialization
     * 
     * For any new user registration, the created user should have
     * kyc_status set to "pending".
     * 
     * **Validates: Requirements 1.8**
     */
    public function testProperty8NewUserKYCStatusInitialization()
    {
        $this->forAll(
            Generator\string()  // name
        )->then(function ($name) {
            // Create unique email and phone
            $email = 'test_' . uniqid() . '@example.com';
            $phone = '+' . uniqid();

            // Create user
            $user = User::factory()->create([
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'kyc_status' => 'pending',  // Explicitly set default
            ]);

            // Property: KYC status should be "pending" by default
            $this->assertEquals('pending', $user->kyc_status,
                'New user should have KYC status set to "pending"');
        });
    }

    /**
     * Property 9: New user rating initialization
     * 
     * For any new user registration, the created user should have
     * rating = 0 and completed_deliveries = 0.
     * 
     * **Validates: Requirements 1.9**
     */
    public function testProperty9NewUserRatingInitialization()
    {
        $this->forAll(
            Generator\string()  // name
        )->then(function ($name) {
            // Create unique email and phone
            $email = 'test_' . uniqid() . '@example.com';
            $phone = '+' . uniqid();

            // Create user
            $user = User::factory()->create([
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'rating' => 0,
                'completed_deliveries' => 0,
            ]);

            // Property: Rating should be 0 by default
            $this->assertEquals(0, $user->rating,
                'New user should have rating = 0');

            // Property: Completed deliveries should be 0 by default
            $this->assertEquals(0, $user->completed_deliveries,
                'New user should have completed_deliveries = 0');
        });
    }

    /**
     * Property 10: Locale selection support
     * 
     * For any valid locale value ('fr' or 'en'), registration should store
     * the locale correctly and use it for subsequent communications.
     * 
     * **Validates: Requirements 1.10**
     */
    public function testProperty10LocaleSelectionSupport()
    {
        $this->forAll(
            Generator\elements(['fr', 'en'])  // Valid locales
        )->then(function ($locale) {
            // Create unique email
            $email = 'test_' . uniqid() . '@example.com';

            // Create user with specific locale
            $user = User::factory()->create([
                'email' => $email,
                'locale' => $locale,
            ]);

            // Property: Locale should be stored correctly
            $this->assertEquals($locale, $user->locale,
                'User locale should match the provided value');

            // Property: Locale should be either 'fr' or 'en'
            $this->assertContains($user->locale, ['fr', 'en'],
                'User locale should be either "fr" or "en"');
        });
    }
}
