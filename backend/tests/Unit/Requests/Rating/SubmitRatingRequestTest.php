<?php

namespace Tests\Unit\Requests\Rating;

use App\Http\Requests\Rating\SubmitRatingRequest;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class SubmitRatingRequestTest extends TestCase
{
    use RefreshDatabase;

    private function makeRequest(array $data, ?User $user = null): SubmitRatingRequest
    {
        $request = new SubmitRatingRequest();
        $request->setContainer(app());
        $request->replace($data);
        
        if ($user) {
            $request->setUserResolver(fn() => $user);
        }
        
        return $request;
    }

    public function test_validates_required_fields(): void
    {
        $request = $this->makeRequest([]);
        $validator = Validator::make($request->all(), $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('to_user_id'));
        $this->assertTrue($validator->errors()->has('shipment_id'));
        $this->assertTrue($validator->errors()->has('rating'));
    }

    public function test_validates_rating_is_integer(): void
    {
        $user = User::factory()->create();
        $shipment = Shipment::factory()->create(['status' => 'delivered']);
        
        $request = $this->makeRequest([
            'to_user_id' => $user->id,
            'shipment_id' => $shipment->id,
            'rating' => 'not-a-number',
        ]);
        
        $validator = Validator::make($request->all(), $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('rating'));
    }

    public function test_validates_rating_minimum_value(): void
    {
        $user = User::factory()->create();
        $shipment = Shipment::factory()->create(['status' => 'delivered']);
        
        $request = $this->makeRequest([
            'to_user_id' => $user->id,
            'shipment_id' => $shipment->id,
            'rating' => 0,
        ]);
        
        $validator = Validator::make($request->all(), $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('rating'));
    }

    public function test_validates_rating_maximum_value(): void
    {
        $user = User::factory()->create();
        $shipment = Shipment::factory()->create(['status' => 'delivered']);
        
        $request = $this->makeRequest([
            'to_user_id' => $user->id,
            'shipment_id' => $shipment->id,
            'rating' => 6,
        ]);
        
        $validator = Validator::make($request->all(), $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('rating'));
    }

    public function test_validates_comment_maximum_length(): void
    {
        $user = User::factory()->create();
        $shipment = Shipment::factory()->create(['status' => 'delivered']);
        
        $request = $this->makeRequest([
            'to_user_id' => $user->id,
            'shipment_id' => $shipment->id,
            'rating' => 5,
            'comment' => str_repeat('a', 501),
        ]);
        
        $validator = Validator::make($request->all(), $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('comment'));
    }

    public function test_accepts_valid_rating_data(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'status' => 'delivered',
        ]);
        
        $request = $this->makeRequest([
            'to_user_id' => $traveler->id,
            'shipment_id' => $shipment->id,
            'rating' => 5,
            'comment' => 'Great service!',
        ], $sender);
        
        $validator = Validator::make($request->all(), $request->rules());
        $request->withValidator($validator);

        $this->assertTrue($validator->passes());
    }

    public function test_comment_is_optional(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'status' => 'delivered',
        ]);
        
        $request = $this->makeRequest([
            'to_user_id' => $traveler->id,
            'shipment_id' => $shipment->id,
            'rating' => 4,
        ], $sender);
        
        $validator = Validator::make($request->all(), $request->rules());
        $request->withValidator($validator);

        $this->assertTrue($validator->passes());
    }
}
