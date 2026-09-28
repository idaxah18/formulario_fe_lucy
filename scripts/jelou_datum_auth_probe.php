<?php

declare(strict_types=1);

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

$token = (string) config('services.jelou.api_token');
$url = 'https://api.jelou.ai/v2/databases/1435/rows';

$modes = [
    'bearer_withToken' => fn () => Http::acceptJson()->withToken($token)->get($url, ['limit' => 1]),
    'bearer_manual' => fn () => Http::acceptJson()->withHeaders(['Authorization' => 'Bearer '.$token])->get($url, ['limit' => 1]),
    'x_api_key' => fn () => Http::acceptJson()->withHeaders(['x-api-key' => $token])->get($url, ['limit' => 1]),
    'authorization_raw' => fn () => Http::acceptJson()->withHeaders(['Authorization' => $token])->get($url, ['limit' => 1]),
];

$user = env('JELOU_DATUM_BASIC_USER');
$pass = env('JELOU_DATUM_BASIC_PASSWORD');
$r = Http::acceptJson()->withBasicAuth((string) $user, (string) $pass)
    ->get('https://api.jelou.ai/v2/databases/1435/rows', ['limit' => 1]);
echo 'basic_get: '.$r->status().' '.substr((string) $r->body(), 0, 400)."\n";

$r2 = Http::acceptJson()->withBasicAuth((string) $user, (string) $pass)
    ->post('https://api.jelou.ai/v2/databases/1435/rows', [
        'identificacion' => '0979461382',
        'producto' => 'probe',
        'accion_ejecutada' => 'INTERESADO',
    ]);
echo 'basic_post: '.$r2->status().' '.substr((string) $r2->body(), 0, 400)."\n";

foreach ([1435, 281, 76, 2756, 2254] as $id) {
    $t = Http::acceptJson()->withBasicAuth((string) $user, (string) $pass)
        ->get("https://api.jelou.ai/v2/databases/{$id}/rows", ['limit' => 1]);
    echo "table {$id}: {$t->status()} ".substr((string) $t->body(), 0, 100)."\n";
}
