<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_sale_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->date('start_at');
            $table->date('end_at');
            $table->foreignId('marketing_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('forms_received')->default(0);
            $table->unsignedInteger('real_orders')->default(0);
            $table->decimal('purchase_cost', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->decimal('shipping_cost', 15, 2)->default(0);
            $table->decimal('fee_or_tax', 15, 2)->default(0);
            $table->decimal('operating_cost', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_sale_periods');
    }
};
