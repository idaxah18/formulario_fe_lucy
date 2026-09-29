<?php

namespace App\Support\Integrations;

use App\Exceptions\IntegrationNotConfiguredException;

/**
 * Catálogo de credenciales (.env) — equivalente a secrets en tools Jelou (MEMORY / $secret).
 */
final class IntegrationRegistry
{
    /** @return array<string, array{label: string, description: string, env: list<string>, optional?: bool}> */
    public static function definitions(): array
    {
        return [
            'omniax' => [
                'label' => 'Omniax API (Bearer)',
                'description' => 'Médico, dental, GEA, ASAP, cabina, cancelar, etc.',
                'env' => ['GEA_OMNIAX_CLIENT_ID', 'GEA_OMNIAX_CLIENT_SECRET'],
            ],
            'gea_proyectos' => [
                'label' => 'SIGA Proyectos (obsoleto)',
                'description' => 'Ya no se usa; proceso automático va por GEA_OMNIAX_* / test-ec.',
                'env' => ['GEA_PROYECTOS_CLIENT_ID', 'GEA_PROYECTOS_CLIENT_SECRET'],
                'optional' => true,
            ],
            'lopdp' => [
                'label' => 'LOPDP (header api-key)',
                'description' => 'Tool 2620 Aceptacion LOPDP — distinto al token Omniax.',
                'env' => ['GEA_LOPDP_API_KEY'],
            ],
            'jelou_datum' => [
                'label' => 'Jelou Datum',
                'description' => 'Venta, derivación, IA Router términos (HTTP Basic en tool 1942; sk_ no sirve en /v2/databases).',
                'env' => [],
                'optional' => true,
            ],
            'jelou_pay' => [
                'label' => 'Jelou Pay',
                'description' => 'E-Doctor, compra viaja, asistencia inmediata.',
                'env' => ['JELOU_PAY_BEARER', 'JELOU_PAY_APP_ID'],
                'optional' => true,
            ],
            'lucy_ia' => [
                'label' => 'Lucy IA (LLM)',
                'description' => 'Chat IA en webview; sin key usa modo guiado.',
                'env' => ['LUCY_IA_API_KEY'],
                'optional' => true,
            ],
            'jelou_function_legacy' => [
                'label' => 'Jelou Function asistencia-en-curso (legacy)',
                'description' => 'Solo si usas proxy functions.jelou.ai en lugar de Omniax directo.',
                'env' => ['GEA_JELOU_FUNCTION_USER', 'GEA_JELOU_FUNCTION_PASSWORD'],
                'optional' => true,
            ],
        ];
    }

    /** @return list<string> */
    public static function missingEnvKeys(string $integration): array
    {
        if ($integration === 'jelou_datum') {
            return self::jelouDatumConfigured()
                ? []
                : ['JELOU_DATUM_VENTA_BASIC_* (tabla 1435) y/o JELOU_DATUM_BASIC_* (otras tablas)'];
        }

        $def = self::definitions()[$integration] ?? null;
        if (! $def) {
            return ["UNKNOWN_INTEGRATION:{$integration}"];
        }

        $missing = [];
        foreach ($def['env'] as $key) {
            $value = env($key);
            if ($value === null || $value === '') {
                $missing[] = $key;
            }
        }

        return $missing;
    }

    public static function isConfigured(string $integration): bool
    {
        if ($integration === 'jelou_datum') {
            return self::jelouDatumConfigured();
        }

        return self::missingEnvKeys($integration) === [];
    }

    public static function jelouDatumConfigured(): bool
    {
        foreach (['JELOU_DATUM_VENTA_BASIC_USER', 'JELOU_DATUM_BASIC_USER'] as $userKey) {
            $passKey = str_replace('_USER', '_PASSWORD', $userKey);
            $user = env($userKey);
            $pass = env($passKey);
            if ($user !== null && $user !== '' && $pass !== null && $pass !== '') {
                return true;
            }
        }

        $token = env('JELOU_API_TOKEN');

        return $token !== null && $token !== '';
    }

    /** Lanza si faltan variables de entorno para esta integración (rutas protegidas por middleware). */
    public static function assertConfigured(string $integration): void
    {
        $def = self::definitions()[$integration] ?? null;
        if (! $def) {
            throw new IntegrationNotConfiguredException($integration, ["UNKNOWN_INTEGRATION:{$integration}"]);
        }

        $missing = self::missingEnvKeys($integration);
        if ($missing !== []) {
            throw new IntegrationNotConfiguredException($integration, $missing, $def['label']);
        }
    }

    /**
     * @return array<string, array{label: string, configured: bool, optional: bool, missing_env: list<string>}>
     */
    public static function statusReport(): array
    {
        $report = [];
        foreach (self::definitions() as $id => $def) {
            $missing = self::missingEnvKeys($id);
            $report[$id] = [
                'label' => $def['label'],
                'description' => $def['description'],
                'optional' => (bool) ($def['optional'] ?? false),
                'configured' => $missing === [],
                'missing_env' => $missing,
            ];
        }

        return $report;
    }

    public static function coreReady(): bool
    {
        return self::isConfigured('omniax') && self::isConfigured('lopdp');
    }
}
