<?php

namespace App\Enums;

enum UserRole: string
{
    case MARKETING      = 'marketing';
    case ADMIN          = 'admin';
    case TELESALE       = 'telesale';
    case TELESALE_LEADER = 'telesale_leader';
    case DIRECTOR       = 'director';
    case ACCOUNTING     = 'accounting';
    case WAREHOUSE      = 'warehouse';
    case MANAGER        = 'manager';

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

    /**
     * @return array<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
