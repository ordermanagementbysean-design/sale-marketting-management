<?php

return [
    'code_generator' => [
        /**
         * Prefix => keyword hints (normalized ASCII, lowercase).
         * Order matters: first match wins.
         */
        'categories' => [
            'FAS' => [
                'thoi trang', 'quan', 'ao', 'vay', 'dam', 'giay', 'lua bang', 'fashion', 'shirt', 'pants', 'dress',
            ],
            'HOU' => [
                'gia dung', 'hut bui', 'may hut bui', 'noi', 'bep', 'giuong', 'house', 'vacuum', 'kitchen', 'blender',
            ],
            'ELE' => [
                'dien tu', 'dong ho', 'tai nghe', 'loa', 'camera', 'smart', 'watch', 'electronics', 'phone',
            ],
            'BEA' => [
                'lam dep', 'my pham', 'massage', 'serum', 'kem', 'beauty', 'roller', 'skin',
            ],
        ],
        'default_prefix' => 'GEN',
    ],
];
