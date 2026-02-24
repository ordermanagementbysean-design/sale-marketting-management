<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index(): JsonResponse
    {
        $companies = Company::withCount(['connectedAccounts', 'orders'])->get();
        return response()->json($companies);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate(['name' => 'required|string|max:255']);
        $company = Company::create($request->only('name'));
        return response()->json($company, 201);
    }

    public function show(Request $request, Company $company): JsonResponse
    {
        if ($company->id !== (int) $request->company_id) {
            abort(404);
        }
        $company->load(['connectedAccounts', 'orders' => fn ($q) => $q->latest()->limit(50)]);
        return response()->json($company);
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        if ($company->id !== (int) $request->company_id) {
            abort(404);
        }
        $request->validate(['name' => 'sometimes|string|max:255']);
        $company->update($request->only('name'));
        return response()->json($company);
    }

    public function destroy(Request $request, Company $company): JsonResponse
    {
        if ($company->id !== (int) $request->company_id) {
            abort(404);
        }
        $company->delete();
        return response()->json(null, 204);
    }
}
