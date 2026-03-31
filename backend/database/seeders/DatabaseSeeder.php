<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $password = '123456a@A';

        $roleUsers = [
            UserRole::MARKETING->value       => ['name' => 'Test Marketing', 'email' => 'test-marketing@example.com'],
            UserRole::ADMIN->value           => ['name' => 'Test Admin', 'email' => 'test-admin@example.com'],
            UserRole::TELESALE->value        => ['name' => 'Test Telesale', 'email' => 'test-telesale@example.com'],
            UserRole::TELESALE_LEADER->value => ['name' => 'Test Telesale Leader', 'email' => 'test-telesale-leader@example.com'],
            UserRole::DIRECTOR->value        => ['name' => 'Test Director', 'email' => 'test-director@example.com'],
            UserRole::ACCOUNTING->value      => ['name' => 'Test Accounting', 'email' => 'test-accounting@example.com'],
            UserRole::WAREHOUSE->value       => ['name' => 'Test Warehouse', 'email' => 'test-warehouse@example.com'],
            UserRole::MANAGER->value         => ['name' => 'Test Manager', 'email' => 'test-manager@example.com'],
            UserRole::CUSTOMER_SERVICE->value => ['name' => 'Test Customer Service', 'email' => 'test-customer-service@example.com'],
        ];

        foreach ($roleUsers as $role => $attrs) {
            User::factory()->create([
                'name'     => $attrs['name'],
                'email'    => $attrs['email'],
                'password' => $password,
                'role'     => $role,
            ]);
        }
    }
}
