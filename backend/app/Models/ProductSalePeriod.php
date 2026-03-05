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
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_at' => 'date',
            'end_at'   => 'date',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function adLinks(): HasMany
    {
        return $this->hasMany(ProductAdLink::class, 'product_sale_period_id');
    }
}
