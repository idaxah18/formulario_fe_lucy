<?php

namespace App\Exceptions;

use RuntimeException;

class OmniaxApiException extends RuntimeException
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        private readonly array $payload,
        private readonly int $statusCode = 422,
    ) {
        $message = $payload['noticias']['mensaje'] ?? 'Error en la API de Omniax';
        parent::__construct($message, $statusCode);
    }

    /**
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        return $this->payload;
    }

    public function statusCode(): int
    {
        return $this->statusCode;
    }
}
