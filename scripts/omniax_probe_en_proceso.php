<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cedula = $argv[1] ?? '0979461382';
$idServicio = (int) ($argv[2] ?? 297);
$client = app(App\Services\Gea\OmniaxClient::class);

foreach ([false, true] as $paraReagendar) {
    $payload = $client->request('post', '/v1/chatbot/medico-dental/asistencias/en-proceso', [
        'json' => [
            'identificacion_titular' => $cedula,
            'id_servicio' => $idServicio,
            'para_reagendar' => $paraReagendar,
        ],
    ]);
    echo 'para_reagendar='.($paraReagendar ? 'true' : 'false').' id_servicio='.$idServicio.PHP_EOL;
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL.'---'.PHP_EOL;
}
