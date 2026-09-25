<?php

namespace App\Exceptions;

use Exception;

class IntegrationNotConfiguredException extends Exception
{
    /** @param  list<string>  $missingEnv */
    public function __construct(
        public readonly string $integration,
        public readonly array $missingEnv,
        public readonly string $label = '',
    ) {
        $name = $label !== '' ? $label : $integration;
        parent::__construct("Integración «{$name}» no configurada. Variables: ".implode(', ', $missingEnv));
    }

    /** @return array<string, mixed> */
    public function payload(): array
    {
        return [
            'ok' => false,
            'integration' => $this->integration,
            'missing_env' => $this->missingEnv,
            'estado' => 503,
            'noticias' => [
                'titulo' => 'Configuración incompleta',
                'mensaje' => $this->getMessage().' Revisa el archivo .env del servidor.',
            ],
        ];
    }

    public function statusCode(): int
    {
        return 503;
    }
}
