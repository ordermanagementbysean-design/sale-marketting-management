<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FacebookService
{
    private const GRAPH_VERSION = 'v18.0';
    private const GRAPH_BASE = 'https://graph.facebook.com';

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

    /**
     * Fetch lead details from Facebook Graph API (Lead Ads).
     * Returns assoc: id, created_time, field_data (key-value from field_data array).
     *
     * @param array{access_token: string} $credentials
     * @return array{id?: string, created_time?: string, full_name?: string, phone?: string, email?: string, ...}
     */
    public function getLead(array $credentials, string $leadgenId): array
    {
        $getLeadResponse = Http::get(
            self::GRAPH_BASE . '/' . self::GRAPH_VERSION . '/' . $leadgenId,
            [
                'access_token' => $credentials['access_token'] ?? config('services.facebook.token'),
                'fields'       => 'id,created_time,field_data',
            ]
        );

        $responseData = $getLeadResponse->json();
        if (! is_array($responseData)
            || isset($responseData['error'])
        ) {
            Log::warning('Facebook getLead failed', [
                'leadgen_id' => $leadgenId,
                'response'   => $responseData ?? $getLeadResponse->body()
            ]);

            return [];
        }

        $leadInformation = [
            'id'           => $responseData['id'] ?? null,
            'created_time' => $responseData['created_time'] ?? null,
        ];
        foreach ($responseData['field_data'] ?? [] as $field) {
            $name   = $field['name'] ?? null;
            $values = $field['values'] ?? [];
            $value  = is_array($values) ? ($values[0] ?? '') : '';
            if ($name !== null) {
                $leadInformation[$name] = $value;
            }
        }

        return $leadInformation;
    }
}
