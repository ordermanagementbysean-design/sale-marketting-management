<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->foreignId('connected_account_id')->nullable()->after('company_id')->constrained()->nullOnDelete();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['external_id']);
            $table->unique(['company_id', 'source', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['company_id', 'source', 'external_id']);
            $table->unique('external_id');
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['connected_account_id']);
            $table->dropForeign(['company_id']);
        });
    }
};
