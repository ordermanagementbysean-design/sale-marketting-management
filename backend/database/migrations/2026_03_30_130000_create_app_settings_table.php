<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->timestamps();
        });

        DB::table('app_settings')->insert([
            'key'   => 'profit_row_color_settings',
            'value' => json_encode([
                'low_max_percent'   => 15,
                'reach_max_percent' => 30,
                'colors'            => [
                    'negative' => '#FF4D4D',
                    'low'      => '#FFA500',
                    'reach'    => '#90EE90',
                    'super'    => '#008000',
                ],
                'labels' => [
                    'negative' => 'Negative',
                    'low'      => 'Low profit',
                    'reach'    => 'Reach target',
                    'super'    => 'Super target',
                ],
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
    }
};
