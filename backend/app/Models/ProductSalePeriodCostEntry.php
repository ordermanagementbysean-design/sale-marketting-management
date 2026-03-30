<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductSalePeriodCostEntry extends Model
{
    protected $fillable = [
        'product_sale_period_id',
        'ads_run_cost',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'ads_run_cost' => 'decimal:2',
        ];
    }

    public function productSalePeriod(): BelongsTo
    {
        return $this->belongsTo(ProductSalePeriod::class, 'product_sale_period_id');
    }
}
