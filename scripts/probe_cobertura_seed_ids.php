<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$client = $app->make(App\Services\Gea\ProyectosGeaClient::class);
$base = rtrim(config('services.gea_omniax.base_url'), '/');
echo "base_url={$base}".PHP_EOL;

foreach ([37, 38, 40] as $id) {
    try {
        $cov = $client->post('chatbot/proceso-automatico/cobertura', [
            'id_detalle_proceso_automatico_chatbot' => $id,
            'aplica_servicio_automatico' => 1,
            'es_programado' => 0,
            'telefono' => '0984977737',
            'latitud' => '-2.22665473',
            'longitud' => '-79.89426860',
            'referencia' => 'urdesa',
            'direccion' => 'urdesa',
            'fecha_emergencia' => date('Y-m-d'),
            'plan_asistencia' => 'ASISTENCIAS',
            'tipo_servicio' => 'VIAL',
            'marca_vehiculo' => 'Kia',
            'modelo_vehiculo' => 'Sonet',
            'anio_vehiculo' => '2020',
            'tipo_vehiculo' => 'LIVIANO',
            'datos_extra' => ['serie' => 'asd', 'motor' => 'asdas'],
        ]);
        echo "id {$id} OK estado=".($cov['estado'] ?? '?').' msg='.($cov['noticias']['mensaje'] ?? '').PHP_EOL;
    } catch (Throwable $e) {
        echo "id {$id} FAIL: ".$e->getMessage().PHP_EOL;
    }
}
