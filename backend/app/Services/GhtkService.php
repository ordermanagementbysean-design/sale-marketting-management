<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GhtkService
{
    /**
     * @param array{token: string, base_url?: string} $credentials
     */
    public function getOrders(array $credentials = [], int $page = 1): array
    {
        $baseUrl = $credentials['base_url'] ?? config('services.ghtk.base_url');
        $token = $credentials['token'] ?? config('services.ghtk.token');

        $response = Http::withHeaders(['Token' => $token])
            ->get(
                rtrim($baseUrl, '/') . '/services/shipment/v2/shipment',
                ['page' => $page]
            );

        return $response->json() ?? [];
    }
}
