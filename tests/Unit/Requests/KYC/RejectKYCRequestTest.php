<?php

namespace Tests\Unit\Requests\KYC;

use App\Http\Requests\KYC\RejectKYCRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class RejectKYCRequestTest extends TestCase
{
    /** @test */
    public function it_validates_rejection_reason_is_required()
    {
        $request = new RejectKYCRequest();
        
        $data = [];
        
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('rejection_reason', $validator->errors()->toArray());
    }

    /** @test */
    public function it_validates_rejection_reason_minimum_length()
    {
        $request = new RejectKYCRequest();
        
        $data = [
            'rejection_reason' => 'Short',
        ];
        
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('rejection_reason', $validator->errors()->toArray());
    }

    /** @test */
    public function it_validates_rejection_reason_maximum_length()
    {
        $request = new RejectKYCRequest();
        
        $data = [
            'rejection_reason' => str_repeat('a', 1001),
        ];
        
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('rejection_reason', $validator->errors()->toArray());
    }

    /** @test */
    public function it_accepts_valid_rejection_reason()
    {
        $request = new RejectKYCRequest();
        
        $data = [
            'rejection_reason' => 'The document provided is not clear enough to verify your identity.',
        ];
        
        $validator = Validator::make($data, $request->rules());
        
        $this->assertFalse($validator->fails());
    }

    /** @test */
    public function it_accepts_rejection_reason_at_minimum_length()
    {
        $request = new RejectKYCRequest();
        
        $data = [
            'rejection_reason' => '1234567890', // Exactly 10 characters
        ];
        
        $validator = Validator::make($data, $request->rules());
        
        $this->assertFalse($validator->fails());
    }

    /** @test */
    public function it_accepts_rejection_reason_at_maximum_length()
    {
        $request = new RejectKYCRequest();
        
        $data = [
            'rejection_reason' => str_repeat('a', 1000), // Exactly 1000 characters
        ];
        
        $validator = Validator::make($data, $request->rules());
        
        $this->assertFalse($validator->fails());
    }
}
