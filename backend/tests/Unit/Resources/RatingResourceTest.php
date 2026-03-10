<?php

namespace Tests\Unit\Resources;

use App\Http\Resources\RatingResource;
use App\Models\Rating;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class RatingResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_resource_transforms_rating_correctly(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create();
        $shipment = Shipment::factory()->create();
        
        $rating = Rating::factory()->create([
            'from_user_id' => $fromUser->id,
            'to_user_id' => $toUser->id,
            'shipment_id' => $shipment->id,
            'rating' => 5,
            'comment' => 'Excellent!',
        ]);

        $resource = new RatingResource($rating);
        $request = Request::create('/');
        $array = $resource->toArray($request);

        $this->assertEquals($rating->id, $array['id']);
        $this->assertEquals($fromUser->id, $array['from_user_id']);
        $this->assertEquals($toUser->id, $array['to_user_id']);
        $this->assertEquals($shipment->id, $array['shipment_id']);
        $this->assertEquals(5, $array['rating']);
        $this->assertEquals('Excellent!', $array['comment']);
        $this->assertNotNull($array['created_at']);
        $this->assertNotNull($array['updated_at']);
    }

    public function test_resource_includes_relationships_when_loaded(): void
    {
        $rating = Rating::factory()->create();
        $rating->load('fromUser', 'toUser', 'shipment');

        $resource = new RatingResource($rating);
        $request = Request::create('/');
        $array = $resource->toArray($request);

        $this->assertArrayHasKey('from_user', $array);
        $this->assertArrayHasKey('to_user', $array);
        $this->assertArrayHasKey('shipment', $array);
    }

    public function test_resource_formats_dates_as_iso8601(): void
    {
        $rating = Rating::factory()->create();

        $resource = new RatingResource($rating);
        $request = Request::create('/');
        $array = $resource->toArray($request);

        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/',
            $array['created_at']
        );
    }

    public function test_resource_handles_null_comment(): void
    {
        $rating = Rating::factory()->create(['comment' => null]);

        $resource = new RatingResource($rating);
        $request = Request::create('/');
        $array = $resource->toArray($request);

        $this->assertNull($array['comment']);
    }
}
