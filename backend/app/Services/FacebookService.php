<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class FacebookService
{
    /**
     * @param array{access_token: string, base_url?: string} $credentials
     */
    public function getOrders(array $credentials = []): array
    {
        $baseUrl = $credentials['base_url'] ?? config('services.facebook.base_url');
        $accessToken = $credentials['access_token'] ?? config('services.facebook.token');

        $response = Http::get(
            rtrim($baseUrl, '/') . '/me/orders',
            ['access_token' => $accessToken]
        );

        return $response->json() ?? [];
    }
}
