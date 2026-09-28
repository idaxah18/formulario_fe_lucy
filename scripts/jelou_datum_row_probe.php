<?php

declare(strict_types=1);

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\Jelou\JelouApiClient;

$client = app(JelouApiClient::class);

try {
    $q = $client->queryRows('venta_asistencias', ['limit' => 1]);
    echo "query ok:\n".json_encode($q, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
} catch (Throwable $e) {
    echo "query err: ".$e->getMessage()."\n";
}

try {
    $c = $client->createRow('venta_asistencias', [
        'identificacion' => '0999999999',
        'nombre' => 'Probe',
        'telefono' => '0999999999',
        'producto' => 'probe',
        'accion_ejecutada' => 'INTERESADO',
        'notas' => 'probe script',
        'origen' => 'lucy_webview',
    ]);
    echo "create ok:\n".json_encode($c, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
} catch (Throwable $e) {
    echo "create err: ".$e->getMessage()."\n";
    if ($e->getPrevious()) {
        echo "prev: ".$e->getPrevious()->getMessage()."\n";
    }
}
