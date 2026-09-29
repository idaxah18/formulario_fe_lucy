<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$client = $app->make(App\Services\Gea\OmniaxClient::class);
$token = $client->token();
$base = rtrim(config('services.gea_omniax.base_url'), '/');

$paths = [
    '/v1/chatbot/asistencias/en-proceso',
    '/v1/chatbot/proceso-automatico/afiliacion',
    '/v1/proyectos/chatbot/proceso-automatico/afiliacion',
    '/chatbot/proceso-automatico/afiliacion',
];

$bodyEnProceso = json_encode(['telefono_remitente' => '0999999999']);
$bodyAfiliacion = json_encode([
    'telefono' => '0999999999',
    'cveafiliado' => '0000000000',
    'nivel_busquedad' => 'SUBSERVICIO',
    'id_servicio_subservicio' => 57,
    'tipo_servicio' => 'HOGAR',
    'plan_asistencia' => 'ASISTENCIAS',
]);

foreach ($paths as $path) {
    $url = $base.$path;
    $body = str_contains($path, 'en-proceso') ? $bodyEnProceso : $bodyAfiliacion;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Content-Type: application/json',
            'Authorization: Bearer '.$token,
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
    ]);
    $raw = curl_exec($ch);
    $err = curl_error($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    echo $path.PHP_EOL;
    if ($err) {
        echo "  curl: {$err}".PHP_EOL;
    } else {
        echo "  http: {$code} ".substr((string) $raw, 0, 120).PHP_EOL;
    }
}
