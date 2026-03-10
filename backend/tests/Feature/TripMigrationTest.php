<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TripMigrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that trips table exists with all required columns.
     */
    public function test_trips_table_has_all_required_columns(): void
    {
        // Verify table exists
        $this->assertTrue(Schema::hasTable('trips'));

        // Verify all required columns exist
        $columns = [
            'id',
            'traveler_id',
            'departure_city',
            'departure_country',
            'departure_date',
            'arrival_city',
            'arrival_country',
            'arrival_date',
            'available_capacity',
            'price_per_kg',
            'status',
            'travel_proof_url',
            'created_at',
            'updated_at',
            'deleted_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(
                Schema::hasColumn('trips', $column),
                "Column '{$column}' does not exist in trips table"
            );
        }
    }

    /**
     * Test that trips table has correct indexes.
     */
    public function test_trips_table_has_required_indexes(): void
    {
        $indexes = Schema::getIndexes('trips');
        $indexNames = array_column($indexes, 'name');

        // Check for route and date index
        $this->assertContains('trips_route_date_index', $indexNames);
        
        // Check for status and date index
        $this->assertContains('trips_status_date_index', $indexNames);
    }

    /**
     * Test that trips table has foreign key constraint to users.
     */
    public function test_trips_table_has_foreign_key_to_users(): void
    {
        $foreignKeys = Schema::getForeignKeys('trips');
        
        $hasTravelerForeignKey = false;
        foreach ($foreignKeys as $foreignKey) {
            if (in_array('traveler_id', $foreignKey['columns'])) {
                $hasTravelerForeignKey = true;
                $this->assertEquals('users', $foreignKey['foreign_table']);
                break;
            }
        }
        
        $this->assertTrue($hasTravelerForeignKey, 'Foreign key constraint on traveler_id does not exist');
    }
}
