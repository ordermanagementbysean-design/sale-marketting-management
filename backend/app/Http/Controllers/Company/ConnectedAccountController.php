<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\ConnectedAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConnectedAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $accounts = ConnectedAccount::query()
            ->with('company')
            ->where('company_id', $request->company_id)
            ->get();

        return response()->json($accounts);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:facebook,ghtk,ghn,shopee,tiktok',
            'name' => 'nullable|string|max:255',
            'credentials' => 'required|array',
        ]);

        $account = ConnectedAccount::create([
            'company_id' => $request->company_id,
            'type' => $request->type,
            'name' => $request->name,
            'credentials' => $request->credentials,
        ]);

        return response()->json($account, 201);
    }

    public function show(Request $request, ConnectedAccount $connectedAccount): JsonResponse
    {
        if ($connectedAccount->company_id !== (int) $request->company_id) {
            abort(404);
        }
        $connectedAccount->load('company');
        return response()->json($connectedAccount);
    }

    public function update(Request $request, ConnectedAccount $connectedAccount): JsonResponse
    {
        if ($connectedAccount->company_id !== (int) $request->company_id) {
            abort(404);
        }
        $request->validate([
            'name' => 'sometimes|nullable|string|max:255',
            'credentials' => 'sometimes|array',
        ]);
        $connectedAccount->update($request->only(['name', 'credentials']));
        return response()->json($connectedAccount);
    }

    public function destroy(Request $request, ConnectedAccount $connectedAccount): JsonResponse
    {
        if ($connectedAccount->company_id !== (int) $request->company_id) {
            abort(404);
        }
        $connectedAccount->delete();
        return response()->json(null, 204);
    }
}
