<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cedula = $argv[1] ?? '0979461382';
$client = app(App\Services\Gea\OmniaxClient::class);

$esp = $client->request('get', '/v1/chatbot/medico/especialidades');
$items = $esp['data'] ?? [];
echo 'especialidades count: '.count($items)."\n";

$mg = null;
foreach ($items as $e) {
    if (stripos($e['nombre'] ?? '', 'MEDICINA GENERAL') !== false) {
        $mg = $e;
        break;
    }
}
if (! $mg && count($items)) {
    $mg = $items[0];
}
echo 'picked: '.json_encode($mg, JSON_UNESCAPED_UNICODE)."\n";

if ($mg) {
    $ap = $client->request('post', '/v1/chatbot/medico/establecimientos/aplica-asignacion', [
        'json' => [
            'identificacion_titular' => $cedula,
            'id_especialidad' => (int) $mg['id'],
        ],
    ]);
    echo 'aplica medico: '.json_encode($ap, JSON_UNESCAPED_UNICODE)."\n";
}

$idDental = (int) (getenv('VITE_OMNIAX_ID_SERVICIO_DENTAL') ?: 298);
$apDen = $client->request('post', '/v1/chatbot/dental/establecimientos/aplica-asignacion', [
    'json' => ['identificacion_titular' => $cedula],
]);
echo 'aplica dental: '.json_encode($apDen, JSON_UNESCAPED_UNICODE)."\n";
