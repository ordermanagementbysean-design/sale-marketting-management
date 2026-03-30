<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductSalePeriod;
use App\Models\ProductSalePeriodCostEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductSalePeriodCostEntryController extends Controller
{
    public function index(Request $request, Product $product, ProductSalePeriod $productSalePeriod): JsonResponse
    {
        $this->assertPeriodOnProduct($product, $productSalePeriod);
        $this->assertCanViewProduct($request, $product);

        $entries = ProductSalePeriodCostEntry::query()
            ->where('product_sale_period_id', $productSalePeriod->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return response()->json($entries);
    }

    public function store(Request $request, Product $product, ProductSalePeriod $productSalePeriod): JsonResponse
    {
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to manage sale periods.');
        }
        $this->assertPeriodOnProduct($product, $productSalePeriod);
        $this->assertCanViewProduct($request, $product);

        $validated = $request->validate([
            'ads_run_cost' => ['required', 'numeric', 'min:0'],
        ]);

        $entry = ProductSalePeriodCostEntry::create([
            'product_sale_period_id' => $productSalePeriod->id,
            'shipping_cost'          => 0,
            'operating_cost'         => 0,
            'ads_run_cost'           => $validated['ads_run_cost'],
        ]);

        return response()->json($entry, 201);
    }

    public function update(
        Request $request,
        Product $product,
        ProductSalePeriod $productSalePeriod,
        ProductSalePeriodCostEntry $costEntry
    ): JsonResponse {
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to manage sale periods.');
        }
        $this->assertPeriodOnProduct($product, $productSalePeriod);
        $this->assertCanViewProduct($request, $product);

        if ($costEntry->product_sale_period_id !== $productSalePeriod->id) {
            abort(404);
        }

        $validated = $request->validate([
            'ads_run_cost' => ['required', 'numeric', 'min:0'],
        ]);

        $costEntry->update([
            'ads_run_cost' => $validated['ads_run_cost'],
        ]);

        return response()->json($costEntry->fresh());
    }

    private function assertPeriodOnProduct(Product $product, ProductSalePeriod $productSalePeriod): void
    {
        if ($productSalePeriod->product_id !== $product->id) {
            abort(404);
        }
    }

    private function assertCanViewProduct(Request $request, Product $product): void
    {
        $canView = Product::query()->visibleToUser($request->user())->where('id', $product->id)->exists();
        if (! $canView) {
            abort(403, 'You do not have permission to view this product.');
        }
    }
}
