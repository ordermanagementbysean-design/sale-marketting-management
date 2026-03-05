<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('connected_account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_ad_link_id')->nullable()->constrained()->nullOnDelete();
            $table->string('external_id');
            $table->string('source');
            $table->string('customer_name')->nullable();
            $table->string('phone')->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->string('status')->nullable();
            $table->timestamps();
            $table->unique(['company_id', 'source', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
