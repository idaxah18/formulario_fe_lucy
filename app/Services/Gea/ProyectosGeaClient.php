<?php

namespace App\Services\Gea;

/**
 * Proceso automático hogar/vial — mismo host que Omniax ({GEA_OMNIAX_BASE_URL}, ej. test-ec).
 *
 * @see Api Automatizacion Final.docx — {endpoint}/v1/auth/token y chatbot/proceso-automatico/*
 */
class ProyectosGeaClient
{
    public function __construct(private readonly OmniaxClient $omniax) {}

    /**
     * @param  array<string, mixed>  $json
     * @return array<string, mixed>
     */
    public function post(string $relativePath, array $json): array
    {
        $path = $this->toOmniaxPath($relativePath);

        return $this->omniax->request('post', $path, ['json' => $json]);
    }

    private function toOmniaxPath(string $relativePath): string
    {
        $path = ltrim($relativePath, '/');

        if (str_starts_with($path, 'v1/')) {
            return '/'.$path;
        }

        if (str_starts_with($path, 'chatbot/')) {
            return '/v1/'.$path;
        }

        if (str_starts_with($path, 'proceso-chatbot/')) {
            return '/v1/'.$path;
        }

        return '/v1/chatbot/proceso-automatico/'.$path;
    }
}
