<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'name',
        'code',
        'unit',
        'purchase_price',
        'unit_price',
        'vat_percent',
        'vat_code',
        'weight_gram',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'purchase_price' => 'decimal:2',
            'unit_price'     => 'decimal:2',
            'vat_percent'    => 'decimal:2',
            'weight_gram'    => 'integer',
            'status'         => 'integer',
        ];
    }

    public function editLogs(): HasMany
    {
        return $this->hasMany(ProductEditLog::class)->orderByDesc('created_at');
    }

    public function visibilityRules(): HasMany
    {
        return $this->hasMany(ProductVisibility::class, 'product_id');
    }

    public function allowedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'product_visibility_users', 'product_id', 'user_id');
    }

    /**
     * Scope: only products the user is allowed to view.
     */
    public function scopeVisibleToUser(Builder $query, User $user): void
    {
        $role = $user->role instanceof UserRole
            ? $user->role->value
            : (string) $user->role;

        if (UserRole::canManageUsers($role)) {
            return;
        }

        if (! UserRole::hasProductVisibility($role)) {
            $query->whereRaw('1 = 0');
            return;
        }

        $query->where(function (Builder $q) use ($user, $role) {
            $q->whereHas('visibilityRules', function (Builder $rule) use ($role) {
                $rule->where('role', $role);
            })->where(function (Builder $q2) use ($user, $role) {
                $q2->whereHas('visibilityRules', function (Builder $rule) use ($role) {
                    $rule->where('role', $role)->where('allow_all', true);
                })->orWhereHas('allowedUsers', function (Builder $u) use ($user) {
                    $u->where('users.id', $user->id);
                });
            });
        });
    }
}
