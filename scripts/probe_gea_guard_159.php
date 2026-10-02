<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$req = Illuminate\Http\Request::create('/api/v1/omniax/gea/asistencias/gea', 'POST', [], [], [], [
    'CONTENT_TYPE' => 'application/json',
], json_encode([
    'telefono' => '0999999999',
    'nombres' => 'Test',
    'cveafiliado' => '0979461382',
    'id_servicio' => '159',
    'direccion' => 'test',
    'latitud' => '-2.17',
    'longitud' => '-79.92',
]));
$res = $kernel->handle($req);
echo 'status='.$res->getStatusCode().' body='.$res->getContent().PHP_EOL;
