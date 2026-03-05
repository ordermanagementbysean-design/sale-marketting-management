<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductAdLink extends Model
{
    protected $appends = ['metrics'];

    protected $fillable = [
        'product_id',
        'product_sale_period_id',
        'name',
        'ad_url',
        'ad_identifier',
        'clicks',
        'ad_cost',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'clicks'   => 'integer',
            'ad_cost'  => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function productSalePeriod(): BelongsTo
    {
        return $this->belongsTo(ProductSalePeriod::class, 'product_sale_period_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'product_ad_link_id');
    }

    /**
     * Metrics for this ad link: orders_count, revenue, product_cost, conversion_rate, cpo, roas, profit.
     *
     * @return array{orders_count: int, revenue: float, product_cost: float, conversion_rate: float|null, cpo: float|null, roas: float|null, profit: float}
     */
    public function getMetricsAttribute(): array
    {
        $orders = $this->orders()->get();
        $ordersCount = $orders->count();
        $revenue = (float) $orders->sum('amount');
        $productCost = 0.0;
        foreach ($orders as $order) {
            $product = $order->product;
            if ($product) {
                $productCost += $order->quantity * (float) $product->purchase_price;
            }
        }
        $adCost = (float) $this->ad_cost;
        $clicks = (int) $this->clicks;

        $conversionRate = $clicks > 0 ? $ordersCount / $clicks : null;
        $cpo = $ordersCount > 0 ? $adCost / $ordersCount : null;
        $roas = $adCost > 0 ? $revenue / $adCost : null;
        $profit = $revenue - $adCost - $productCost;

        return [
            'orders_count'     => $ordersCount,
            'revenue'          => round($revenue, 2),
            'product_cost'     => round($productCost, 2),
            'conversion_rate'  => $conversionRate !== null ? round($conversionRate, 4) : null,
            'cpo'              => $cpo !== null ? round($cpo, 2) : null,
            'roas'             => $roas !== null ? round($roas, 2) : null,
            'profit'           => round($profit, 2),
        ];
    }
}
