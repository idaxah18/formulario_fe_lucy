<?php

declare(strict_types=1);

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\Api\AseguradoraAsapController;
use Illuminate\Http\Request;

$placa = strtoupper($argv[1] ?? 'GYE1234');

$controller = app(AseguradoraAsapController::class);

function line(string $label, $response): void
{
    echo "=== {$label} ===\n";
    echo json_encode(json_decode($response->getContent(), true), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n\n";
}

line('consulta-placa-vial', $controller->consultaPlacaVial(Request::create('/', 'POST', ['placa' => $placa])));

line('consulta-placa-siniestro', $controller->consultaPlacaSiniestro(Request::create('/', 'POST', ['placa' => $placa])));

line('provincias EC', $controller->provincias(Request::create('/', 'GET', ['iso' => 'EC'])));

$provRes = json_decode($controller->provincias(Request::create('/', 'GET'))->getContent(), true);
$firstProv = null;
$data = $provRes['data'] ?? $provRes;
if (is_array($data)) {
    $first = $data[0] ?? null;
    $firstProv = is_array($first) ? ($first['id'] ?? $first['id_estado_provincia_depto'] ?? null) : null;
}
if ($firstProv) {
    line("ciudades provincia {$firstProv}", $controller->ciudadesPorProvincia(Request::create('/', 'GET'), (int) $firstProv));
}

line('parentesco', $controller->parentesco(Request::create('/', 'GET', ['iso' => 'EC'])));

line('inspeccion buscar (código ejemplo)', $controller->inspeccionBuscarAseguradora(Request::create('/', 'POST', [
    'codigo_riesgo' => $placa,
])));
