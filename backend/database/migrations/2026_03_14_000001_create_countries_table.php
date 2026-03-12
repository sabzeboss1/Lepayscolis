<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->string('code', 2)->unique()->comment('ISO 3166-1 alpha-2');
            $table->string('name_en');
            $table->string('name_fr');
            $table->string('phone_code', 10)->comment('e.g. +33');
            $table->string('default_currency_code', 3)->nullable();
            $table->string('default_locale', 5)->default('fr');
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();

            $table->foreign('default_currency_code')
                  ->references('code')->on('currencies')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};
