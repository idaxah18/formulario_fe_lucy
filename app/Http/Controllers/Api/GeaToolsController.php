<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\OmniaxApiException;
use App\Http\Controllers\Controller;
use App\Services\Gea\OmniaxClient;
use App\Support\GeaPhone;
use App\Support\Integrations\IntegrationRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Contratos equivalentes a tools Jelou (Developers → Tools).
 */
class GeaToolsController extends Controller
{
    public function __construct(private readonly OmniaxClient $omniax) {}

    /** Tool: Asistencia en Curso (2678) — Omniax en-proceso por teléfono remitente. */
    public function asistenciaEnCurso(Request $request): JsonResponse
    {
        $data = $request->validate([
            'telefono' => 'nullable|string',
        ]);

        $telefono = $this->requireTelefonoRemitente(
            $data['telefono'] ?? $request->query('telefono'),
        );

        try {
            $raw = $this->omniax->request('post', '/v1/chatbot/asistencias/en-proceso', [
                'json' => ['telefono_remitente' => $telefono],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'tool' => 'asistencia-en-curso',
                'branch' => 'HTTP_ERROR',
                'message' => $e->getMessage(),
            ], 502);
        }

        $rows = $this->extractAsistenciaList($raw);
        $tamanio = count($rows);

        if ($tamanio === 0) {
            return response()->json([
                'tool' => 'asistencia-en-curso',
                'branch' => 'sinAsistencias',
                'tamanio' => 0,
                'data' => [],
                'raw' => $raw,
            ]);
        }

        return response()->json([
            'tool' => 'asistencia-en-curso',
            'branch' => 'exito_consulta',
            'tamanio' => $tamanio,
            'data' => $rows,
            'raw' => $raw,
        ]);
    }

    /** Tool: Notificar Cabina Asistencia en Proceso (6224). */
    public function notificarCabina(Request $request): JsonResponse
    {
        $data = $request->validate([
            'telefono' => 'required|string',
            'cveafiliado' => 'required|string|size:10',
            'tipo_servicio' => 'required|string|max:32',
            'plan_asistencia' => 'required|string|max:64',
            'placa' => 'nullable|string|max:20',
            'chasis' => 'nullable|string|max:64',
            'id_asistencia' => 'nullable|string',
        ]);

        $telefono = $this->requireTelefonoRemitente($data['telefono']);
        $country = $this->countryPath();

        $body = [
            'telefono' => $telefono,
            'cveafiliado' => $data['cveafiliado'],
            'tipo_servicio' => $data['tipo_servicio'],
            'plan_asistencia' => $data['plan_asistencia'],
            'placa' => $data['placa'] ?? '',
            'chasis' => $data['chasis'] ?? '',
        ];

        try {
            $raw = $this->omniax->request(
                'post',
                "/v1/chatbot/validacion/asistencias/en-proceso",
                ['json' => $body],
            );
        } catch (Throwable $e) {
            return response()->json([
                'tool' => 'notificar-cabina-asistencia-en-proceso',
                'branch' => 'error_http',
                'message' => $e->getMessage(),
            ], 502);
        }

        $asistencias = data_get($raw, 'data.asistencias', []);
        if (! is_array($asistencias)) {
            $asistencias = [];
        }
        $aplica = (bool) data_get($raw, 'data.aplica_flujo_creacion_asistencia', false);

        if ($aplica === false) {
            return response()->json([
                'tool' => 'notificar-cabina-asistencia-en-proceso',
                'branch' => 'asistencia_vigente',
                'aplica_flujo_creacion_asistencia' => false,
                'asistencias' => $asistencias,
                'raw' => $raw,
            ]);
        }

        return response()->json([
            'tool' => 'notificar-cabina-asistencia-en-proceso',
            'branch' => 'success',
            'aplica_flujo_creacion_asistencia' => true,
            'asistencias' => $asistencias,
            'raw' => $raw,
        ]);
    }

    /** Tool: Validacion cedula (4303) — mismas reglas que el CODE del tool. */
    public function validacionCedula(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identificacion' => 'required|string',
        ]);

        $id = $data['identificacion'];
        if (preg_match('/^\d{10}$/', $id)) {
            return response()->json([
                'tool' => 'validacion-cedula',
                'branch' => 'cedula_valida',
                'identificacion' => $id,
            ]);
        }

        if (preg_match('/[^0-9]/', $id)) {
            $motivo = 'Identificacion con caracteres no válidos.';
        } elseif (strlen($id) < 10) {
            $motivo = 'La identificación tiene menos de 10 dígitos.';
        } elseif (strlen($id) > 10) {
            $motivo = 'La identificación tiene más de 10 dígitos.';
        } else {
            $motivo = 'La identificación no es válida.';
        }

        return response()->json([
            'tool' => 'validacion-cedula',
            'branch' => 'motivo',
            'motivo' => $motivo,
        ], 422);
    }

    /** Tool: Aceptacion LOPDP (2620) — POST aceptar-terminos. */
    /** Tool Menu Oculto Asistencia Valida (3594). */
    public function menuProveedorValida(Request $request, int $idAsistencia): JsonResponse
    {
        $request->validate([
            'opcion' => 'nullable|string|max:32',
        ]);

        try {
            $raw = $this->omniax->request(
                'get',
                "/v1/chatbot/menu-proveedores/asistencias/{$idAsistencia}",
            );
        } catch (OmniaxApiException $e) {
            $raw = $e->payload();
        } catch (Throwable $e) {
            return response()->json([
                'tool' => 'menu-oculto-asistencia-valida',
                'branch' => 'HTTP_ERROR',
                'message' => $e->getMessage(),
            ], 502);
        }

        $estado = (int) ($raw['estado'] ?? 0);
        // Misma regla que el CODE del tool Jelou: estado 404 ⇒ asistencia válida para menú oculto.
        if ($estado === 404) {
            return response()->json([
                'tool' => 'menu-oculto-asistencia-valida',
                'branch' => 'successOutput',
                'raw' => $raw,
            ]);
        }

        return response()->json([
            'tool' => 'menu-oculto-asistencia-valida',
            'branch' => 'estadoFalse',
            'message' => $raw['noticias']['mensaje'] ?? 'Asistencia no válida para proveedores.',
            'raw' => $raw,
        ], 422);
    }

    /** Tool Asistencia Reagendar (2752) — POST /v1/asistencias/reagendar (no cita médico/dental). */
    public function asistenciaReagendar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_servicio' => 'required|string',
            'identificacion' => 'required|string|size:10',
            'telefono' => 'required|string',
        ]);

        $telefono = $this->requireTelefonoRemitente($data['telefono']);

        try {
            $raw = $this->omniax->request('post', '/v1/asistencias/reagendar', [
                'json' => [
                    'id_servicio' => $data['id_servicio'],
                    'identificacion' => $data['identificacion'],
                    'telefono' => $telefono,
                ],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'tool' => 'asistencia-reagendar',
                'branch' => 'HTTP_ERROR',
                'message' => $e->getMessage(),
            ], 502);
        }

        return response()->json([
            'tool' => 'asistencia-reagendar',
            'branch' => 'successOutput',
            'raw' => $raw,
        ]);
    }

    public function aceptacionLopdp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identificacion' => 'required|string|size:10',
            'codigo_iso_pais' => 'nullable|string|max:8',
        ]);

        try {
            IntegrationRegistry::assertConfigured('lopdp');
        } catch (\App\Exceptions\IntegrationNotConfiguredException $e) {
            return response()->json([
                'tool' => 'aceptacion-lopdp',
                'branch' => 'CODE_ERROR',
                'message' => $e->getMessage(),
                'missing_env' => $e->missingEnv,
            ], 503);
        }

        $apiKey = config('services.gea_omniax.lopdp_api_key');

        $now = now('America/Guayaquil')->format('Y-m-d H:i:s');
        $payload = [
            'nombre_aplicacion' => config('services.gea_omniax.lopdp_app_name', 'CHATBOT_LUCY'),
            'codigo_iso_pais' => $data['codigo_iso_pais'] ?? 'ec',
            'identificacion_persona' => $data['identificacion'],
            'canal' => config('services.gea_omniax.lopdp_canal', 'CHATBOT'),
            'detalle_origen' => '',
            'ip' => $request->ip() ?: '1.1.1.1',
            'referencia' => '',
            'fecha_hora' => $now,
        ];

        $url = rtrim(config('services.gea_omniax.lopdp_base_url', 'https://api.geainternacional.com'), '/').'/aceptar-terminos';

        $response = Http::acceptJson()
            ->withHeaders([
                'api-key' => $apiKey,
                'Content-type' => 'application/json',
            ])
            ->timeout((int) config('services.gea_omniax.timeout', 45))
            ->post($url, $payload);

        if (! $response->successful()) {
            return response()->json([
                'tool' => 'aceptacion-lopdp',
                'branch' => 'HTTP_ERROR',
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ], 502);
        }

        return response()->json([
            'tool' => 'aceptacion-lopdp',
            'branch' => 'success',
            'data' => $response->json(),
        ]);
    }

    private function countryPath(): string
    {
        $configured = config('services.gea_omniax.country_path');
        if ($configured) {
            return (string) $configured;
        }
        $base = (string) config('services.gea_omniax.base_url');
        if (str_contains($base, 'test-ec')) {
            return 'test-ec';
        }

        return 'ec';
    }

    /** @return list<array<string, mixed>> */
    private function extractAsistenciaList(array $raw): array
    {
        $data = $raw['data'] ?? null;
        if (is_array($data) && array_is_list($data)) {
            return $data;
        }
        if (is_array($data) && isset($data['asistencias']) && is_array($data['asistencias'])) {
            return $data['asistencias'];
        }

        return [];
    }

    private function requireTelefonoRemitente(?string $telefono): string
    {
        try {
            return GeaPhone::requireRemitente($telefono);
        } catch (\InvalidArgumentException) {
            throw ValidationException::withMessages([
                'telefono' => ['Ingresa un celular válido de Ecuador (09xxxxxxxx).'],
            ]);
        }
    }
}
