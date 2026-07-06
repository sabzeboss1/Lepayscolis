<?php

namespace App\Models;

use App\Enums\BackupStatus;
use App\Enums\BackupType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Backup extends Model
{
    protected $fillable = [
        'file_name',
        'file_size',
        'disk',
        'google_drive_file_id',
        'status',
        'type',
        'error_message',
        'started_at',
        'completed_at',
        'triggered_by',
    ];

    protected $appends = ['formatted_file_size'];

    protected $casts = [
        'status'       => BackupStatus::class,
        'type'         => BackupType::class,
        'file_size'    => 'integer',
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function triggeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }

    public function scopeRecent($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    public function markInProgress(): void
    {
        $this->update([
            'status'     => BackupStatus::InProgress,
            'started_at' => now(),
        ]);
    }

    public function markCompleted(int $fileSize, ?string $driveFileId = null): void
    {
        $this->update([
            'status'               => BackupStatus::Completed,
            'file_size'            => $fileSize,
            'google_drive_file_id' => $driveFileId,
            'completed_at'         => now(),
        ]);
    }

    public function markFailed(string $error): void
    {
        $this->update([
            'status'        => BackupStatus::Failed,
            'error_message' => $error,
            'completed_at'  => now(),
        ]);
    }

    public function getFormattedFileSizeAttribute(): string
    {
        if (!$this->file_size) {
            return '—';
        }

        $bytes = $this->file_size;

        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' Go';
        }
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' Mo';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' Ko';
        }

        return $bytes . ' octets';
    }
}
