<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cedula = $argv[1] ?? '0979461382';
$client = app(App\Services\Gea\OmniaxClient::class);

foreach ([false, true] as $paraReagendar) {
    $label = $paraReagendar ? 'true' : 'false';
    $res = $client->request('post', '/v1/chatbot/medico-dental/asistencias/en-proceso', [
        'json' => [
            'identificacion_titular' => $cedula,
            'id_servicio' => 297,
            'para_reagendar' => $paraReagendar,
        ],
    ]);
    $list = $res['data']['asistencias'] ?? [];
    echo "=== en-proceso para_reagendar={$label} (n=".count($list).") ===\n";
    foreach ($list as $a) {
        echo json_encode($a, JSON_UNESCAPED_UNICODE)."\n";
    }
    echo "\n";
}

$id = (int) ($argv[2] ?? 3069147);
$fecha = $argv[3] ?? '2026-11-15';
$hora = $argv[4] ?? '14:00';
$body = [
    'telefono' => '0999999999',
    'id_asistencia' => $id,
    'fecha' => $fecha,
    'hora' => $hora,
];
echo "=== POST reagendar id_asistencia={$id} fecha={$fecha} hora={$hora} ===\n";
try {
    $res = $client->request('post', '/v1/chatbot/medico-dental/asistencias/reagendar', ['json' => $body]);
    echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
} catch (App\Exceptions\OmniaxApiException $e) {
    echo 'HTTP '.$e->statusCode()."\n";
    echo json_encode($e->payload(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
}
