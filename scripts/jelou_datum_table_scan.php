<?php

declare(strict_types=1);

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

$creds = [
    'tool_1942' => [
        env('JELOU_DATUM_BASIC_USER'),
        env('JELOU_DATUM_BASIC_PASSWORD'),
    ],
    'venta_wf' => [
        '4K44KPUkHrjCeC6Bn6Dcfa28owGrGZnL',
        'KpQpRKJk0CDAFOuIeaLDmsBiUzpkwSqNjzMuyuK9FjCWcmdEj3oH2xnJ8zAPYh7P',
    ],
];

foreach ($creds as $label => [$u, $p]) {
    echo "=== {$label} ===\n";
    foreach ([1435, 281, 76, 2756, 2254] as $id) {
        $r = Http::acceptJson()->withBasicAuth((string) $u, (string) $p)
            ->get("https://api.jelou.ai/v2/databases/{$id}/rows", ['limit' => 1]);
        echo "  {$id}: {$r->status()}\n";
    }
}
