<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cedula = $argv[1] ?? '0979461382';
$idAsistencia = (int) ($argv[2] ?? 3069147);
$client = app(App\Services\Gea\OmniaxClient::class);

$enProceso = $client->request('post', '/v1/chatbot/medico-dental/asistencias/en-proceso', [
    'json' => [
        'identificacion_titular' => $cedula,
        'id_servicio' => 297,
        'para_reagendar' => true,
    ],
]);

echo "=== en-proceso para_reagendar=true ===\n";
echo json_encode($enProceso, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n\n";

$bodies = [
    'pdf_minimal' => [
        'telefono' => '0999999999',
        'id_asistencia' => $idAsistencia,
        'fecha' => '2026-09-29',
        'hora' => '09:00',
    ],
    'extended' => [
        'telefono' => '0999999999',
        'id_servicio' => 297,
        'identificacion_titular' => $cedula,
        'nombre_titular' => 'Titular Prueba',
        'latitud' => '-2.164525162397198',
        'longitud' => '-79.89574580754577',
        'aplica_seguimiento_dental' => false,
        'id_asistencia' => $idAsistencia,
        'id_especialidad' => 1,
        'id_establecimiento' => 4528,
        'fecha' => '2026-09-29',
        'hora' => '09:00',
    ],
];

foreach ($bodies as $label => $json) {
    echo "=== reagendar ($label) ===\n";
    try {
        $res = $client->request('post', '/v1/chatbot/medico-dental/asistencias/reagendar', [
            'json' => $json,
        ]);
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
    } catch (App\Exceptions\OmniaxApiException $e) {
        echo 'OMNIAX '.$e->statusCode().': '.$e->getMessage()."\n";
        echo json_encode($e->payload(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
    } catch (Throwable $e) {
        echo 'ERROR: '.$e->getMessage()."\n";
    }
    echo "\n";
}
