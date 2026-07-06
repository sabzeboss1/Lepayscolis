<?php

namespace App\Enums;

enum BackupStatus: string
{
    case Pending    = 'pending';
    case InProgress = 'in_progress';
    case Completed  = 'completed';
    case Failed     = 'failed';
}
