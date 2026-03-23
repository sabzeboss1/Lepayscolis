<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SetupController extends Controller
{
    /**
     * Check database status and run migrations/seeders if needed.
     * Protected by SETUP_TOKEN environment variable.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $setupToken = config('app.setup_token');

        if (!$setupToken || $request->header('X-Setup-Token') !== $setupToken) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $results = [
            'database_connection' => false,
            'migrations_run' => false,
            'seeders_run' => false,
            'tables' => [],
            'errors' => [],
        ];

        // Step 1: Test database connection
        try {
            DB::connection()->getPdo();
            $results['database_connection'] = true;
        } catch (\Exception $e) {
            $results['errors'][] = 'Database connection failed: ' . $e->getMessage();
            return response()->json($results, 500);
        }

        // Step 2: Determine strategy
        $fresh = $request->query('fresh') === 'true';
        $needsSeeders = !Schema::hasTable('users') || DB::table('users')->count() === 0;

        // Step 3: Run migrations
        try {
            if ($fresh) {
                // Drop all tables and re-run all migrations from scratch
                Artisan::call('migrate:fresh', ['--force' => true, '--seed' => true]);
                $results['migrations_run'] = true;
                $results['seeders_run'] = true;
                $results['migrations_output'] = Artisan::output();
                $results['strategy'] = 'fresh';
            } else {
                // Normal migrate - if tables already exist without migration tracking,
                // we first ensure the migrations table exists and mark existing as run
                if ($this->hasOrphanedTables()) {
                    $this->reconcileMigrations();
                    $results['reconciled'] = true;
                }

                Artisan::call('migrate', ['--force' => true]);
                $results['migrations_run'] = true;
                $results['migrations_output'] = Artisan::output();
                $results['strategy'] = 'incremental';
            }
        } catch (\Exception $e) {
            $results['errors'][] = 'Migrations failed: ' . $e->getMessage();
            return response()->json($results, 500);
        }

        // Step 4: Run seeders if not already done by fresh
        if (!$results['seeders_run'] && ($needsSeeders || $request->query('force_seed') === 'true')) {
            try {
                Artisan::call('db:seed', ['--force' => true]);
                $results['seeders_run'] = true;
                $results['seeders_output'] = Artisan::output();
            } catch (\Exception $e) {
                $results['errors'][] = 'Seeders failed: ' . $e->getMessage();
            }
        }

        // Step 5: List existing tables
        $results['tables'] = $this->getTableList();

        // Step 6: Generate app key if not set
        if (empty(config('app.key'))) {
            try {
                Artisan::call('key:generate', ['--force' => true]);
                $results['key_generated'] = true;
            } catch (\Exception $e) {
                $results['errors'][] = 'Key generation failed: ' . $e->getMessage();
            }
        }

        // Step 7: Link storage
        try {
            Artisan::call('storage:link', ['--force' => true]);
            $results['storage_linked'] = true;
        } catch (\Exception $e) {
            // Not critical, ignore
        }

        $status = empty($results['errors']) ? 200 : 207;
        return response()->json($results, $status);
    }

    /**
     * Health check endpoint - no auth required.
     */
    public function health(): JsonResponse
    {
        $status = ['status' => 'ok', 'timestamp' => now()->toISOString()];

        try {
            DB::connection()->getPdo();
            $status['database'] = 'connected';
            $status['tables_count'] = count($this->getTableList());
        } catch (\Exception $e) {
            $status['database'] = 'disconnected';
            $status['status'] = 'degraded';
        }

        return response()->json($status, $status['status'] === 'ok' ? 200 : 503);
    }

    /**
     * Check if there are tables in the DB but no migrations tracking table,
     * or if the migrations table is missing entries for existing tables.
     */
    private function hasOrphanedTables(): bool
    {
        $tables = $this->getTableList();

        if (empty($tables)) {
            return false;
        }

        // Tables exist but no migrations table = orphaned
        if (!Schema::hasTable('migrations')) {
            return true;
        }

        // Migrations table exists but is empty while other tables exist
        return DB::table('migrations')->count() === 0 && count($tables) > 1;
    }

    /**
     * Create the migrations table if needed and mark all existing migration files
     * as already run, so that `migrate` won't try to recreate existing tables.
     */
    private function reconcileMigrations(): void
    {
        // Ensure migrations table exists
        if (!Schema::hasTable('migrations')) {
            Artisan::call('migrate:install');
        }

        // Get all migration files
        $migrationPath = database_path('migrations');
        $files = glob($migrationPath . '/*.php');
        $batch = DB::table('migrations')->max('batch') ?? 0;
        $batch++;

        foreach ($files as $file) {
            $migrationName = pathinfo($file, PATHINFO_FILENAME);

            // Only insert if not already tracked
            $exists = DB::table('migrations')
                ->where('migration', $migrationName)
                ->exists();

            if (!$exists) {
                DB::table('migrations')->insert([
                    'migration' => $migrationName,
                    'batch' => $batch,
                ]);
            }
        }
    }

    private function getTableList(): array
    {
        try {
            $driver = DB::connection()->getDriverName();

            return match ($driver) {
                'mysql', 'mariadb' => array_map(
                    fn($t) => array_values((array) $t)[0],
                    DB::select('SHOW TABLES')
                ),
                'pgsql' => array_map(
                    fn($t) => $t->tablename,
                    DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
                ),
                'sqlite' => array_map(
                    fn($t) => $t->name,
                    DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
                ),
                default => [],
            };
        } catch (\Exception $e) {
            return [];
        }
    }
}
