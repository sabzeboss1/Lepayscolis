<?php

namespace Tests\Unit\Requests\KYC;

use App\Http\Requests\KYC\SubmitKYCRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class SubmitKYCRequestTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('s3');
    }

    /** @test */
    public function it_validates_passport_document_type_with_required_files()
    {
        $request = new SubmitKYCRequest();
        
        $data = [
            'document_type' => 'passport',
        ];
        
        $files = [
            'document_front' => UploadedFile::fake()->image('front.jpg', 800, 600)->size(1024),
            'selfie' => UploadedFile::fake()->image('selfie.jpg', 800, 600)->size(1024),
        ];
        
        $validator = Validator::make(array_merge($data, $files), $request->rules());
        
        $this->assertFalse($validator->fails());
    }

    /** @test */
    public function it_validates_id_card_document_type_requires_document_back()
    {
        $request = new SubmitKYCRequest();
        
        $data = [
            'document_type' => 'idCard',
        ];
        
        $files = [
            'document_front' => UploadedFile::fake()->image('front.jpg', 800, 600)->size(1024),
            'document_back' => UploadedFile::fake()->image('back.jpg', 800, 600)->size(1024),
            'selfie' => UploadedFile::fake()->image('selfie.jpg', 800, 600)->size(1024),
        ];
        
        $validator = Validator::make(array_merge($data, $files), $request->rules());
        
        $this->assertFalse($validator->fails());
    }

    /** @test */
    public function it_fails_validation_when_id_card_missing_document_back()
    {
        $request = new SubmitKYCRequest();
        
        $data = [
            'document_type' => 'idCard',
        ];
        
        $files = [
            'document_front' => UploadedFile::fake()->image('front.jpg', 800, 600)->size(1024),
            'selfie' => UploadedFile::fake()->image('selfie.jpg', 800, 600)->size(1024),
        ];
        
        $validator = Validator::make(array_merge($data, $files), $request->rules());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('document_back', $validator->errors()->toArray());
    }

    /** @test */
    public function it_validates_drivers_license_document_type_with_required_files()
    {
        $request = new SubmitKYCRequest();
        
        $data = [
            'document_type' => 'driversLicense',
        ];
        
        $files = [
            'document_front' => UploadedFile::fake()->image('front.jpg', 800, 600)->size(1024),
            'selfie' => UploadedFile::fake()->image('selfie.jpg', 800, 600)->size(1024),
        ];
        
        $validator = Validator::make(array_merge($data, $files), $request->rules());
        
        $this->assertFalse($validator->fails());
    }

    /** @test */
    public function it_fails_validation_when_document_type_is_invalid()
    {
        $request = new SubmitKYCRequest();
        
        $data = [
            'document_type' => 'invalidType',
        ];
        
        $files = [
            'document_front' => UploadedFile::fake()->image('front.jpg', 800, 600)->size(1024),
            'selfie' => UploadedFile::fake()->image('selfie.jpg', 800, 600)->size(1024),
        ];
        
        $validator = Validator::make(array_merge($data, $files), $request->rules());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('document_type', $validator->errors()->toArray());
    }

    /** @test */
    public function it_fails_validation_when_document_front_is_missing()
    {
        $request = new SubmitKYCRequest();
        
        $data = [
            'document_type' => 'passport',
        ];
        
        $files = [
            'selfie' => UploadedFile::fake()->image('selfie.jpg', 800, 600)->size(1024),
        ];
        
        $validator = Validator::make(array_merge($data, $files), $request->rules());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('document_front', $validator->errors()->toArray());
    }

    /** @test */
    public function it_fails_validation_when_selfie_is_missing()
    {
        $request = new SubmitKYCRequest();
        
        $data = [
            'document_type' => 'passport',
        ];
        
        $files = [
            'document_front' => UploadedFile::fake()->image('front.jpg', 800, 600)->size(1024),
        ];
        
        $validator = Validator::make(array_merge($data, $files), $request->rules());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('selfie', $validator->errors()->toArray());
    }

    /** @test */
    public function it_fails_validation_when_file_type_is_invalid()
    {
        $request = new SubmitKYCRequest();
        
        $data = [
            'document_type' => 'passport',
        ];
        
        $files = [
            'document_front' => UploadedFile::fake()->create('front.txt', 1024),
            'selfie' => UploadedFile::fake()->image('selfie.jpg', 800, 600)->size(1024),
        ];
        
        $validator = Validator::make(array_merge($data, $files), $request->rules());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('document_front', $validator->errors()->toArray());
    }

    /** @test */
    public function it_fails_validation_when_file_size_exceeds_5mb()
    {
        $request = new SubmitKYCRequest();
        
        $data = [
            'document_type' => 'passport',
        ];
        
        $files = [
            'document_front' => UploadedFile::fake()->image('front.jpg', 800, 600)->size(6000), // 6MB
            'selfie' => UploadedFile::fake()->image('selfie.jpg', 800, 600)->size(1024),
        ];
        
        $validator = Validator::make(array_merge($data, $files), $request->rules());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('document_front', $validator->errors()->toArray());
    }

    /** @test */
    public function it_accepts_pdf_files()
    {
        $request = new SubmitKYCRequest();
        
        $data = [
            'document_type' => 'passport',
        ];
        
        $files = [
            'document_front' => UploadedFile::fake()->create('front.pdf', 1024, 'application/pdf'),
            'selfie' => UploadedFile::fake()->image('selfie.jpg', 800, 600)->size(1024),
        ];
        
        $validator = Validator::make(array_merge($data, $files), $request->rules());
        
        $this->assertFalse($validator->fails());
    }

    /** @test */
    public function it_accepts_png_files()
    {
        $request = new SubmitKYCRequest();
        
        $data = [
            'document_type' => 'passport',
        ];
        
        $files = [
            'document_front' => UploadedFile::fake()->image('front.png', 800, 600)->size(1024),
            'selfie' => UploadedFile::fake()->image('selfie.png', 800, 600)->size(1024),
        ];
        
        $validator = Validator::make(array_merge($data, $files), $request->rules());
        
        $this->assertFalse($validator->fails());
    }
}
