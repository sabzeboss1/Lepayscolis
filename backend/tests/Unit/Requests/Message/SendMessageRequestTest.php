<?php

namespace Tests\Unit\Requests\Message;

use App\Http\Requests\Message\SendMessageRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class SendMessageRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_message_data_passes_validation(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $data = [
            'recipient_id' => $recipient->id,
            'content' => 'Hello, this is a test message.',
        ];

        $request = new SendMessageRequest();
        $request->setUserResolver(fn () => $sender);
        
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_recipient_id_is_required(): void
    {
        $sender = User::factory()->create();

        $data = [
            'content' => 'Hello',
        ];

        $request = new SendMessageRequest();
        $request->setUserResolver(fn () => $sender);
        
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('recipient_id', $validator->errors()->toArray());
    }

    public function test_recipient_id_must_exist(): void
    {
        $sender = User::factory()->create();

        $data = [
            'recipient_id' => 99999,
            'content' => 'Hello',
        ];

        $request = new SendMessageRequest();
        $request->setUserResolver(fn () => $sender);
        
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('recipient_id', $validator->errors()->toArray());
    }

    public function test_cannot_send_message_to_self(): void
    {
        $user = User::factory()->create();

        $data = [
            'recipient_id' => $user->id,
            'content' => 'Hello to myself',
        ];

        $request = new SendMessageRequest();
        $request->setUserResolver(fn () => $user);
        
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('recipient_id', $validator->errors()->toArray());
    }

    public function test_content_is_required(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $data = [
            'recipient_id' => $recipient->id,
        ];

        $request = new SendMessageRequest();
        $request->setUserResolver(fn () => $sender);
        
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('content', $validator->errors()->toArray());
    }

    public function test_content_must_be_string(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $data = [
            'recipient_id' => $recipient->id,
            'content' => 12345,
        ];

        $request = new SendMessageRequest();
        $request->setUserResolver(fn () => $sender);
        
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('content', $validator->errors()->toArray());
    }

    public function test_content_cannot_exceed_1000_characters(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $data = [
            'recipient_id' => $recipient->id,
            'content' => str_repeat('a', 1001),
        ];

        $request = new SendMessageRequest();
        $request->setUserResolver(fn () => $sender);
        
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('content', $validator->errors()->toArray());
    }

    public function test_content_can_be_exactly_1000_characters(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $data = [
            'recipient_id' => $recipient->id,
            'content' => str_repeat('a', 1000),
        ];

        $request = new SendMessageRequest();
        $request->setUserResolver(fn () => $sender);
        
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_conversation_id_is_optional(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $data = [
            'recipient_id' => $recipient->id,
            'content' => 'Hello',
        ];

        $request = new SendMessageRequest();
        $request->setUserResolver(fn () => $sender);
        
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_conversation_id_must_exist_if_provided(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $data = [
            'recipient_id' => $recipient->id,
            'content' => 'Hello',
            'conversation_id' => 'non-existent-uuid',
        ];

        $request = new SendMessageRequest();
        $request->setUserResolver(fn () => $sender);
        
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('conversation_id', $validator->errors()->toArray());
    }
}
