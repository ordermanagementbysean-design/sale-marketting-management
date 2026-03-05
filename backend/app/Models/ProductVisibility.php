<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVisibility extends Model
{
    protected $table = 'product_visibility';

    protected $fillable = [
        'product_id',
        'role',
        'allow_all',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'allow_all' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
