<?php

namespace App\Http\Controllers\Product;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductSalePeriod;
use App\Models\User;
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
            ->with([
                'product:id,name,code',
                'marketingUser:id,name,email',
                'adLinks:id,product_sale_period_id,name,ad_url,ad_identifier,clicks,ad_cost',
                'costEntries' => fn ($q) => $q->orderByDesc('created_at')->orderByDesc('id'),
            ])
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

        $periods = $product->salePeriods()
            ->with([
                'marketingUser:id,name,email',
                'costEntries' => fn ($q) => $q->orderByDesc('created_at')->orderByDesc('id'),
                'adLinks' => fn ($q) => $q->with(['orders.product']),
            ])
            ->orderBy('start_at')
            ->get();

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
            'start_at'          => ['required', 'date'],
            'end_at'            => ['required', 'date', 'after_or_equal:start_at'],
            'marketing_user_id' => ['required', 'integer', 'exists:users,id'],
            'forms_received'    => ['sometimes', 'integer', 'min:0'],
            'real_orders'       => ['sometimes', 'integer', 'min:0'],
            'purchase_cost'     => ['required', 'numeric', 'min:0'],
            'selling_price'     => ['required', 'numeric', 'min:0'],
            'shipping_cost'     => ['required', 'numeric', 'min:0'],
            'fee_or_tax'        => ['required', 'numeric', 'min:0'],
            'operating_cost'    => ['sometimes', 'numeric', 'min:0'],
        ]);
        $this->assertMarketingUser((int) $validated['marketing_user_id']);

        /** @var \Illuminate\Database\Eloquent\Builder<ProductSalePeriod> $salePeriodsQuery */
        $salePeriodsQuery = $product->salePeriods();

        $overlaps = $salePeriodsQuery->overlapping($validated['start_at'], $validated['end_at'])->exists();
        if ($overlaps) {
            abort(422, 'Khoảng thời gian bán trùng với một đợt bán khác của sản phẩm này.');
        }

        $period = $product->salePeriods()->create([
            'start_at'          => $validated['start_at'],
            'end_at'            => $validated['end_at'],
            'marketing_user_id' => $validated['marketing_user_id'],
            'forms_received'    => $validated['forms_received'] ?? 0,
            'real_orders'       => $validated['real_orders'] ?? 0,
            'purchase_cost'     => $validated['purchase_cost'],
            'selling_price'     => $validated['selling_price'],
            'shipping_cost'     => $validated['shipping_cost'],
            'fee_or_tax'        => $validated['fee_or_tax'],
            'operating_cost'    => $validated['operating_cost'] ?? 0,
        ]);
        $period->load(['adLinks', 'marketingUser:id,name,email']);

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
            'start_at'          => ['sometimes', 'date'],
            'end_at'            => ['sometimes', 'date', 'after_or_equal:start_at'],
            'marketing_user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'forms_received'    => ['sometimes', 'integer', 'min:0'],
            'real_orders'       => ['sometimes', 'integer', 'min:0'],
            'purchase_cost'     => ['sometimes', 'numeric', 'min:0'],
            'selling_price'     => ['sometimes', 'numeric', 'min:0'],
            'shipping_cost'     => ['sometimes', 'numeric', 'min:0'],
            'fee_or_tax'        => ['sometimes', 'numeric', 'min:0'],
            'operating_cost'    => ['sometimes', 'numeric', 'min:0'],
        ]);
        if (array_key_exists('marketing_user_id', $validated)) {
            $this->assertMarketingUser((int) $validated['marketing_user_id']);
        }

        if (array_key_exists('start_at', $validated)) {
            $origStart = \Carbon\Carbon::parse($productSalePeriod->getRawOriginal('start_at'))->startOfDay();
            if ($origStart->lt(now()->startOfDay())) {
                $newStart = \Carbon\Carbon::parse($validated['start_at'])->startOfDay();
                if (! $origStart->equalTo($newStart)) {
                    abort(422, 'Không thể đổi ngày bắt đầu vì đợt bán đã bắt đầu.');
                }
                unset($validated['start_at']);
            }
        }

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
        $productSalePeriod->load(['adLinks', 'marketingUser:id,name,email']);

        return response()->json($productSalePeriod);
    }

    private function assertMarketingUser(int $userId): void
    {
        $user = User::query()->find($userId);
        if (! $user || $user->role !== UserRole::MARKETING) {
            abort(422, 'Người được chọn phải có vai trò marketing.');
        }
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
