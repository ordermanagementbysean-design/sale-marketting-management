<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'company_id',
        'connected_account_id',
        'product_id',
        'product_ad_link_id',
        'external_id',
        'source',
        'customer_name',
        'phone',
        'amount',
        'quantity',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount'   => 'decimal:2',
            'quantity' => 'integer',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function connectedAccount(): BelongsTo
    {
        return $this->belongsTo(ConnectedAccount::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function productAdLink(): BelongsTo
    {
        return $this->belongsTo(ProductAdLink::class, 'product_ad_link_id');
    }
}
