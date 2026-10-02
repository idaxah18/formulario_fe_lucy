<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\Api\GeaToolsController;
use Illuminate\Http\Request;

$cedula = $argv[1] ?? '0979461382';
$telefono = $argv[2] ?? '0999999999';
$controller = app(GeaToolsController::class);

foreach (['HOGAR', 'VIAL', 'MEDICO', 'DENTAL'] as $tipo) {
    $res = $controller->notificarCabina(Request::create('/', 'POST', [
        'telefono' => $telefono,
        'cveafiliado' => $cedula,
        'tipo_servicio' => $tipo,
        'plan_asistencia' => 'ASISTENCIAS',
        'placa' => '',
    ]));
    $j = json_decode($res->getContent(), true);
    echo "{$tipo} branch=".($j['branch'] ?? '?');
    $msg = $j['raw']['noticias']['mensaje'] ?? $j['message'] ?? '';
    if ($msg) {
        echo ' | '.mb_substr($msg, 0, 100);
    }
    echo "\n";
}
