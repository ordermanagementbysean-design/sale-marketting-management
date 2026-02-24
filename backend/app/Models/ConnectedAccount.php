<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConnectedAccount extends Model
{
    public const TYPE_FACEBOOK = 'facebook';
    public const TYPE_GHTK = 'ghtk';
    public const TYPE_GHN = 'ghn';
    public const TYPE_SHOPEE = 'shopee';
    public const TYPE_TIKTOK = 'tiktok';

    protected $fillable = ['company_id', 'type', 'name', 'credentials'];

    protected function casts(): array
    {
        return [
            'credentials' => 'array',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'connected_account_id');
    }
}
