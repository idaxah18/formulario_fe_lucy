<?php

declare(strict_types=1);

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Support\Integrations\IntegrationRegistry;

$report = IntegrationRegistry::statusReport();
$exit = 0;

echo "Lucy webview — estado de integraciones (.env)\n\n";

foreach ($report as $id => $row) {
    $flag = $row['configured'] ? 'OK ' : 'FAIL';
    $opt = $row['optional'] ? ' (opcional)' : ' (requerida para su API)';
    echo "[{$flag}] {$id}{$opt} — {$row['label']}\n";
    if (! $row['configured']) {
        foreach ($row['missing_env'] as $env) {
            echo "      → falta {$env}\n";
        }
        if (! $row['optional']) {
            $exit = 1;
        }
    }
}

echo "\ncore_ready (omniax + lopdp): ".(IntegrationRegistry::coreReady() ? 'yes' : 'no')."\n";

exit($exit);
