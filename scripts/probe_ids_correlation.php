<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$c = app(App\Services\Gea\OmniaxClient::class);
$ced = $argv[1] ?? '0979461382';

for ($id = 290; $id <= 305; $id++) {
    try {
        $ep = $c->request('post', '/v1/chatbot/medico-dental/asistencias/en-proceso', [
            'json' => [
                'identificacion_titular' => $ced,
                'id_servicio' => $id,
                'para_reagendar' => false,
            ],
        ]);
        $asist = $ep['data']['asistencias'] ?? $ep['data'] ?? [];
        $n = is_array($asist) ? count($asist) : 0;
        $z = $c->request('get', '/v1/chatbot/zonas-por-ciudad', ['query' => ['id_servicio' => $id]]);
        $zc = count($z['data'] ?? []);
        echo "id={$id} en_proceso={$n} zonas={$zc}\n";
    } catch (Throwable $e) {
        echo "id={$id} ERR: ".$e->getMessage()."\n";
    }
}
