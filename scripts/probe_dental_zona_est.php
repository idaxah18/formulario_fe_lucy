<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$c = app(App\Services\Gea\OmniaxClient::class);
$med = $c->request('get', '/v1/chatbot/zonas-por-ciudad', ['query' => ['id_servicio' => 297]]);
$first = $med['data'][0] ?? null;
$zona = $first['zonas'][0] ?? null;
if (! $zona) {
    echo "no zona from medico\n";
    exit(1);
}
echo 'zona medico id_zona='.$zona['id_zona'].' '.$zona['nombre_zona']."\n";

foreach ([297, 298, 300] as $idServ) {
    try {
        $r = $c->request('post', '/v1/chatbot/medico-dental/establecimientos', [
            'json' => ['id_servicio' => $idServ, 'id_zona' => (int) $zona['id_zona']],
        ]);
        $list = $r['data'] ?? [];
        $n = is_array($list) ? count($list) : 0;
        echo "establecimientos id_servicio={$idServ} count={$n}\n";
    } catch (Throwable $e) {
        echo "establecimientos id_servicio={$idServ} ERR: ".$e->getMessage()."\n";
    }
}
