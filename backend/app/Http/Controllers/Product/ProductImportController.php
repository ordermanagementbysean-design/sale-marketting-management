<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Jobs\ImportProductsJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ProductImportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to import products.');
        }

        $validated = $request->validate([
            'rows'                   => ['required', 'array', 'min:1', 'max:500'],
            'rows.*.name'            => ['required', 'string', 'max:255'],
            'rows.*.code'            => ['nullable', 'string', 'max:200'],
            'rows.*.status'          => ['required', 'integer', 'in:0,1'],
            'rows.*.unit'            => ['nullable', 'string', 'max:50'],
            'rows.*.purchase_price'  => ['nullable', 'numeric', 'min:0'],
            'rows.*.unit_price'      => ['nullable', 'numeric', 'min:0'],
            'rows.*.vat_percent'     => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rows.*.vat_code'        => ['nullable', 'string', 'max:50'],
            'rows.*.weight_gram'     => ['nullable', 'integer', 'min:0'],
        ]);

        $importId = (string) Str::uuid();
        Cache::put('product_import:' . $importId, [
            'status' => 'queued',
        ], now()->addDay());

        ImportProductsJob::dispatch($importId, $validated['rows']);

        return response()->json([
            'import_id' => $importId,
            'status'    => 'queued',
            'message'   => 'Import has been queued.',
        ], 202);
    }

    public function show(string $importId): JsonResponse
    {
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to view import status.');
        }

        if (! Str::isUuid($importId)) {
            abort(404, 'Import not found.');
        }

        $data = Cache::get('product_import:' . $importId);
        if ($data === null) {
            abort(404, 'Import not found or expired.');
        }

        return response()->json($data);
    }
}
