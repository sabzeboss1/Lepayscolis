<?php

namespace App\Services\Admin;

use App\Models\AuditLog;

class AdminAuditService
{
    /**
     * Get audit logs with pagination and filters.
     *
     * @param array $filters
     * @param int $perPage
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getAuditLogs(array $filters = [], int $perPage = 50)
    {
        $query = AuditLog::with('admin:id,name,email');

        // Filter by admin
        if (isset($filters['admin_id'])) {
            $query->where('admin_id', $filters['admin_id']);
        }

        // Filter by action
        if (isset($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        // Filter by resource type
        if (isset($filters['resource_type'])) {
            $query->where('resource_type', $filters['resource_type']);
        }

        // Filter by resource ID
        if (isset($filters['resource_id'])) {
            $query->where('resource_id', $filters['resource_id']);
        }

        // Filter by date range
        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        // Search by resource ID
        if (isset($filters['search'])) {
            $query->where('resource_id', 'like', '%' . $filters['search'] . '%');
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Export audit logs to CSV.
     *
     * @param array $filters
     * @return array
     */
    public function exportAuditLogs(array $filters = []): array
    {
        $query = AuditLog::with('admin:id,name,email');

        // Apply same filters as getAuditLogs
        if (isset($filters['admin_id'])) {
            $query->where('admin_id', $filters['admin_id']);
        }
        if (isset($filters['action'])) {
            $query->where('action', $filters['action']);
        }
        if (isset($filters['resource_type'])) {
            $query->where('resource_type', $filters['resource_type']);
        }
        if (isset($filters['resource_id'])) {
            $query->where('resource_id', $filters['resource_id']);
        }
        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        // Generate CSV
        $csv = "ID,Admin,Action,Resource Type,Resource ID,IP Address,Before,After,Created At\n";
        
        foreach ($logs as $log) {
            $csv .= implode(',', [
                $log->id,
                '"' . ($log->admin->name ?? 'N/A') . '"',
                $log->action,
                $log->resource_type,
                $log->resource_id,
                $log->ip_address,
                '"' . str_replace('"', '""', json_encode($log->before)) . '"',
                '"' . str_replace('"', '""', json_encode($log->after)) . '"',
                $log->created_at->toIso8601String(),
            ]) . "\n";
        }

        // TODO: Store CSV file and return download URL
        $filename = "audit_logs_export_" . now()->format('Y-m-d_His') . '.csv';
        
        return [
            'status' => 'completed',
            'download_url' => "/admin/exports/{$filename}",
            'filename' => $filename,
            'record_count' => $logs->count(),
        ];
    }
}
