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

        // Step 2: Check if migrations table exists (= already initialized)
        $needsMigrations = !Schema::hasTable('migrations');
        $needsSeeders = !Schema::hasTable('users') || DB::table('users')->count() === 0;

        // Step 3: Run migrations
        try {
            Artisan::call('migrate', ['--force' => true]);
            $results['migrations_run'] = true;
            $results['migrations_output'] = Artisan::output();
        } catch (\Exception $e) {
            $results['errors'][] = 'Migrations failed: ' . $e->getMessage();
            return response()->json($results, 500);
        }

        // Step 4: Run seeders only if DB was empty or explicitly requested
        if ($needsSeeders || $request->query('force_seed') === 'true') {
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
