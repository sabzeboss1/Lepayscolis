<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class WalletMigrationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function wallets_table_has_correct_structure(): void
    {
        $this->assertTrue(Schema::hasTable('wallets'));
        
        $columns = ['id', 'user_id', 'balance', 'created_at', 'updated_at'];
        foreach ($columns as $column) {
            $this->assertTrue(
                Schema::hasColumn('wallets', $column),
                "Column {$column} does not exist in wallets table"
            );
        }
    }

    /** @test */
    public function wallet_transactions_table_has_correct_structure(): void
    {
        $this->assertTrue(Schema::hasTable('wallet_transactions'));
        
        $columns = [
            'id', 'wallet_id', 'type', 'amount', 'description',
            'reference_type', 'reference_id', 'balance_after', 'created_at'
        ];
        foreach ($columns as $column) {
            $this->assertTrue(
                Schema::hasColumn('wallet_transactions', $column),
                "Column {$column} does not exist in wallet_transactions table"
            );
        }
    }

    /** @test */
    public function withdrawal_requests_table_has_correct_structure(): void
    {
        $this->assertTrue(Schema::hasTable('withdrawal_requests'));
        
        $columns = [
            'id', 'user_id', 'amount', 'fee', 'net_amount', 'status',
            'rejection_reason', 'approved_by', 'approved_at', 'completed_at',
            'created_at', 'updated_at'
        ];
        foreach ($columns as $column) {
            $this->assertTrue(
                Schema::hasColumn('withdrawal_requests', $column),
                "Column {$column} does not exist in withdrawal_requests table"
            );
        }
    }

    /** @test */
    public function wallet_audit_logs_table_has_correct_structure(): void
    {
        $this->assertTrue(Schema::hasTable('wallet_audit_logs'));
        
        $columns = [
            'id', 'admin_id', 'action', 'target_type', 'target_id',
            'reason', 'metadata', 'created_at'
        ];
        foreach ($columns as $column) {
            $this->assertTrue(
                Schema::hasColumn('wallet_audit_logs', $column),
                "Column {$column} does not exist in wallet_audit_logs table"
            );
        }
    }

    /** @test */
    public function all_wallet_tables_exist(): void
    {
        $tables = [
            'wallets',
            'wallet_transactions',
            'withdrawal_requests',
            'wallet_audit_logs'
        ];

        foreach ($tables as $table) {
            $this->assertTrue(
                Schema::hasTable($table),
                "Table {$table} does not exist"
            );
        }
    }
}
