<?php

namespace App\Jobs;

use App\Enums\UserRole;
use App\Models\Product;
use App\Models\ProductVisibility;
use App\Services\ProductCodeGenerator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ImportProductsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public string $importId,
        /** @var list<array<string, mixed>> */
        public array $rows,
    ) {}

    public function handle(): void
    {
        Cache::put($this->cacheKey(), [
            'status' => 'processing',
        ], now()->addDay());

        $created   = 0;
        $rowErrors = [];

        foreach ($this->rows as $i => $row) {
            $line = $i + 1;

            $name   = trim($row['name'] ?? '');
            $code   = trim($row['code'] ?? '');
            $status = isset($row['status']) ? (int) $row['status'] : -1;

            $messages = [];
            if ($name === '') {
                $messages[] = 'name is required.';
            } elseif (mb_strlen($name) > 255) {
                $messages[] = 'name must be less than 255 characters.';
            }

            if (empty($code)) {
                $code = app(ProductCodeGenerator::class)->generateProductCode($name);
            }

            if (mb_strlen($code) > 200) {
                $messages[] = 'code must be less than 200 characters.';
            }

            if (! in_array($status, [0, 1], true)) {
                $messages[] = 'status must be 0 (disabled) or 1 (active).';
            }

            if (! empty($messages)) {
                $rowErrors[] = ['row' => $line, 'messages' => $messages];

                continue;
            }

            if (Product::where('code', $code)->exists()) {
                $rowErrors[] = [
                    'row'      => $line,
                    'messages' => ['Product code already exists.'],
                ];

                continue;
            }

            try {
                DB::transaction(function () use ($name, $code, $status, $row) {
                    $unit = isset($row['unit']) && trim((string) $row['unit']) !== ''
                        ? trim((string) $row['unit'])
                        : 'cái';
                    $purchasePrice = isset($row['purchase_price']) ? (float) $row['purchase_price'] : 0.0;
                    $unitPrice     = isset($row['unit_price']) ? (float) $row['unit_price'] : 0.0;
                    $vatPercent    = isset($row['vat_percent']) ? (float) $row['vat_percent'] : 0.0;
                    $weightGram    = isset($row['weight_gram']) ? (int) $row['weight_gram'] : 0;
                    $vatCodeRaw    = trim((string) ($row['vat_code'] ?? ''));
                    $vatCode       = $vatCodeRaw !== '' ? $vatCodeRaw : null;

                    $product = Product::create([
                        'name'           => $name,
                        'code'           => $code,
                        'status'         => $status,
                        'unit'           => $unit,
                        'purchase_price' => $purchasePrice,
                        'unit_price'     => $unitPrice,
                        'vat_percent'    => $vatPercent,
                        'vat_code'       => $vatCode,
                        'weight_gram'    => $weightGram,
                    ]);
                    foreach (UserRole::productViewerRoles() as $role) {
                        ProductVisibility::create([
                            'product_id' => $product->id,
                            'role'       => $role,
                            'allow_all'  => true,
                        ]);
                    }
                });

                $created++;
            } catch (\Throwable $e) {
                report($e);
                $rowErrors[] = [
                    'row'      => $line,
                    'messages' => ['Server error while saving this row.'],
                ];
            }
        }

        Cache::put($this->cacheKey(), [
            'status'     => 'completed',
            'created'    => $created,
            'row_errors' => $rowErrors,
        ], now()->addDay());
    }

    public function failed(?\Throwable $exception): void
    {
        Cache::put($this->cacheKey(), [
            'status'  => 'failed',
            'message' => 'Import job failed.',
        ], now()->addDay());
    }

    private function cacheKey(): string
    {
        return 'product_import:' . $this->importId;
    }
}
