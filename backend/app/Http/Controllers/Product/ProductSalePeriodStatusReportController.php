<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductSalePeriod;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductSalePeriodStatusReportController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        if (! $request->user()->canViewSalePeriodsAndReports()) {
            abort(403, 'You do not have permission to view the sale period status report.');
        }

        $productIds = Product::query()
            ->visibleToUser($request->user())
            ->pluck('id');

        $periods = ProductSalePeriod::query()
            ->whereIn('product_id', $productIds)
            ->with(['product:id,name,code', 'marketingUser:id,name,email'])
            ->withSum('costEntries', 'ads_run_cost')
            ->withCount('costEntries')
            ->orderByDesc('start_at')
            ->get();

        $today = now()->startOfDay();

        $rows = $periods->map(fn (ProductSalePeriod $period) => $this->buildRow($period, $today))->values();

        return response()->json($rows);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildRow(ProductSalePeriod $period, Carbon $today): array
    {
        $startD = Carbon::parse($period->start_at->format('Y-m-d'))->startOfDay();
        $endD   = Carbon::parse($period->end_at->format('Y-m-d'))->startOfDay();

        $periodDaysTotal = max(0, $startD->diffInDays($endD) + 1);

        if ($today->lt($startD)) {
            $daysSellingUntilNow = 0;
        } else {
            $cap                 = $today->lte($endD) ? $today : $endD;
            $daysSellingUntilNow = max(0, $startD->diffInDays($cap));
        }

        $realOrders        = (int) ($period->real_orders ?? 0);
        $formsReceived     = (int) ($period->forms_received ?? 0);
        $purchaseCost      = (float) $period->purchase_cost;
        $sellingPrice      = (float) $period->selling_price;
        $shippingPerUnit   = (float) $period->shipping_cost;
        $feeOrTaxRate      = (float) $period->fee_or_tax;
        $operatingPerEntry = (float) $period->operating_cost;
        $costEntryCount    = (int) ($period->cost_entries_count ?? 0);
        $operatingCost     = round($operatingPerEntry * $costEntryCount, 2);

        $totalAdsRunCost = round((float) ($period->cost_entries_sum_ads_run_cost ?? 0), 2);

        $revenue         = round($realOrders * $sellingPrice, 2);
        $totalInputCost  = round($purchaseCost * $realOrders, 2);
        $riskCost        = round($totalInputCost * 0.10, 2);
        $shippingTotal   = round($shippingPerUnit * $realOrders, 2);
        $totalFeeTax     = round($feeOrTaxRate * ($revenue / 100), 2);
        $totalCost       = round($totalInputCost + $riskCost + $shippingTotal + $totalFeeTax + $operatingCost, 2);
        $profit          = round($revenue - $totalCost, 2);

        $adsPerForm  = $formsReceived > 0 ? round($totalAdsRunCost / $formsReceived, 2) : null;
        $adsPerOrder = $realOrders > 0 ? round($totalAdsRunCost / $realOrders, 2) : null;

        $adCostToRevenuePercent = $revenue > 0.00001
            ? round(($totalAdsRunCost / $revenue) * 100, 2)
            : null;
        $profitToRevenuePercent = $revenue > 0.00001
            ? round(($profit / $revenue) * 100, 2)
            : null;

        return [
            'sale_period_id'             => $period->id,
            'product_id'                 => $period->product_id,
            'product'                    => $period->product,
            'marketing_user'             => $period->marketingUser?->only(['id', 'name', 'email']),
            'purchase_cost'              => round($purchaseCost, 2),
            'selling_price'              => round($sellingPrice, 2),
            'fee_or_tax'                 => round($feeOrTaxRate, 2),
            'shipping_cost'              => round($shippingPerUnit, 2),
            'start_at'                   => $period->start_at->format('Y-m-d'),
            'end_at'                     => $period->end_at->format('Y-m-d'),
            'period_days_total'          => $periodDaysTotal,
            'days_selling_until_now'     => $daysSellingUntilNow,
            'forms_received'             => $formsReceived,
            'real_orders'                => $realOrders,
            'revenue'                    => $revenue,
            'total_ads_run_cost'         => $totalAdsRunCost,
            'ads_run_cost_per_form'      => $adsPerForm,
            'ads_run_cost_per_order'     => $adsPerOrder,
            'ad_cost_to_revenue_percent' => $adCostToRevenuePercent,
            'total_cost'                 => $totalCost,
            'total_cost_breakdown'       => [
                'total_input_cost' => $totalInputCost,
                'risk_cost'        => $riskCost,
                'shipping_cost'    => $shippingTotal,
                'total_fee_tax'    => $totalFeeTax,
                'operating_cost'   => $operatingCost,
            ],
            'cost_entries_count'         => $costEntryCount,
            'operating_cost_per_entry'   => round($operatingPerEntry, 2),
            'profit'                     => $profit,
            'profit_to_revenue_percent'  => $profitToRevenuePercent,
        ];
    }
}
