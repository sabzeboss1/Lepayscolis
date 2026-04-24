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

        $providedToken = $request->header('X-Setup-Token') ?? $request->query('token');
        if (!$setupToken || $providedToken !== $setupToken) {
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
     * Execute a whitelisted Artisan command.
     * Protected by SETUP_TOKEN.
     */
    public function artisan(Request $request): JsonResponse
    {
        $setupToken = config('app.setup_token');

        if (!$setupToken || $request->header('X-Setup-Token') !== $setupToken) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $command = $request->input('command');

        if (!$command || !is_string($command)) {
            return response()->json(['message' => 'Missing "command" field'], 422);
        }

        // Whitelist of safe commands
        $allowed = [
            'migrate',
            'migrate:status',
            'migrate:fresh',
            'db:seed',
            'cache:clear',
            'config:clear',
            'config:cache',
            'route:clear',
            'route:cache',
            'view:clear',
            'view:cache',
            'event:clear',
            'event:cache',
            'optimize',
            'optimize:clear',
            'storage:link',
            'queue:restart',
            'schedule:list',
            'key:generate',
            'vendor:publish',
        ];

        // Parse command name (first word) from the input
        $parts = explode(' ', trim($command));
        $commandName = $parts[0];

        if (!in_array($commandName, $allowed)) {
            return response()->json([
                'message' => "Command \"{$commandName}\" is not allowed",
                'allowed' => $allowed,
            ], 403);
        }

        // Commands that support --force
        $forceableCommands = [
            'migrate', 'migrate:fresh', 'migrate:status',
            'db:seed', 'key:generate', 'storage:link',
            'config:cache', 'route:cache', 'view:cache',
            'event:cache', 'optimize',
        ];

        // Parse arguments: flags like --force, --seed, --class=SomeSeeder
        $arguments = in_array($commandName, $forceableCommands) ? ['--force' => true] : [];
        for ($i = 1; $i < count($parts); $i++) {
            $arg = $parts[$i];
            if (str_starts_with($arg, '--')) {
                $arg = ltrim($arg, '-');
                if (str_contains($arg, '=')) {
                    [$key, $val] = explode('=', $arg, 2);
                    $arguments["--{$key}"] = $val;
                } else {
                    $arguments["--{$arg}"] = true;
                }
            }
        }

        try {
            // Ensure all commands (including package commands) are registered
            $kernel = app(\Illuminate\Contracts\Console\Kernel::class);
            $kernel->bootstrap();

            $exitCode = Artisan::call($commandName, $arguments);
            $output = Artisan::output();

            return response()->json([
                'command' => $command,
                'exit_code' => $exitCode,
                'output' => trim($output),
            ], $exitCode === 0 ? 200 : 500);
        } catch (\Exception $e) {
            return response()->json([
                'command' => $command,
                'message' => $e->getMessage(),
            ], 500);
        }
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
