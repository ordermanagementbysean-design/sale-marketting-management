<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductSalePeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductSalePeriodController extends Controller
{
    /**
     * List all sale periods for products the user can view.
     */
    public function listAll(Request $request): JsonResponse
    {
        $productIds = Product::query()
            ->visibleToUser($request->user())
            ->pluck('id');

        $periods = ProductSalePeriod::query()
            ->whereIn('product_id', $productIds)
            ->with(['product:id,name,code', 'adLinks:id,product_sale_period_id,name,ad_url,ad_identifier,clicks,ad_cost'])
            ->orderBy('start_at', 'desc')
            ->get();

        return response()->json($periods);
    }

    public function index(Request $request, Product $product): JsonResponse
    {
        $canView = Product::query()->visibleToUser($request->user())->where('id', $product->id)->exists();
        if (! $canView) {
            abort(403, 'You do not have permission to view this product.');
        }

        $periods = $product->salePeriods()->with(['adLinks' => fn ($q) => $q->with(['orders.product'])])->orderBy('start_at')->get();

        return response()->json($periods);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to manage sale periods.');
        }
        $canView = Product::query()->visibleToUser($request->user())->where('id', $product->id)->exists();
        if (! $canView) {
            abort(403, 'You do not have permission to view this product.');
        }

        $validated = $request->validate([
            'start_at' => ['required', 'date'],
            'end_at'   => ['required', 'date', 'after_or_equal:start_at'],
        ]);

        /** @var \Illuminate\Database\Eloquent\Builder<ProductSalePeriod> $salePeriodsQuery */
        $salePeriodsQuery = $product->salePeriods();

        $overlaps = $salePeriodsQuery->overlapping($validated['start_at'], $validated['end_at'])->exists();
        if ($overlaps) {
            abort(422, 'Khoảng thời gian bán trùng với một đợt bán khác của sản phẩm này.');
        }

        $period = $product->salePeriods()->create([
            'start_at' => $validated['start_at'],
            'end_at'   => $validated['end_at'],
        ]);
        $period->load('adLinks');

        return response()->json($period, 201);
    }

    public function update(Request $request, Product $product, ProductSalePeriod $productSalePeriod): JsonResponse
    {
        if ($productSalePeriod->product_id !== $product->id) {
            abort(404);
        }
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to manage sale periods.');
        }

        $canView = Product::query()->visibleToUser($request->user())->where('id', $product->id)->exists();
        if (! $canView) {
            abort(403, 'You do not have permission to view this product.');
        }

        $validated = $request->validate([
            'start_at' => ['sometimes', 'date'],
            'end_at'   => ['sometimes', 'date', 'after_or_equal:start_at'],
        ]);

        $startAt = $validated['start_at'] ?? $productSalePeriod->getRawOriginal('start_at');
        $endAt   = $validated['end_at'] ?? $productSalePeriod->getRawOriginal('end_at');
        if ($startAt && $endAt) {
            /** @var \Illuminate\Database\Eloquent\Builder<ProductSalePeriod> $salePeriodsQuery */
            $salePeriodsQuery = $product->salePeriods()->where('id', '!=', $productSalePeriod->id);

            $overlaps = $salePeriodsQuery->overlapping($startAt, $endAt)->exists();
            if ($overlaps) {
                abort(422, 'Khoảng thời gian bán trùng với một đợt bán khác của sản phẩm này.');
            }
        }

        $productSalePeriod->update($validated);
        $productSalePeriod->load('adLinks');

        return response()->json($productSalePeriod);
    }

    public function destroy(Request $request, Product $product, ProductSalePeriod $productSalePeriod): JsonResponse
    {
        if ($productSalePeriod->product_id !== $product->id) {
            abort(404);
        }
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to manage sale periods.');
        }

        $canView = Product::query()->visibleToUser($request->user())->where('id', $product->id)->exists();
        if (! $canView) {
            abort(403, 'You do not have permission to view this product.');
        }

        $productSalePeriod->delete();

        return response()->json(null, 204);
    }
}
