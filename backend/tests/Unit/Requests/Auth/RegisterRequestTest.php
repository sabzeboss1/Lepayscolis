<?php

namespace Tests\Unit\Requests\Auth;

use App\Http\Requests\Auth\RegisterRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class RegisterRequestTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that valid registration data passes validation.
     */
    public function test_valid_registration_data_passes_validation(): void
    {
        $request = new RegisterRequest();
        $validator = Validator::make([
            'email' => 'test@example.com',
            'password' => 'password123',
            'name' => 'John Doe',
            'phone' => '+33612345678',
            'locale' => 'fr',
        ], $request->rules());

        $this->assertFalse($validator->fails());
    }

    /**
     * Test that email is required.
     */
    public function test_email_is_required(): void
    {
        $request = new RegisterRequest();
        $validator = Validator::make([
            'password' => 'password123',
            'name' => 'John Doe',
            'phone' => '+33612345678',
            'locale' => 'fr',
        ], $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    /**
     * Test that email must be valid RFC 5322 format.
     */
    public function test_email_must_be_valid_format(): void
    {
        $request = new RegisterRequest();
        $validator = Validator::make([
            'email' => 'invalid-email',
            'password' => 'password123',
            'name' => 'John Doe',
            'phone' => '+33612345678',
            'locale' => 'fr',
        ], $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    /**
     * Test that password is required.
     */
    public function test_password_is_required(): void
    {
        $request = new RegisterRequest();
        $validator = Validator::make([
            'email' => 'test@example.com',
            'name' => 'John Doe',
            'phone' => '+33612345678',
            'locale' => 'fr',
        ], $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    /**
     * Test that password must be at least 8 characters.
     */
    public function test_password_must_be_minimum_8_characters(): void
    {
        $request = new RegisterRequest();
        $validator = Validator::make([
            'email' => 'test@example.com',
            'password' => 'short',
            'name' => 'John Doe',
            'phone' => '+33612345678',
            'locale' => 'fr',
        ], $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    /**
     * Test that name is required.
     */
    public function test_name_is_required(): void
    {
        $request = new RegisterRequest();
        $validator = Validator::make([
            'email' => 'test@example.com',
            'password' => 'password123',
            'phone' => '+33612345678',
            'locale' => 'fr',
        ], $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    /**
     * Test that phone is required.
     */
    public function test_phone_is_required(): void
    {
        $request = new RegisterRequest();
        $validator = Validator::make([
            'email' => 'test@example.com',
            'password' => 'password123',
            'name' => 'John Doe',
            'locale' => 'fr',
        ], $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('phone', $validator->errors()->toArray());
    }

    /**
     * Test that phone must be in international format.
     */
    public function test_phone_must_be_international_format(): void
    {
        $request = new RegisterRequest();
        
        // Test invalid formats
        $invalidPhones = [
            '0612345678',      // Missing country code
            '612345678',       // Missing +
            '+33 6 12 34 56 78', // Contains spaces
            '+33-6-12-34-56-78', // Contains dashes
        ];

        foreach ($invalidPhones as $phone) {
            $validator = Validator::make([
                'email' => 'test@example.com',
                'password' => 'password123',
                'name' => 'John Doe',
                'phone' => $phone,
                'locale' => 'fr',
            ], $request->rules());

            $this->assertTrue($validator->fails(), "Phone {$phone} should fail validation");
            $this->assertArrayHasKey('phone', $validator->errors()->toArray());
        }

        // Test valid formats
        $validPhones = [
            '+33612345678',
            '+14155552671',
            '+442071838750',
        ];

        foreach ($validPhones as $phone) {
            $validator = Validator::make([
                'email' => 'test@example.com',
                'password' => 'password123',
                'name' => 'John Doe',
                'phone' => $phone,
                'locale' => 'fr',
            ], $request->rules());

            $this->assertFalse($validator->fails(), "Phone {$phone} should pass validation");
        }
    }

    /**
     * Test that locale is required.
     */
    public function test_locale_is_required(): void
    {
        $request = new RegisterRequest();
        $validator = Validator::make([
            'email' => 'test@example.com',
            'password' => 'password123',
            'name' => 'John Doe',
            'phone' => '+33612345678',
        ], $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('locale', $validator->errors()->toArray());
    }

    /**
     * Test that locale must be fr or en.
     */
    public function test_locale_must_be_fr_or_en(): void
    {
        $request = new RegisterRequest();
        
        // Test invalid locale
        $validator = Validator::make([
            'email' => 'test@example.com',
            'password' => 'password123',
            'name' => 'John Doe',
            'phone' => '+33612345678',
            'locale' => 'es',
        ], $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('locale', $validator->errors()->toArray());

        // Test valid locales
        foreach (['fr', 'en'] as $locale) {
            $validator = Validator::make([
                'email' => 'test@example.com',
                'password' => 'password123',
                'name' => 'John Doe',
                'phone' => '+33612345678',
                'locale' => $locale,
            ], $request->rules());

            $this->assertFalse($validator->fails(), "Locale {$locale} should pass validation");
        }
    }
}
