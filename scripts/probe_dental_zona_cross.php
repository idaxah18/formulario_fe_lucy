<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$c = app(App\Services\Gea\OmniaxClient::class);
$den = $c->request('get', '/v1/chatbot/zonas-por-ciudad', ['query' => ['id_servicio' => 300]]);
$first = $den['data'][0] ?? null;
$zona = $first['zonas'][0] ?? null;
echo 'from 300: '.($first['nombre_ciudad'] ?? '?').' zona '.($zona['nombre_zona'] ?? '?').' id='.$zona['id_zona']."\n";

foreach ([298, 300] as $idServ) {
    $r = $c->request('post', '/v1/chatbot/medico-dental/establecimientos', [
        'json' => ['id_servicio' => $idServ, 'id_zona' => (int) $zona['id_zona']],
    ]);
    echo "est id_servicio={$idServ} count=".count($r['data'] ?? [])."\n";
}
