<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductAdLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductAdLinkController extends Controller
{
    public function index(Request $request, Product $product): JsonResponse
    {
        $canView = Product::query()->visibleToUser($request->user())->where('id', $product->id)->exists();
        if (! $canView) {
            abort(403, 'You do not have permission to view this product.');
        }

        $adLinks = $product->adLinks()->with(['orders.product'])->orderBy('id')->get();

        return response()->json($adLinks);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to manage ad links.');
        }
        $canView = Product::query()->visibleToUser($request->user())->where('id', $product->id)->exists();
        if (! $canView) {
            abort(403, 'You do not have permission to view this product.');
        }

        $validated = $request->validate([
            'product_sale_period_id' => ['required', 'integer', 'exists:product_sale_periods,id'],
            'name'                   => ['required', 'string', 'max:255'],
            'ad_url'                 => ['nullable', 'string', 'max:500'],
            'ad_identifier'          => ['nullable', 'string', 'max:255'],
            'clicks'                 => ['sometimes', 'integer', 'min:0'],
            'ad_cost'                => ['sometimes', 'numeric', 'min:0'],
        ]);
        $period = $product->salePeriods()->find($validated['product_sale_period_id']);
        if (! $period) {
            abort(422, 'Sale period does not belong to this product.');
        }

        $adLink = $product->adLinks()->create([
            'product_sale_period_id' => $period->id,
            'name'                   => $validated['name'],
            'ad_url'                 => $validated['ad_url'] ?? null,
            'ad_identifier'          => $validated['ad_identifier'] ?? null,
            'clicks'                 => $validated['clicks'] ?? 0,
            'ad_cost'                => $validated['ad_cost'] ?? 0,
        ]);
        $adLink->load(['orders.product']);

        return response()->json($adLink, 201);
    }

    public function update(Request $request, Product $product, ProductAdLink $productAdLink): JsonResponse
    {
        if ($productAdLink->product_id !== $product->id) {
            abort(404);
        }
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to manage ad links.');
        }
        $canView = Product::query()->visibleToUser($request->user())->where('id', $product->id)->exists();
        if (! $canView) {
            abort(403, 'You do not have permission to view this product.');
        }

        $validated = $request->validate([
            'product_sale_period_id' => ['sometimes', 'integer', 'exists:product_sale_periods,id'],
            'name'                   => ['sometimes', 'string', 'max:255'],
            'ad_url'                 => ['sometimes', 'nullable', 'string', 'max:500'],
            'ad_identifier'          => ['sometimes', 'nullable', 'string', 'max:255'],
            'clicks'                 => ['sometimes', 'integer', 'min:0'],
            'ad_cost'                => ['sometimes', 'numeric', 'min:0'],
        ]);
        if (isset($validated['product_sale_period_id'])) {
            $period = $product->salePeriods()->find($validated['product_sale_period_id']);
            if (! $period) {
                abort(422, 'Sale period does not belong to this product.');
            }
            $validated['product_sale_period_id'] = $period->id;
        }
        $productAdLink->update($validated);
        $productAdLink->load(['orders.product']);

        return response()->json($productAdLink);
    }

    public function destroy(Request $request, Product $product, ProductAdLink $productAdLink): JsonResponse
    {
        if ($productAdLink->product_id !== $product->id) {
            abort(404);
        }
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to manage ad links.');
        }
        $canView = Product::query()->visibleToUser($request->user())->where('id', $product->id)->exists();
        if (! $canView) {
            abort(403, 'You do not have permission to view this product.');
        }

        $productAdLink->delete();

        return response()->json(null, 204);
    }
}
