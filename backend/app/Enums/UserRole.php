<?php

namespace App\Enums;

enum UserRole: string
{
    case MARKETING        = 'marketing';
    case ADMIN            = 'admin';
    case TELESALE         = 'telesale';
    case TELESALE_LEADER  = 'telesale_leader';
    case DIRECTOR         = 'director';
    case ACCOUNTING       = 'accounting';
    case WAREHOUSE        = 'warehouse';
    case MANAGER          = 'manager';
    case CUSTOMER_SERVICE = 'customer_service';

    public function label(): string
    {
        return str_replace('_', ' ', strtoupper($this->value));
    }

    public static function canManageUsers(string $role): bool
    {
        return in_array($role, [
            self::ADMIN->value,
            self::DIRECTOR->value,
            self::MANAGER->value,
        ], true);
    }

    /** Admin, Manager, Director can edit products. */
    public static function canEditProducts(string $role): bool
    {
        return self::canManageUsers($role);
    }

    /** Roles that have product visibility rules (marketing, sale, customer service). */
    public static function productViewerRoles(): array
    {
        return [
            self::MARKETING->value,
            self::TELESALE->value,
            self::TELESALE_LEADER->value,
            self::CUSTOMER_SERVICE->value,
        ];
    }

    /** Whether this role is subject to product visibility (can view only allowed products). */
    public static function hasProductVisibility(string $role): bool
    {
        return in_array($role, self::productViewerRoles(), true);
    }

    /**
     * @return array<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
