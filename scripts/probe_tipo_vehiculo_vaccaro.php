<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$client = $app->make(App\Services\Gea\ProyectosGeaClient::class);

$tel = $argv[1] ?? '0984977737';
$ced = $argv[2] ?? '0929468098';
$placa = strtoupper($argv[3] ?? 'GST123');

try {
    $af = $client->post('chatbot/proceso-automatico/afiliacion', [
        'telefono' => $tel,
        'cveafiliado' => $ced,
        'nivel_busquedad' => 'SUBSERVICIO',
        'id_servicio_subservicio' => 159,
        'tipo_servicio' => 'VIAL',
        'placa' => $placa,
        'plan_asistencia' => 'ASISTENCIAS',
    ]);
    echo 'AFILIACION: '.json_encode($af, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT).PHP_EOL;
    $id = $af['data']['id_detalle_proceso_automatico_chatbot']
        ?? $af['data']['id_detalle_servicio_automatico']
        ?? null;
    if (!$id) {
        exit(1);
    }
    $veh = $client->post('chatbot/proceso-automatico/vehiculo-afiliacion', [
        'id_detalle_proceso_automatico_chatbot' => (int) $id,
        'placa' => $placa,
        'plan_asistencia' => 'ASISTENCIAS',
    ]);
    echo 'VEHICULO: '.json_encode($veh, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT).PHP_EOL;

    $tipos = ['MOTOCICLETA', 'LIVIANO', 'SEMI PESADO', 'PESADO', 'EXTRA PESADO', 'MEDIANO', 'BLINDADO'];
    foreach ($tipos as $tipo) {
        try {
            $cov = $client->post('chatbot/proceso-automatico/cobertura', [
                'id_detalle_proceso_automatico_chatbot' => (int) $id,
                'aplica_servicio_automatico' => 1,
                'es_programado' => 0,
                'latitud' => '-2.156992',
                'longitud' => '-79.840201',
                'referencia' => 'urdesa',
                'direccion' => 'urdesa',
                'fecha_emergencia' => date('Y-m-d'),
                'plan_asistencia' => 'ASISTENCIAS',
                'tipo_servicio' => 'VIAL',
                'marca_vehiculo' => 'KIA',
                'modelo_vehiculo' => 'SONET',
                'anio_vehiculo' => '2020',
                'tipo_vehiculo' => $tipo,
                'datos_extra' => ['serie' => 'x', 'motor' => 'y'],
            ]);
            echo "COBERTURA OK [$tipo]: ".($cov['noticias']['mensaje'] ?? 'ok').PHP_EOL;
        } catch (Throwable $e) {
            echo "COBERTURA FAIL [$tipo]: ".$e->getMessage().PHP_EOL;
        }
    }
} catch (Throwable $e) {
    echo 'ERR: '.$e->getMessage().PHP_EOL;
}
