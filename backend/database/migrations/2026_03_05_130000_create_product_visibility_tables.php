<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_visibility', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('role', 50); // marketing, telesale, telesale_leader, customer_service
            $table->boolean('allow_all')->default(true); // true = all staff in role, false = only specific users
            $table->unique(['product_id', 'role']);
        });

        Schema::create('product_visibility_users', function (Blueprint $table) {
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['product_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_visibility_users');
        Schema::dropIfExists('product_visibility');
    }
};
