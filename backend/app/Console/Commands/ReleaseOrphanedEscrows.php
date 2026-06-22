<?php

namespace App\Console\Commands;

use App\Models\Shipment;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReleaseOrphanedEscrows extends Command
{
    protected $signature = 'escrow:release-orphaned
                            {--dry-run : Affiche les cas sans effectuer de modifications}
                            {--shipment= : Traiter uniquement un shipment spécifique (UUID)}';

    protected $description = 'Libère les fonds en escrow pour les expéditions annulées dont le remboursement a échoué';

    public function __construct(private WalletService $walletService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $specificId = $this->option('shipment');

        $this->info($isDryRun ? '[DRY-RUN] Simulation — aucune modification ne sera effectuée.' : 'Libération des escrows orphelins...');
        $this->newLine();

        $query = Shipment::with(['sender.wallet'])
            ->where('status', 'cancelled')
            ->where('payment_status', 'escrowed');

        if ($specificId) {
            $query->where('id', $specificId);
        }

        $shipments = $query->get();

        if ($shipments->isEmpty()) {
            $this->info('Aucun escrow orphelin trouvé.');
            return Command::SUCCESS;
        }

        $this->info("Expéditions annulées avec fonds toujours bloqués : {$shipments->count()}");
        $this->newLine();

        $headers = ['Shipment ID', 'Sender', 'Montant bloqué', 'Devise', 'Créé le'];
        $rows = [];
        $toProcess = [];

        foreach ($shipments as $shipment) {
            $wallet = $shipment->sender?->wallet;

            if (!$wallet) {
                $this->warn("  [SKIP] Shipment #{$shipment->id} — wallet introuvable");
                continue;
            }

            $holdTx = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('reference_type', 'shipment')
                ->where('reference_id', $shipment->id)
                ->where('type', 'hold')
                ->first();

            if (!$holdTx) {
                $this->warn("  [SKIP] Shipment #{$shipment->id} — transaction hold introuvable (fonds peut-être jamais bloqués)");
                continue;
            }

            // Vérifie qu'une annulation n'a pas déjà été enregistrée
            $alreadyCancelled = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('reference_type', 'shipment')
                ->where('reference_id', $shipment->id)
                ->where('type', 'hold_cancelled')
                ->exists();

            if ($alreadyCancelled) {
                $this->warn("  [SKIP] Shipment #{$shipment->id} — hold_cancelled déjà enregistré (payment_status non mis à jour ?)");
                continue;
            }

            $rows[] = [
                $shipment->id,
                $shipment->sender->name ?? '—',
                number_format($holdTx->amount, 2),
                $wallet->currency_code ?? '?',
                $shipment->created_at->format('Y-m-d'),
            ];

            $toProcess[] = ['shipment' => $shipment, 'holdTx' => $holdTx, 'wallet' => $wallet];
        }

        if (empty($toProcess)) {
            $this->info('Aucun cas à traiter après vérifications.');
            return Command::SUCCESS;
        }

        $this->table($headers, $rows);
        $this->newLine();

        if ($isDryRun) {
            $this->info('[DRY-RUN] ' . count($toProcess) . ' cas seraient traités. Relancez sans --dry-run pour appliquer.');
            return Command::SUCCESS;
        }

        if (!$this->confirm('Confirmer la libération de ' . count($toProcess) . ' escrow(s) ?')) {
            $this->info('Opération annulée.');
            return Command::SUCCESS;
        }

        $released = 0;
        $failed = 0;

        foreach ($toProcess as ['shipment' => $shipment, 'holdTx' => $holdTx, 'wallet' => $wallet]) {
            try {
                DB::transaction(function () use ($shipment, $holdTx, $wallet) {
                    $this->walletService->cancelHold(
                        $wallet,
                        $holdTx->amount,
                        "Libération manuelle — expédition annulée #{$shipment->id}",
                        'shipment',
                        $shipment->id
                    );

                    $shipment->update(['payment_status' => 'refunded']);
                });

                $this->line("  [OK] Shipment #{$shipment->id} — {$holdTx->amount} {$wallet->currency_code} restitués à {$shipment->sender->name}");
                $released++;

                Log::info('Orphaned escrow released', [
                    'shipment_id' => $shipment->id,
                    'wallet_id'   => $wallet->id,
                    'amount'      => $holdTx->amount,
                    'currency'    => $wallet->currency_code,
                ]);
            } catch (\Exception $e) {
                $this->error("  [FAIL] Shipment #{$shipment->id} — {$e->getMessage()}");
                Log::error('Failed to release orphaned escrow', [
                    'shipment_id' => $shipment->id,
                    'error'       => $e->getMessage(),
                ]);
                $failed++;
            }
        }

        $this->newLine();
        $this->info("Terminé — {$released} libéré(s), {$failed} échec(s).");

        return $failed > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}
