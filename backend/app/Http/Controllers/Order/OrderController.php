<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Models\ConnectedAccount;
use App\Models\Order;
use App\Services\FacebookService;
use App\Services\GhtkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->with(['company', 'connectedAccount'])
            ->where('company_id', $request->company_id)
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($orders);
    }

    public function syncGhtk(Request $request, GhtkService $service): JsonResponse
    {
        $request->validate([
            'connected_account_id' => 'required|exists:connected_accounts,id',
        ]);

        $company = $request->company;

        $ghtkAccount = ConnectedAccount::where('company_id', $company->id)
            ->where('type', ConnectedAccount::TYPE_GHTK)
            ->first($request->connected_account_id);
        if (! $ghtkAccount) {
            return response()->json(['message' => 'GHTK account not found.'], 404);
        }

        $credentials    = $ghtkAccount->credentials;
        $getOrderResult = $service->getOrders($credentials);

        foreach ($getOrderResult['data'] ?? [] as $item) {
            Order::updateOrCreate(
                [
                    'company_id'  => $company->id,
                    'source'      => 'ghtk',
                    'external_id' => $item['label'] ?? (string) $item['id'],
                ],
                [
                    'connected_account_id' => $ghtkAccount?->id,
                    'customer_name'        => $item['to_name'] ?? null,
                    'phone'                => $item['to_phone'] ?? null,
                    'amount'               => $item['cod_amount'] ?? 0,
                    'status'               => $item['status_text'] ?? null,
                ]
            );
        }

        return response()->json(['message' => 'Synced GHTK']);
    }

    public function syncFacebook(Request $request, FacebookService $service): JsonResponse
    {
        $request->validate([
            'connected_account_id' => 'required|exists:connected_accounts,id',
        ]);

        $facebookAccount = ConnectedAccount::where('company_id', $request->company_id)
            ->where('type', ConnectedAccount::TYPE_FACEBOOK)
            ->find($request->connected_account_id);

        if (! $facebookAccount) {
            return response()->json(['message' => 'Facebook account not found.'], 404);
        }

        $getOrderResult = $service->getOrders($facebookAccount->credentials ?? []);

        foreach ($getOrderResult['data'] ?? [] as $item) {
            Order::updateOrCreate(
                [
                    'company_id'  => $facebookAccount->company_id,
                    'source'      => 'facebook',
                    'external_id' => (string) ($item['id'] ?? ''),
                ],
                [
                    'connected_account_id' => $facebookAccount->id,
                    'customer_name'        => $item['customer']['name'] ?? null,
                    'phone'                => $item['customer']['phone'] ?? null,
                    'amount'               => $item['total_amount'] ?? 0,
                    'status'               => $item['status'] ?? null,
                ]
            );
        }

        return response()->json(['message' => 'Synced Facebook']);
    }
}
