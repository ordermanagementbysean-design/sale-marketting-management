<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @method static \Illuminate\Database\Eloquent\Builder|ProductSalePeriod overlapping(string $startAt, string $endAt)
 */
class ProductSalePeriod extends Model
{
    /**
     * Scope: periods that overlap the given date range [startAt, endAt].
     * Two ranges overlap iff start_at <= other.end_at AND end_at >= other.start_at.
     */
    public function scopeOverlapping(Builder $query, string $startAt, string $endAt): void
    {
        $query->where('start_at', '<=', $endAt)->where('end_at', '>=', $startAt);
    }
    protected $fillable = [
        'product_id',
        'start_at',
        'end_at',
        'marketing_user_id',
        'forms_received',
        'real_orders',
        'purchase_cost',
        'selling_price',
        'shipping_cost',
        'fee_or_tax',
        'operating_cost',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_at'        => 'date',
            'end_at'          => 'date',
            'forms_received'  => 'integer',
            'real_orders'     => 'integer',
            'purchase_cost'   => 'decimal:2',
            'selling_price'   => 'decimal:2',
            'shipping_cost'   => 'decimal:2',
            'fee_or_tax'      => 'decimal:2',
            'operating_cost'  => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function marketingUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'marketing_user_id');
    }

    public function adLinks(): HasMany
    {
        return $this->hasMany(ProductAdLink::class, 'product_sale_period_id');
    }

    public function costEntries(): HasMany
    {
        return $this->hasMany(ProductSalePeriodCostEntry::class, 'product_sale_period_id');
    }
}
