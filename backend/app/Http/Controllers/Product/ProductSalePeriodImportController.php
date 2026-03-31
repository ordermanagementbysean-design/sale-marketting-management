<?php

namespace App\Http\Controllers\Product;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductSalePeriod;
use App\Models\ProductSalePeriodCostEntry;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProductSalePeriodImportController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to manage sale periods.');
        }

        $validated = $request->validate([
            'rows'                   => ['required', 'array', 'min:1', 'max:500'],
            'rows.*.product_code'    => ['required', 'string', 'max:100'],
            'rows.*.marketing_user'  => ['required', 'string', 'max:255'],
            'rows.*.start_at'        => ['required', 'date'],
            'rows.*.end_at'          => ['required', 'date'],
            'rows.*.forms_received'  => ['sometimes', 'integer', 'min:0'],
            'rows.*.real_orders'     => ['sometimes', 'integer', 'min:0'],
            'rows.*.purchase_cost'   => ['required', 'numeric', 'min:0'],
            'rows.*.selling_price'   => ['required', 'numeric', 'min:0'],
            'rows.*.shipping_cost'   => ['required', 'numeric', 'min:0'],
            'rows.*.fee_or_tax'      => ['required', 'numeric', 'min:0'],
            'rows.*.operating_cost'  => ['sometimes', 'numeric', 'min:0'],
            'rows.*.ads_run_cost'    => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'rows.*.ads_run_days'    => ['required', 'integer', 'min:0', 'max:366'],
        ]);

        $results = [
            'created_periods'      => 0,
            'created_cost_entries' => 0,
            'row_errors'           => [],
        ];

        foreach ($validated['rows'] as $i => $row) {
            $line = $i + 1;
            $code = trim($row['product_code']);

            $product = Product::query()
                ->visibleToUser($request->user())
                ->where('code', $code)
                ->first();

            if (! $product) {
                $results['row_errors'][] = [
                    'row'      => $line,
                    'messages' => ['Product code not found or you cannot access this product.'],
                ];

                continue;
            }

            $marketing = $this->resolveMarketingUser(trim($row['marketing_user']));
            if ($marketing['status'] !== 'ok') {
                $results['row_errors'][] = [
                    'row'      => $line,
                    'messages' => [$marketing['message']],
                ];

                continue;
            }

            /** @var User $marketingUser */
            $marketingUser = $marketing['user'];

            $startAt = $row['start_at'];
            $endAt   = $row['end_at'];
            if ($endAt < $startAt) {
                $results['row_errors'][] = [
                    'row'      => $line,
                    'messages' => ['end_at must be on or after start_at.'],
                ];

                continue;
            }

            $overlaps = $product->salePeriods()
                ->overlapping($startAt, $endAt)
                ->exists();

            if ($overlaps) {
                $results['row_errors'][] = [
                    'row'      => $line,
                    'messages' => ['Date range overlaps another sale period for this product.'],
                ];

                continue;
            }

            $formsReceived = (int) ($row['forms_received'] ?? 0);
            $realOrders    = (int) ($row['real_orders'] ?? 0);
            $operating     = (float) ($row['operating_cost'] ?? 0);
            $adsTotal      = (float) ($row['ads_run_cost'] ?? 0);
            $adsRunDays    = (int) ($row['ads_run_days'] ?? 0);

            if ($adsTotal > 0 && $adsRunDays < 1) {
                $results['row_errors'][] = [
                    'row'      => $line,
                    'messages' => ['When ads_run_cost is greater than 0, ads_run_days must be at least 1.'],
                ];

                continue;
            }

            if ($adsTotal <= 0 && $adsRunDays > 0) {
                $results['row_errors'][] = [
                    'row'      => $line,
                    'messages' => ['ads_run_days must be 0 when ads_run_cost is 0.'],
                ];

                continue;
            }

            $persisted = $this->persistImportedSalePeriodRow(
                $product,
                $marketingUser,
                $startAt,
                $endAt,
                $formsReceived,
                $realOrders,
                (float) $row['purchase_cost'],
                (float) $row['selling_price'],
                (float) $row['shipping_cost'],
                (float) $row['fee_or_tax'],
                $operating,
                $adsTotal,
                $adsRunDays
            );

            if ($persisted['ok']) {
                $results['created_periods']++;
                $results['created_cost_entries'] += $persisted['cost_entries_created'];
            } else {
                $results['row_errors'][] = [
                    'row'      => $line,
                    'messages' => [$persisted['message']],
                ];
            }
        }

        return response()->json($results);
    }

    /**
     * Persist an imported sale period row.
     * 
     * @return array {
     *    ok: true,
     *    cost_entries_created: int,
     *    period: ProductSalePeriod
     * } | array {
     *    ok: false,
     *    message: string,
     * }
     */
    private function persistImportedSalePeriodRow(
        Product $product,
        User $marketingUser,
        string $startAt,
        string $endAt,
        int $formsReceived,
        int $realOrders,
        float $purchaseCost,
        float $sellingPrice,
        float $shippingCost,
        float $feeOrTax,
        float $operatingCost,
        float $adsRunCostTotal,
        int $adsRunDays
    ): array {
        DB::beginTransaction();

        try {
            $period = ProductSalePeriod::create([
                'product_id'        => $product->id,
                'start_at'          => $startAt,
                'end_at'            => $endAt,
                'marketing_user_id' => $marketingUser->id,
                'forms_received'    => $formsReceived,
                'real_orders'       => $realOrders,
                'purchase_cost'     => $purchaseCost,
                'selling_price'     => $sellingPrice,
                'shipping_cost'     => $shippingCost,
                'fee_or_tax'        => $feeOrTax,
                'operating_cost'    => $operatingCost,
            ]);

            $createdEntries = 0;

            if ($adsRunDays > 0) {
                foreach ($this->splitAmountAcrossParts($adsRunCostTotal, $adsRunDays) as $chunk) {
                    ProductSalePeriodCostEntry::create([
                        'product_sale_period_id' => $period->id,
                        'ads_run_cost'           => $chunk,
                    ]);
                    $createdEntries++;
                }
            }

            DB::commit();

            return ['ok' => true, 'cost_entries_created' => $createdEntries];
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);

            return ['ok' => false, 'message' => 'Server error while saving this row.'];
        }
    }

    /**
     * Split a monetary total across N parts with even cent distribution.
     *
     * @return list<float>
     */
    private function splitAmountAcrossParts(float $total, int $parts): array
    {
        if ($parts < 1) {
            return [];
        }

        $cents = (int) round($total * 100);
        $base  = intdiv($cents, $parts);
        $rem   = $cents % $parts;
        $out   = [];

        for ($i = 0; $i < $parts; $i++) {
            $c = $base + ($i < $rem ? 1 : 0);
            $out[] = round($c / 100, 2);
        }

        return $out;
    }

    /**
     * @return array{status: 'ok', user: User}|array{status: string, message: string}
     */
    private function resolveMarketingUser(string $needle): array
    {
        if ($needle === '') {
            return ['status' => 'empty', 'message' => 'Marketing user (name or email) is required.'];
        }

        $lower = mb_strtolower($needle, 'UTF-8');

        $users = User::query()
            ->where('role', UserRole::MARKETING)
            ->where(function ($q) use ($lower) {
                $q->whereRaw('LOWER(email) = ?', [$lower])
                    ->orWhereRaw('LOWER(name) = ?', [$lower]);
            })
            ->get();

        if ($users->isEmpty()) {
            return [
                'status'  => 'not_found',
                'message' => 'No marketing user matches this name or email.',
            ];
        }

        if ($users->count() > 1) {
            return [
                'status'  => 'ambiguous',
                'message' => 'Multiple marketing users match; use a unique email.',
            ];
        }

        return ['status' => 'ok', 'user' => $users->first()];
    }
}
