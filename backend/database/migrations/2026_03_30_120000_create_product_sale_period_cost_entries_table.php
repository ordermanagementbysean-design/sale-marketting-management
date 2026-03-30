<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_sale_period_cost_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_sale_period_id')->constrained()->cascadeOnDelete();
            $table->decimal('ads_run_cost', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_sale_period_cost_entries');
    }
};
