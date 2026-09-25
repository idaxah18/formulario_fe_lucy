<?php

namespace App\Services\Jelou;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/** Cliente REST Jelou (Datum v2, etc.). */
class JelouApiClient
{
    public function configured(): bool
    {
        return (bool) config('services.jelou.api_token');
    }

    public function get(string $path, array $query = []): array
    {
        return $this->request('get', $path, ['query' => $query]);
    }

    public function post(string $path, array $json = []): array
    {
        return $this->request('post', $path, ['json' => $json]);
    }

    public function patch(string $path, array $json = []): array
    {
        return $this->request('patch', $path, ['json' => $json]);
    }

    public function request(string $method, string $path, array $options = []): array
    {
        if (! $this->configured()) {
            throw new RuntimeException('JELOU_API_TOKEN no configurado.');
        }

        $base = rtrim((string) config('services.jelou.api_base_url'), '/');
        $url = str_starts_with($path, 'http') ? $path : "{$base}/".ltrim($path, '/');

        $pending = Http::acceptJson()
            ->withToken((string) config('services.jelou.api_token'))
            ->timeout(45);

        $method = strtolower($method);
        $response = match ($method) {
            'get' => $pending->get($url, $options['query'] ?? []),
            'post' => $pending->post($url, $options['json'] ?? []),
            'patch' => $pending->patch($url, $options['json'] ?? []),
            default => throw new RuntimeException("Método HTTP no soportado: {$method}"),
        };

        $body = $response->json() ?? [];

        if (! $response->successful()) {
            throw new RuntimeException(
                'Jelou API error '.$response->status().': '.($body['message'] ?? $response->body())
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

        return $this->get("/v2/databases/{$tableId}/rows", $query);
    }

    public function updateRow(string $tableKey, string $rowId, array $data): array
    {
        $tableId = $this->tableId($tableKey);

        return $this->patch("/v2/databases/{$tableId}/rows/{$rowId}", $data);
    }

    public function createRow(string $tableKey, array $data): array
    {
        $tableId = $this->tableId($tableKey);

        return $this->post("/v2/databases/{$tableId}/rows", $data);
    }
}
