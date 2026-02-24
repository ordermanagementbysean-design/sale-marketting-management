<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireCompanyId
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->shouldSkip($request)) {
            return $next($request);
        }

        $companyId = $request->header('X-Company-Id') ?? $request->header('company_id');

        if (empty($companyId)) {
            return response()->json(['message' => 'The company_id header is required.'], 422);
        }

        $company = Company::find($companyId);

        if (! $company) {
            return response()->json(['message' => 'Company not found.'], 404);
        }

        $request->merge([
            'company_id' => $company->id,
            'company'    => $company,
        ]);

        return $next($request);
    }

    private function shouldSkip(Request $request): bool
    {
        $path   = $request->path();
        $method = $request->method();

        // List and create company do not require company_id
        if (preg_match('#^api/companies$#', $path)) {
            return $method === 'GET' || $method === 'POST';
        }

        return false;
    }
}
