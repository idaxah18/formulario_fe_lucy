<?php

/**
 * Ejecuta la colección directa Omniax con credenciales del .env (no imprime secretos).
 */

$root = dirname(__DIR__);
$envFile = $root.'/.env';
if (! is_file($envFile)) {
    fwrite(STDERR, "Falta .env\n");
    exit(1);
}

$vars = [];
foreach (file($envFile, FILE_IGNORE_NEW_LINES) as $line) {
    $line = trim($line);
    if ($line === '' || str_starts_with($line, '#') || ! str_contains($line, '=')) {
        continue;
    }
    [$key, $value] = explode('=', $line, 2);
    $value = trim($value, " \t\"'");
    $vars[$key] = $value;
}

$clientId = $vars['GEA_OMNIAX_CLIENT_ID'] ?? '';
$clientSecret = $vars['GEA_OMNIAX_CLIENT_SECRET'] ?? '';
if ($clientId === '' || $clientSecret === '') {
    fwrite(STDERR, "Configura GEA_OMNIAX_CLIENT_ID y GEA_OMNIAX_CLIENT_SECRET en .env\n");
    exit(1);
}

$collection = $root.'/postman/collections/omniax-direct-test-ec';
$environment = $root.'/postman/environments/omniax-direct.yaml';

$cmd = [
    'postman',
    'collection',
    'run',
    $collection,
    '-e',
    $environment,
    '--env-var',
    'omniax_client_id='.$clientId,
    '--env-var',
    'omniax_client_secret='.$clientSecret,
];

$escaped = array_map(static fn (string $p) => escapeshellarg($p), $cmd);
passthru(implode(' ', $escaped), $code);
exit($code);
