<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$client = $app->make(App\Services\Gea\ProyectosGeaClient::class);

try {
    $r = $client->post('chatbot/proceso-automatico/afiliacion', [
        'telefono' => '0999999999',
        'cveafiliado' => '0000000000',
        'nivel_busquedad' => 'SUBSERVICIO',
        'id_servicio_subservicio' => 57,
        'tipo_servicio' => 'HOGAR',
        'plan_asistencia' => 'ASISTENCIAS',
    ]);
    echo json_encode($r, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
} catch (Throwable $e) {
    echo 'ERROR: '.$e->getMessage().PHP_EOL;
}
