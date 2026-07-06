<?php

namespace App\Console\Commands;

use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Console\Command;

class BackupInit extends Command
{
    protected $signature = 'backup:init
                            {--email= : Email du super_admin à autoriser (sinon interactif)}';

    protected $description = 'Initialise les paramètres de sauvegarde et autorise un super_admin à accéder à la section Backups';

    public function handle(): int
    {
        $this->info('Initialisation de la fonctionnalité de sauvegarde...');
        $this->newLine();

        // 1. List available super_admins
        $superAdmins = User::where('role', 'super_admin')->get(['id', 'name', 'email']);

        if ($superAdmins->isEmpty()) {
            $this->error('Aucun super_admin trouvé en base de données. Créez-en un d\'abord.');
            return Command::FAILURE;
        }

        // 2. Pick email
        $email = $this->option('email');

        if (!$email) {
            $this->info('Super administrateurs disponibles :');
            $this->table(['ID', 'Nom', 'Email'], $superAdmins->map(fn ($u) => [$u->id, $u->name, $u->email]));
            $this->newLine();

            $email = $this->choice(
                'Quel super_admin autoriser pour les sauvegardes ?',
                $superAdmins->pluck('email')->toArray()
            );
        }

        // Validate email belongs to a super_admin
        $user = User::where('email', $email)->where('role', 'super_admin')->first();
        if (!$user) {
            $this->error("L'email « {$email} » ne correspond à aucun super_admin.");
            return Command::FAILURE;
        }

        // 3. Merge with existing emails (avoid duplicates)
        $existing = PlatformSetting::get('backup_notify_email', '');
        $existingEmails = array_filter(array_map('trim', explode(',', $existing)));

        if (in_array($email, $existingEmails)) {
            $this->warn("L'email « {$email} » est déjà autorisé.");
        } else {
            $existingEmails[] = $email;
            PlatformSetting::set('backup_notify_email', implode(', ', $existingEmails));
            $this->info("Email « {$email} » ajouté à backup_notify_email.");
        }

        // 4. Seed default backup settings if not already set
        $defaults = [
            'backup_enabled'            => 'false',
            'backup_schedule_frequency' => 'daily',
            'backup_schedule_time'      => '02:00',
            'backup_schedule_day'       => '1',
            'backup_include_files'      => 'true',
            'backup_include_db'         => 'true',
            'backup_retention_days'     => '30',
            'backup_max_count'          => '10',
            'google_drive_client_id'    => '',
            'google_drive_client_secret'=> '',
            'google_drive_refresh_token'=> '',
            'google_drive_folder_name'  => 'LePaysExpressColis-Backups',
            'google_drive_folder_id'    => '',
            'google_drive_connected'    => false,
        ];

        $seeded = 0;
        foreach ($defaults as $key => $value) {
            if (PlatformSetting::get($key) === null) {
                PlatformSetting::set($key, $value);
                $seeded++;
            }
        }

        $this->newLine();
        if ($seeded > 0) {
            $this->info("{$seeded} paramètre(s) par défaut créé(s) dans platform_settings.");
        } else {
            $this->info('Tous les paramètres par défaut existent déjà.');
        }

        $this->newLine();
        $this->info('Initialisation terminée. Accédez à /admin/backups dans le dashboard.');

        return Command::SUCCESS;
    }
}
