<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Admin\AdminAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminExportController extends Controller
{
    protected AdminAnalyticsService $analyticsService;

    public function __construct(AdminAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function users(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status', 'kyc_status']);

        $query = User::query();

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (isset($filters['kyc_status'])) {
            $query->where('kyc_status', $filters['kyc_status']);
        }

        $users = $query->get();

        $columns = [
            'ID'                    => 'id',
            'Nom'                   => 'name',
            'Email'                 => 'email',
            'Téléphone'             => 'phone',
            'Rôle'                  => 'role',
            'Statut KYC'            => 'kyc_status',
            'Note'                  => 'rating',
            'Livraisons complétées' => 'completed_deliveries',
            'Recommandé'            => 'is_recommended',
            'Langue'                => 'locale',
            'Devise'                => 'currency_code',
        ];

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Utilisateurs');

        // --- Header row ---
        $col = 1;
        foreach (array_keys($columns) as $header) {
            $sheet->setCellValue([$col, 1], $header);
            $col++;
        }

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2563EB']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => ['bottom' => ['borderStyle' => Border::BORDER_THIN]],
        ];
        $sheet->getStyle([1, 1, count($columns), 1])->applyFromArray($headerStyle);

        // --- Data rows ---
        $row = 2;
        foreach ($users as $user) {
            $col = 1;
            foreach ($columns as $field) {
                $value = $user->{$field};

                if ($field === 'is_recommended') {
                    $value = $value ? 'Oui' : 'Non';
                }

                $sheet->setCellValue([$col, $row], $value);
                $col++;
            }
            $row++;
        }

        // --- Zebra striping ---
        $lastRow = $row - 1;
        for ($r = 2; $r <= $lastRow; $r++) {
            if ($r % 2 === 0) {
                $sheet->getStyle([1, $r, count($columns), $r])->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F1F5F9']],
                ]);
            }
        }

        // --- Auto-size columns ---
        foreach (range(1, count($columns)) as $c) {
            $sheet->getColumnDimensionByColumn($c)->setAutoSize(true);
        }

        $filename = 'utilisateurs_export_' . now()->format('Y-m-d') . '.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    public function trips(Request $request): StreamedResponse|JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status']);
        return $this->streamCsv('trips', $filters);
    }

    public function shipments(Request $request): StreamedResponse|JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status']);
        return $this->streamCsv('shipments', $filters);
    }

    public function payments(Request $request): StreamedResponse|JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status']);
        return $this->streamCsv('payments', $filters);
    }

    public function withdrawals(Request $request): StreamedResponse|JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status']);
        return $this->streamCsv('withdrawals', $filters);
    }

    /**
     * Stream CSV export as a download response.
     */
    private function streamCsv(string $dataType, array $filters): StreamedResponse|JsonResponse
    {
        $result = $this->analyticsService->exportToCSV($dataType, $filters);

        if ($result['status'] === 'queued') {
            return response()->json($result, 200);
        }

        $filename = $result['filename'];
        $csv = $result['csv'] ?? '';

        return response()->streamDownload(function () use ($csv) {
            echo $csv;
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function status(string $jobId): JsonResponse
    {
        return response()->json([
            'job_id' => $jobId,
            'status' => 'processing',
            'message' => 'Export is being processed',
        ], 200);
    }
}
