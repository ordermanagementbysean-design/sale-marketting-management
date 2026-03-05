<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('unit')->default('cái');
            $table->decimal('purchase_price', 15, 2)->default(0);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('vat_percent', 5, 2)->default(0);
            $table->string('vat_code')->nullable();
            $table->unsignedInteger('weight_gram')->default(0);
            $table->unsignedTinyInteger('status')->default(1); // 0: disable, 1: đang kinh doanh
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
