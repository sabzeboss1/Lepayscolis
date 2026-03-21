<?php

namespace App\Providers;

use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class MailConfigServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     *
     * Override Laravel's mail configuration with SMTP settings
     * stored in the platform_settings table (managed via admin panel).
     */
    public function boot(): void
    {
        static::applySmtpFromDatabase();
    }

    /**
     * Read SMTP settings from platform_settings DB and apply to Laravel mail config.
     * Can be called from anywhere (provider boot, queued jobs, etc.).
     */
    public static function applySmtpFromDatabase(): void
    {
        try {
            if (!Schema::hasTable('platform_settings')) {
                return;
            }
        } catch (\Exception $e) {
            return;
        }

        try {
            $smtpHost = PlatformSetting::get('smtp_host');

            // Only override if a host is configured in DB
            if (!$smtpHost) {
                return;
            }

            Config::set('mail.default', 'smtp');
            Config::set('mail.mailers.smtp.host', $smtpHost);

            $smtpPort = PlatformSetting::get('smtp_port');
            if ($smtpPort) {
                Config::set('mail.mailers.smtp.port', (int) $smtpPort);
            }

            $smtpUsername = PlatformSetting::get('smtp_username');
            if ($smtpUsername) {
                Config::set('mail.mailers.smtp.username', $smtpUsername);
            }

            $smtpPassword = PlatformSetting::get('smtp_password');
            if ($smtpPassword) {
                Config::set('mail.mailers.smtp.password', $smtpPassword);
            }

            $smtpEncryption = PlatformSetting::get('smtp_encryption');
            if ($smtpEncryption && $smtpEncryption !== 'none') {
                Config::set('mail.mailers.smtp.encryption', $smtpEncryption);
            } else {
                Config::set('mail.mailers.smtp.encryption', null);
            }

            $smtpFromAddress = PlatformSetting::get('smtp_from_address');
            if ($smtpFromAddress) {
                Config::set('mail.from.address', $smtpFromAddress);
            }

            $smtpFromName = PlatformSetting::get('smtp_from_name');
            if ($smtpFromName) {
                Config::set('mail.from.name', $smtpFromName);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to load SMTP settings from DB, using .env defaults', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
