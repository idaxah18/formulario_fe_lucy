<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$client = $app->make(App\Services\Gea\ProyectosGeaClient::class);

$tel = '0984977737';
$ced = '0953737707';
$placa = 'GST123';

$variants = [
    'doc_KIA_sonet' => ['marca' => 'KIA', 'modelo' => 'sonet'],
    'user_Kia_Sonet' => ['marca' => 'Kia', 'modelo' => 'Sonet'],
    'upper_KIA_SONET' => ['marca' => 'KIA', 'modelo' => 'SONET'],
];

foreach ($variants as $label => $mm) {
    echo "========== {$label} ({$mm['marca']} / {$mm['modelo']}) ==========".PHP_EOL;
    try {
        $af = $client->post('chatbot/proceso-automatico/afiliacion', [
            'telefono' => $tel,
            'cveafiliado' => $ced,
            'nivel_busquedad' => 'SUBSERVICIO',
            'id_servicio_subservicio' => 159,
            'tipo_servicio' => 'VIAL',
            'placa' => $placa,
            'chasis' => '',
            'plan_asistencia' => 'ASISTENCIAS',
        ]);
        $id = $af['data']['id_detalle_proceso_automatico_chatbot']
            ?? $af['data']['id_detalle_servicio_automatico']
            ?? null;
        echo 'afiliacion estado='.($af['estado'] ?? '?').' id='.$id.' msg='.($af['noticias']['mensaje'] ?? '').PHP_EOL;

        if (!$id) {
            echo json_encode($af, JSON_UNESCAPED_UNICODE).PHP_EOL;
            continue;
        }

        $veh = $client->post('chatbot/proceso-automatico/vehiculo-afiliacion', [
            'id_detalle_proceso_automatico_chatbot' => (int) $id,
            'placa' => $placa,
            'chasis' => '',
            'plan_asistencia' => 'ASISTENCIAS',
        ]);
        $vehCount = is_array($veh['data'] ?? null) ? count($veh['data']) : 0;
        echo 'vehiculo estado='.($veh['estado'] ?? '?').' data_count='.$vehCount.' msg='.($veh['noticias']['mensaje'] ?? '').PHP_EOL;

        $cov = $client->post('chatbot/proceso-automatico/cobertura', [
            'id_detalle_proceso_automatico_chatbot' => (int) $id,
            'aplica_servicio_automatico' => 1,
            'es_programado' => 0,
            'telefono' => $tel,
            'latitud' => '-2.22665473',
            'longitud' => '-79.89426860',
            'referencia' => 'urdesa',
            'direccion' => 'urdesa',
            'fecha_emergencia' => date('Y-m-d'),
            'plan_asistencia' => 'ASISTENCIAS',
            'tipo_servicio' => 'VIAL',
            'marca_vehiculo' => $mm['marca'],
            'modelo_vehiculo' => $mm['modelo'],
            'anio_vehiculo' => '2020',
            'tipo_vehiculo' => 'LIVIANO',
            'datos_extra' => ['serie' => 'asd', 'motor' => 'asdas', 'placa' => $placa],
        ]);
        echo 'cobertura estado='.($cov['estado'] ?? '?').PHP_EOL;
        echo 'cobertura noticias: '.json_encode($cov['noticias'] ?? [], JSON_UNESCAPED_UNICODE).PHP_EOL;
        if (isset($cov['data'])) {
            echo 'cobertura data keys: '.implode(', ', array_keys((array) $cov['data'])).PHP_EOL;
            if (isset($cov['data']['aplica_servicio_automatico'])) {
                echo 'aplica_servicio_automatico='.$cov['data']['aplica_servicio_automatico'].PHP_EOL;
            }
        }
    } catch (Throwable $e) {
        echo 'EXCEPTION: '.$e->getMessage().PHP_EOL;
    }
    echo PHP_EOL;
}
