<?php

namespace App\Services;

use Illuminate\Support\Str;

class ProductCodeGenerator
{
    /**
     * Build a unique product code: [Prefix]-[NameAbbr]-[Year|Ymd].
     * Same rules as manual create when `code` is omitted.
     * 
     * @return string
     */
    public function generateProductCode(string $productName): string
    {
        $prefix  = $this->detectCategoryPrefix($productName);
        $abbr    = $this->buildNameAbbreviation($productName);
        $feature = $this->extractFeatureOrYear($productName);

        $base = "{$prefix}-{$abbr}-{$feature}";

        return Str::upper(substr($base, 0, 100));
    }

    private function detectCategoryPrefix(string $name): string
    {
        $normalized = $this->normalizeAscii($name);
        $categories = config('product.code_generator.categories', []);

        foreach ($categories as $prefix => $keywords) {
            foreach ($keywords as $kw) {
                $kwNorm = $this->normalizeAscii($kw);
                if ($kwNorm !== '' && str_contains($normalized, $kwNorm)) {
                    return $prefix;
                }
            }
        }

        return (string) config('product.code_generator.default_prefix', 'GEN');
    }

    private function buildNameAbbreviation(string $name): string
    {
        $normalized = $this->normalizeAscii($name);

        $parts = preg_split('/[^a-z0-9]+/i', $normalized) ?: [];
        $parts = array_values(array_filter($parts, fn ($p) => $p !== ''));

        if (count($parts) === 0) {
            return 'PRODUCT';
        }

        $picked = array_slice($parts, 0, 3);
        $picked = array_map(fn ($p) => strtoupper(substr($p, 0, 6)), $picked);
        $abbr   = implode('-', $picked);

        return $abbr !== '' ? $abbr : 'PRODUCT';
    }

    private function normalizeAscii(string $input): string
    {
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $input);
        if ($ascii === false) {
            $ascii = $input;
        }

        return strtolower($ascii);
    }

    private function extractFeatureOrYear(string $name): string
    {
        if (preg_match('/\b(19|20)\d{2}\b/', $name, $m) === 1) {
            return $m[0];
        }

        return now()->format('Ymd');
    }
}
