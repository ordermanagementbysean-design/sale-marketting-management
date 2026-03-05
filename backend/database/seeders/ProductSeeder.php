<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Product;
use App\Models\ProductVisibility;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'name'           => 'Sản phẩm mẫu 1',
                'code'           => 'SP001',
                'unit'           => 'cái',
                'purchase_price' => 50000,
                'unit_price'     => 75000,
                'vat_percent'    => 10,
                'vat_code'       => 'VAT10',
                'weight_gram'    => 200,
                'status'         => 1,
            ],
            [
                'name'           => 'Sản phẩm mẫu 2',
                'code'           => 'SP002',
                'unit'           => 'hộp',
                'purchase_price' => 120000,
                'unit_price'     => 180000,
                'vat_percent'    => 8,
                'vat_code'       => 'VAT8',
                'weight_gram'    => 500,
                'status'         => 0,
            ],
        ];

        foreach ($items as $item) {
            $product = Product::firstOrCreate(
                ['code' => $item['code']],
                $item
            );
            foreach (UserRole::productViewerRoles() as $role) {
                ProductVisibility::firstOrCreate(
                    ['product_id' => $product->id, 'role' => $role],
                    ['allow_all' => true]
                );
            }
        }
    }
}
