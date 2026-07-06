<?php

return [

    'backup' => [

        'name' => env('APP_NAME', 'lepayscolis'),

        'source' => [

            'files' => [
                'include' => [
                    storage_path(),
                ],
                'exclude' => [
                    storage_path('app/backups'),
                    storage_path('framework'),
                    storage_path('logs'),
                ],
                'follow_links' => false,
                'ignore_unreadable_directories' => false,
                'relative_path' => base_path(),
            ],

            'databases' => [env('DB_CONNECTION', 'sqlite')],
        ],

        'database_dump_compressor' => null,
        'database_dump_file_timestamp_format' => null,
        'database_dump_filename_base' => 'database',
        'database_dump_file_extension' => '',

        'destination' => [
            'filename_prefix' => 'lepayscolis-',
            'disks' => ['local'],
        ],

        'temporary_directory' => storage_path('app/backup-temp'),
        'password' => env('BACKUP_ARCHIVE_PASSWORD'),
        'encryption' => 'default',
        'tries' => 1,
        'retry_delay' => 0,
    ],

    'notifications' => [
        'notifications' => [
            // Disabled — we handle notifications manually in RunBackupJob
        ],
        'notifiable' => \Spatie\Backup\Notifications\Notifiable::class,
    ],

    'monitor_backups' => [],

    'cleanup' => [
        'strategy' => \Spatie\Backup\Tasks\Cleanup\Strategies\DefaultStrategy::class,
        'default_strategy' => [
            'keep_all_backups_for_days' => 7,
            'keep_daily_backups_for_days' => 16,
            'keep_weekly_backups_for_weeks' => 8,
            'keep_monthly_backups_for_months' => 4,
            'keep_yearly_backups_for_years' => 2,
            'delete_oldest_backups_when_using_more_megabytes_than' => 5000,
        ],
    ],

];
