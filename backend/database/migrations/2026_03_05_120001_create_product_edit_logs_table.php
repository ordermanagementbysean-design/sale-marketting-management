<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_edit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->json('changes'); // e.g. {"name": {"old": "A", "new": "B"}, "unit_price": {"old": 100, "new": 120}}
            $table->timestamp('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_edit_logs');
    }
};
