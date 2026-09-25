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

function line(string $label, $response): void
{
    echo "=== {$label} ===\n";
    echo json_encode(json_decode($response->getContent(), true), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n\n";
}

line('asistencia-en-curso', $controller->asistenciaEnCurso(Request::create('/', 'POST', ['telefono' => $telefono])));

line('validacion-cedula', $controller->validacionCedula(Request::create('/', 'POST', ['identificacion' => $cedula])));

line('menu-proveedor valida (id ejemplo)', $controller->menuProveedorValida(
    Request::create('/', 'GET', ['opcion' => 'contacto']),
    3077019,
));

line('notificar-cabina HOGAR', $controller->notificarCabina(Request::create('/', 'POST', [
    'telefono' => $telefono,
    'cveafiliado' => $cedula,
    'tipo_servicio' => 'HOGAR',
    'plan_asistencia' => 'ASISTENCIAS',
    'placa' => '',
    'chasis' => '',
])));
