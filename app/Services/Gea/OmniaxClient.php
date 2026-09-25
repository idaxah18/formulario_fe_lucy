<?php

namespace App\Services\Gea;

use App\Exceptions\OmniaxApiException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OmniaxClient
{
    public function token(): string
    {
        return Cache::remember('gea_omniax_access_token', 60 * 60 * 12, function () {
            $base = rtrim(config('services.gea_omniax.base_url'), '/');
            $response = Http::acceptJson()
                ->post("{$base}/v1/auth/token", [
                    'client_id' => config('services.gea_omniax.client_id'),
                    'client_secret' => config('services.gea_omniax.client_secret'),
                ]);

            if (! $response->successful()) {
                throw new RuntimeException('No se pudo autenticar con Omniax: '.$response->body());
            }

            $json = $response->json();
            $token = $json['data']['access_token'] ?? null;
            if (! $token) {
                throw new RuntimeException('Respuesta de token Omniax inválida.');
            }

            return $token;
        });
    }

    public function request(string $method, string $path, array $options = []): array
    {
        $base = rtrim(config('services.gea_omniax.base_url'), '/');
        $url = str_starts_with($path, 'http') ? $path : "{$base}/".ltrim($path, '/');

        $pending = Http::acceptJson()
            ->withToken($this->token())
            ->timeout((int) config('services.gea_omniax.timeout', 45));

        $method = strtolower($method);
        $response = match ($method) {
            'get' => $pending->get($url, $options['query'] ?? []),
            'post' => $pending->post($url, $options['json'] ?? []),
            'put' => $pending->put($url, $options['json'] ?? []),
            default => throw new RuntimeException("Método HTTP no soportado: {$method}"),
        };

        if ($response->status() === 401) {
            Cache::forget('gea_omniax_access_token');

            return $this->request($method, $path, $options);
        }

        $body = $response->json() ?? [];

        if ($response->failed()) {
            throw new OmniaxApiException(
                $this->normalizeErrorPayload($body, $response->status(), $response->body()),
                $response->status(),
            );
        }

        if (isset($body['estado']) && (int) $body['estado'] >= 400) {
            throw new OmniaxApiException($body, (int) $body['estado']);
        }

        return $body;
    }

    /**
     * Servicio 12 (PDF Omniax): telefono, id_asistencia, fecha, hora (+ beneficiario opcional).
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function reagendarJsonFromValidated(array $data): array
    {
        $keys = [
            'telefono',
            'id_asistencia',
            'fecha',
            'hora',
            'identificacion_beneficiario',
            'nombre_beneficiario',
            'edad_beneficiario',
            'sexo_beneficiario',
            'parentesco_beneficiario',
        ];

        $json = [];
        foreach ($keys as $key) {
            if (! array_key_exists($key, $data)) {
                continue;
            }
            $value = $data[$key];
            if ($value === null || $value === '') {
                continue;
            }
            $json[$key] = $value;
        }

        return $json;
    }

    /**
     * @param  array<string, mixed>  $body
     * @return array<string, mixed>
     */
    private function normalizeErrorPayload(array $body, int $httpStatus, string $rawBody): array
    {
        if ($body !== []) {
            return $body;
        }

        return [
            'estado' => $httpStatus,
            'noticias' => [
                'titulo' => 'Error',
                'mensaje' => $rawBody !== '' ? $rawBody : 'Error al comunicarse con Omniax',
            ],
        ];
    }
}
