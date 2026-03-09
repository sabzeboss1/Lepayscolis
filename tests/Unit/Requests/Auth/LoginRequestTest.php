<?php

namespace Tests\Unit\Requests\Auth;

use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class LoginRequestTest extends TestCase
{
    /**
     * Test that valid login data passes validation.
     */
    public function test_valid_login_data_passes_validation(): void
    {
        $request = new LoginRequest();
        $validator = Validator::make([
            'email' => 'test@example.com',
            'password' => 'password123',
        ], $request->rules());

        $this->assertFalse($validator->fails());
    }

    /**
     * Test that email is required.
     */
    public function test_email_is_required(): void
    {
        $request = new LoginRequest();
        $validator = Validator::make([
            'password' => 'password123',
        ], $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    /**
     * Test that email must be valid format.
     */
    public function test_email_must_be_valid_format(): void
    {
        $request = new LoginRequest();
        $validator = Validator::make([
            'email' => 'invalid-email',
            'password' => 'password123',
        ], $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    /**
     * Test that password is required.
     */
    public function test_password_is_required(): void
    {
        $request = new LoginRequest();
        $validator = Validator::make([
            'email' => 'test@example.com',
        ], $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    /**
     * Test that password can be any length (no minimum for login).
     */
    public function test_password_accepts_any_length(): void
    {
        $request = new LoginRequest();
        $validator = Validator::make([
            'email' => 'test@example.com',
            'password' => 'a',
        ], $request->rules());

        $this->assertFalse($validator->fails());
    }
}
