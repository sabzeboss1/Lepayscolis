<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('backup:schedule-check')->everyFiveMinutes();
Schedule::command('backup:clean-old')->dailyAt('03:00');
Schedule::command('trips:complete-expired')->dailyAt('00:30');
