<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_ad_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_sale_period_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('ad_url', 500)->nullable();
            $table->string('ad_identifier', 255)->nullable();
            $table->unsignedInteger('clicks')->default(0);
            $table->decimal('ad_cost', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_ad_links');
    }
};
