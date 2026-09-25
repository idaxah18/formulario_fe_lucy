<?php

declare(strict_types=1);

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\Api\GeaToolsController;
use Illuminate\Http\Request;

$cedula = $argv[1] ?? '0979461382';
$telefono = $argv[2] ?? '0999999999';

$controller = app(GeaToolsController::class);

$response = $controller->notificarCabina(Request::create('/', 'POST', [
    'telefono' => $telefono,
    'cveafiliado' => $cedula,
    'tipo_servicio' => 'MEDICO',
    'plan_asistencia' => 'ASISTENCIAS',
    'placa' => '',
    'chasis' => '',
]));

echo json_encode(json_decode($response->getContent(), true), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
