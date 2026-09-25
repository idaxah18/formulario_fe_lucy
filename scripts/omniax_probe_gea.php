<?php

/**
 * Prueba servicios GEA (PDF servicios-omniax) vía OmniaxClient — sin imprimir secretos.
 */
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cedula = $argv[1] ?? '0979461382';
$telefono = $argv[2] ?? '0999999999';
$client = app(App\Services\Gea\OmniaxClient::class);

function line(string $label, array $payload): void
{
    echo "=== {$label} ===\n";
    echo 'estado='.($payload['estado'] ?? '?').' ';
    $msg = $payload['noticias']['mensaje'] ?? '';
    if ($msg) {
        echo mb_substr($msg, 0, 120);
    }
    echo "\n";
}

echo "Token…\n";
$client->token();
echo "OK\n\n";

$enProceso = $client->request('post', '/v1/chatbot/asistencias/en-proceso', [
    'json' => ['telefono_remitente' => $telefono],
]);
line('en-proceso remitente', $enProceso);

$listado = $client->request('post', '/v1/asistencias/listado/chatbot-telefono', [
    'json' => ['cveafiliado' => $cedula, 'telefono' => $telefono],
]);
line('listado chatbot-telefono', $listado);

$idAsist = null;
$data = $listado['data'] ?? [];
if (is_array($data) && isset($data[0]['id_asistencia'])) {
    $idAsist = (int) $data[0]['id_asistencia'];
} elseif (is_array($data['asistencias'] ?? null) && count($data['asistencias'])) {
    $idAsist = (int) ($data['asistencias'][0]['id_asistencia'] ?? 0);
}

if ($idAsist) {
    $cuest = $client->request('get', "/v1/m2m/cuestionarios/asistencias/{$idAsist}");
    line("cuestionario asistencia {$idAsist}", $cuest);
} else {
    echo "=== cuestionario ===\n(sin id_asistencia en listado; omitido)\n";
}

echo "\nListo.\n";
