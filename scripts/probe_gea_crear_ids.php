<?php

/**
 * Prueba Omniax POST /v1/chatbot/asistencias/gea por cada id_servicio del mapa FE.
 * No crea asistencia real si Omniax valida antes; registra titulo/mensaje por id.
 */
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cedula = $argv[1] ?? '0979461382';
$telefono = $argv[2] ?? '0999999999';
$nombre = $argv[3] ?? 'PRUEBA LUCY WEBVIEW';

$ids = [
    'Plomero' => '260',
    'Electricista' => '288',
    'Cerrajero' => '259',
    'Vidriería' => '289',
    'Limpieza y mantenimiento' => '484',
    'Spa y peluquería' => '512',
    'Handyman' => '515',
    'Grúa (otro motivo)' => '256',
    'Grúa por avería' => '256',
    'Cambio de llanta' => '258',
    'Suministro de gasolina' => '258',
    'Paso de corriente' => '258',
    'Cerrajería de puertas' => '299',
    'Inspector in situ' => '295',
    'Asistencia Legal telefónica' => '322',
    'Otras soluciones' => '476',
    'Ambulancia' => '257',
    'Orientación médica telefónica' => '302',
    'Médico a domicilio' => '303',
    'Bienestar y nutrición' => '304',
    'id_159_automatico_INVALIDO' => '159',
];

$client = app(App\Services\Gea\OmniaxClient::class);
$client->token();

$base = [
    'telefono' => $telefono,
    'nombres' => $nombre,
    'cveafiliado' => $cedula,
    'direccion' => 'PRUEBA QA — no despachar',
    'latitud' => '-2.170998',
    'longitud' => '-79.922359',
    'plan_asistencia' => 'ASISTENCIAS',
    'placa' => 'TST123',
];

foreach ($ids as $label => $idServicio) {
    $body = array_merge($base, ['id_servicio' => $idServicio]);
    try {
        $res = $client->request('post', '/v1/chatbot/asistencias/gea', ['json' => $body]);
        $titulo = $res['noticias']['titulo'] ?? ($res['estado'] ?? '?');
        $msg = mb_substr((string) ($res['noticias']['mensaje'] ?? ''), 0, 140);
        $idAsist = $res['data']['id_asistencia'] ?? $res['data']['id'] ?? '';
        echo "{$label} | id={$idServicio} | estado=".($res['estado'] ?? '?')." | {$titulo} | {$msg}";
        if ($idAsist) {
            echo " | id_asistencia={$idAsist}";
        }
        echo "\n";
    } catch (Throwable $e) {
        echo "{$label} | id={$idServicio} | ERR: ".$e->getMessage()."\n";
    }
}
