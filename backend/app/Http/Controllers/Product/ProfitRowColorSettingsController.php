<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfitRowColorSettingsController extends Controller
{
    public const KEY = 'profit_row_color_settings';

    /**
     * @return array{
     *     low_max_percent: float|int,
     *     reach_max_percent: float|int,
     *     colors: array{negative: string, low: string, reach: string, super: string},
     *     labels: array{negative: string, low: string, reach: string, super: string}
     * }
     */
    public static function defaultPayload(): array
    {
        return [
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
        ];
    }

    public function show(Request $request): JsonResponse
    {
        $row = AppSetting::query()->where('key', self::KEY)->first();

        return response()->json($this->mergedPayload($row?->value));
    }

    public function update(Request $request): JsonResponse
    {
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to update these settings.');
        }

        $validated = $request->validate([
            'low_max_percent'   => ['required', 'numeric', 'min:0'],
            'reach_max_percent' => ['required', 'numeric', 'gt:low_max_percent'],
            'colors'            => ['required', 'array'],
            'colors.negative'   => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'colors.low'        => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'colors.reach'      => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'colors.super'      => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'labels'            => ['required', 'array'],
            'labels.negative'   => ['required', 'string', 'max:200'],
            'labels.low'        => ['required', 'string', 'max:200'],
            'labels.reach'      => ['required', 'string', 'max:200'],
            'labels.super'      => ['required', 'string', 'max:200'],
        ]);

        AppSetting::query()->updateOrCreate(
            ['key' => self::KEY],
            ['value' => $validated]
        );

        return response()->json($this->mergedPayload($validated));
    }

    public function reset(Request $request): JsonResponse
    {
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to update these settings.');
        }

        $defaults = self::defaultPayload();

        AppSetting::query()->updateOrCreate(
            ['key' => self::KEY],
            ['value' => $defaults]
        );

        return response()->json($defaults);
    }

    /**
     * @param  array<string, mixed>|null  $stored
     * @return array{
     *     low_max_percent: float|int,
     *     reach_max_percent: float|int,
     *     colors: array{negative: string, low: string, reach: string, super: string},
     *     labels: array{negative: string, low: string, reach: string, super: string}
     * }
     */
    private function mergedPayload(?array $stored): array
    {
        $defaults = self::defaultPayload();
        if ($stored === null) {
            return $defaults;
        }

        return array_replace_recursive($defaults, $stored);
    }
}
