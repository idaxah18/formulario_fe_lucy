<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$c = app(App\Services\Gea\OmniaxClient::class);
foreach ([297, 298] as $id) {
    try {
        $r = $c->request('get', '/v1/chatbot/zonas-por-ciudad', ['query' => ['id_servicio' => $id]]);
        $data = $r['data'] ?? null;
        $count = is_array($data) ? count($data) : 0;
        echo "id_servicio={$id} count={$count}\n";
        if ($count > 0) {
            echo '  first ciudad: '.($data[0]['nombre_ciudad'] ?? '?')."\n";
        }
    } catch (Throwable $e) {
        echo "id_servicio={$id} ERR: ".$e->getMessage()."\n";
    }
}
