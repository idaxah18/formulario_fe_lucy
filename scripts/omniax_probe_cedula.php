<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cedula = $argv[1] ?? '0979461382';
$idServicio = (int) ($argv[2] ?? 297);
$client = app(App\Services\Gea\OmniaxClient::class);

foreach ([false, true] as $paraReagendar) {
    $label = $paraReagendar ? 'true' : 'false';
    echo "=== para_reagendar={$label} id_servicio={$idServicio} ===\n";
    $res = $client->request('post', '/v1/chatbot/medico-dental/asistencias/en-proceso', [
        'json' => [
            'identificacion_titular' => $cedula,
            'id_servicio' => $idServicio,
            'para_reagendar' => $paraReagendar,
        ],
    ]);
    $list = $res['data']['asistencias'] ?? [];
    echo 'total asistencias: '.count($list)."\n";
    foreach ($list as $a) {
        $detalle = trim((string) ($a['detalle'] ?? ''));
        $fecha = (string) ($a['fecha_cita'] ?? '');
        $reagendable = $detalle !== ''
            && ! empty($a['id_establecimiento'])
            && $fecha !== ''
            && ! str_starts_with($fecha, '0000');
        if ($idServicio === 297) {
            $reagendable = $reagendable && ! empty($a['id_especialidad']);
        }
        echo sprintf(
            "id=%s reagendable=%s detalle=%s fecha=%s id_est=%s id_esp=%s\n",
            $a['id_asistencia'] ?? '?',
            $reagendable ? 'YES' : 'no',
            $detalle !== '' ? substr($detalle, 0, 40) : '(vacío)',
            $fecha ?: '(null)',
            $a['id_establecimiento'] ?? 'null',
            $a['id_especialidad'] ?? 'null',
        );
    }
    echo "\n";
}
