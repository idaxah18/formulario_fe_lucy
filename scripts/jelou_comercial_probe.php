<?php

declare(strict_types=1);

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\Api\JelouDatumController;
use App\Http\Controllers\Api\JelouPayController;
use Illuminate\Http\Request;

$cedula = $argv[1] ?? '0979461382';

$datum = app(JelouDatumController::class);
$pay = app(JelouPayController::class);

function line(string $label, $response): void
{
    echo "=== {$label} ===\n";
    echo json_encode(json_decode($response->getContent(), true), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n\n";
}

line('venta lead', $datum->ventaLead(Request::create('/', 'GET', ['identificacion' => $cedula])));

line('derivacion', $datum->derivacionLead(Request::create('/', 'POST', [
    'identificacion' => $cedula,
    'nombre' => 'Probe QA',
    'telefono' => '0999999999',
    'producto' => 'probe',
])));

line('pay plans', $pay->plans());

line('pay checkout edoctor (simulado si sin bearer)', $pay->checkoutLink(Request::create('/', 'POST', [
    'product' => 'edoctor',
    'legal_id' => $cedula,
    'names' => 'Probe',
    'surname' => 'QA',
    'email' => 'probe@example.com',
])));
