<?php

namespace App\Services\Jelou;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/** Cliente REST Jelou (Datum v2, etc.). */
class JelouApiClient
{
    public function configured(): bool
    {
        return $this->hasAuthProfile('venta')
            || $this->hasAuthProfile('default')
            || (bool) config('services.jelou.api_token');
    }

    private function hasAuthProfile(string $profile): bool
    {
        $auth = config("services.jelou.datum_auth_profiles.{$profile}");

        if (! is_array($auth)) {
            return false;
        }

        $user = $auth['user'] ?? null;
        $pass = $auth['password'] ?? null;

        return $user !== null && $user !== '' && $pass !== null && $pass !== '';
    }

    private function httpClientForTable(string $tableKey): PendingRequest
    {
        $profile = (string) config("services.jelou.datum_table_auth.{$tableKey}", 'default');
        $auth = config("services.jelou.datum_auth_profiles.{$profile}");

        if (is_array($auth) && ($auth['user'] ?? '') !== '' && ($auth['password'] ?? '') !== '') {
            return Http::acceptJson()->timeout(45)->withBasicAuth(
                (string) $auth['user'],
                (string) $auth['password'],
            );
        }

        $token = config('services.jelou.api_token');
        if ($token) {
            return Http::acceptJson()->timeout(45)->withToken((string) $token);
        }

        throw new RuntimeException(
            "Datum Jelou sin credenciales para tabla «{$tableKey}» (perfil {$profile}).",
        );
    }

    public function get(string $path, array $query = [], ?string $tableKey = null): array
    {
        return $this->request('get', $path, ['query' => $query], $tableKey);
    }

    public function post(string $path, array $json = [], ?string $tableKey = null): array
    {
        return $this->request('post', $path, ['json' => $json], $tableKey);
    }

    public function patch(string $path, array $json = [], ?string $tableKey = null): array
    {
        return $this->request('patch', $path, ['json' => $json], $tableKey);
    }

    public function request(string $method, string $path, array $options = [], ?string $tableKey = null): array
    {
        if (! $this->configured()) {
            throw new RuntimeException(
                'Datum Jelou no configurado (JELOU_DATUM_*_BASIC_* o JELOU_API_TOKEN).',
            );
        }

        $base = rtrim((string) config('services.jelou.api_base_url'), '/');
        $url = str_starts_with($path, 'http') ? $path : "{$base}/".ltrim($path, '/');

        $pending = $tableKey !== null
            ? $this->httpClientForTable($tableKey)
            : $this->httpClientForTable('venta_asistencias');

        $method = strtolower($method);
        $response = match ($method) {
            'get' => $pending->get($url, $options['query'] ?? []),
            'post' => $pending->post($url, $options['json'] ?? []),
            'patch' => $pending->patch($url, $options['json'] ?? []),
            default => throw new RuntimeException("Método HTTP no soportado: {$method}"),
        };

        $body = $response->json() ?? [];

        if (! $response->successful()) {
            $message = $body['message'] ?? $response->body();
            if (is_array($message)) {
                $message = json_encode($message, JSON_UNESCAPED_UNICODE);
            }

            throw new RuntimeException(
                'Jelou API error '.$response->status().': '.$message
            );
        }

        return $body;
    }

    public function tableId(string $key): string
    {
        $id = config("services.jelou.datum_tables.{$key}");
        if (! $id) {
            throw new RuntimeException("Tabla Datum desconocida: {$key}");
        }

        return (string) $id;
    }

    public function queryRows(string $tableKey, array $query = []): array
    {
        $tableId = $this->tableId($tableKey);

        return $this->get("/v2/databases/{$tableId}/rows", $query, $tableKey);
    }

    public function updateRow(string $tableKey, string $rowId, array $data): array
    {
        $tableId = $this->tableId($tableKey);

        return $this->patch("/v2/databases/{$tableId}/rows/{$rowId}", $data, $tableKey);
    }

    public function createRow(string $tableKey, array $data): array
    {
        $tableId = $this->tableId($tableKey);

        return $this->post("/v2/databases/{$tableId}/rows", $data, $tableKey);
    }
}
