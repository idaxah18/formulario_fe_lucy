<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Gea\OmniaxClient;
use App\Support\GeaPhone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

/** Tools Jelou — ASAP / siniestros / inspección (Fase 2). */
class AseguradoraAsapController extends Controller
{
    public function __construct(private readonly OmniaxClient $omniax) {}

    /** Tool Consulta Placa (vial ASAP) — POST reportesiniestro/afiliacion */
    public function consultaPlacaVial(Request $request): JsonResponse
    {
        $data = $request->validate(['placa' => 'required|string|max:20']);

        return $this->proxyPost('/v1/chatbot/reportesiniestro/afiliacion', [
            'placa' => strtoupper($data['placa']),
        ]);
    }

    /** Tool Consulta Placa Siniestro */
    public function consultaPlacaSiniestro(Request $request): JsonResponse
    {
        $data = $request->validate(['placa' => 'required|string|max:20']);

        return $this->proxyPost('/v1/chatbot/reporte-siniestro/afiliacion', [
            'placa' => strtoupper($data['placa']),
        ]);
    }

    /** Tool Consulta Provincias */
    public function provincias(Request $request): JsonResponse
    {
        $iso = $request->query('iso', 'EC');

        return $this->proxyGet('/v1/division-territorial/estado-provincia-departamento', ['iso' => $iso]);
    }

    /** Tool Consulta Ciudades por provincia */
    public function ciudadesPorProvincia(Request $request, int $idProvincia): JsonResponse
    {
        return $this->proxyGet("/v1/division-territorial/{$idProvincia}/subdivisiones");
    }

    /** Tool Lista Parentesco */
    public function parentesco(Request $request): JsonResponse
    {
        $iso = $request->query('iso', 'EC');

        return $this->proxyGet('/v1/chatbot/opciones-parentesco', ['iso' => $iso]);
    }

    /** Tool Inspección — buscar aseguradora */
    public function inspeccionBuscarAseguradora(Request $request): JsonResponse
    {
        $data = $request->validate(['codigo_riesgo' => 'required|string|max:64']);

        return $this->proxyPost('/v1/chatbot/inspeccion-riesgo/buscar-aseguradora', [
            'codigo_riesgo' => $data['codigo_riesgo'],
        ]);
    }

    /** Tool Reporte Siniestro Colisión */
    public function reporteColision(Request $request): JsonResponse
    {
        $data = $request->validate([
            'telefono_remitente' => 'nullable|string',
            'id_afiliacion' => 'required',
            'id_vehiculo' => 'nullable',
            'id_estado_provincia_depto' => 'required',
            'id_condado_canton_ciudad' => 'required',
            'direccion_siniestro' => 'required|string|max:500',
            'fecha_siniestro' => 'required|string|max:32',
            'hora_siniestro' => 'required|string|max:16',
            'asegurado_nombre' => 'required|string|max:200',
            'asegurado_cedula' => 'required|string|size:10',
            'asegurado_telefono' => 'required|string|max:20',
            'asegurado_correo' => 'nullable|string|max:120',
            'conductor_nombre' => 'nullable|string|max:200',
            'conductor_cedula' => 'nullable|string|max:20',
            'conductor_telefono' => 'nullable|string|max:20',
            'conductor_correo' => 'nullable|string|max:120',
            'conductor_licencia' => 'nullable|string|max:64',
            'conductor_id_parentesco' => 'nullable',
            'tipo_colision' => 'nullable|string|max:64',
        ]);

        $tel = GeaPhone::normalizeRemitente($data['telefono_remitente'] ?? null);
        $payload = [
            'telefono_remitente' => $tel,
            'id_afiliacion' => $data['id_afiliacion'],
            'id_vehiculo' => $data['id_vehiculo'] ?? null,
            'id_estado_provincia_depto' => $data['id_estado_provincia_depto'],
            'id_condado_canton_ciudad' => $data['id_condado_canton_ciudad'],
            'direccion_siniestro' => $data['direccion_siniestro'],
            'fecha_siniestro' => $data['fecha_siniestro'],
            'hora_siniestro' => $data['hora_siniestro'],
            'asegurado_nombre' => $data['asegurado_nombre'],
            'asegurado_cedula' => $data['asegurado_cedula'],
            'asegurado_telefono' => $data['asegurado_telefono'],
            'asegurado_correo' => $data['asegurado_correo'] ?? '',
            'conductor_nombre' => $data['conductor_nombre'] ?? $data['asegurado_nombre'],
            'conductor_cedula' => $data['conductor_cedula'] ?? $data['asegurado_cedula'],
            'conductor_telefono' => $data['conductor_telefono'] ?? $data['asegurado_telefono'],
            'conductor_correo' => $data['conductor_correo'] ?? ($data['asegurado_correo'] ?? ''),
            'conductor_licencia' => $data['conductor_licencia'] ?? '',
            'conductor_id_parentesco' => $data['conductor_id_parentesco'] ?? null,
            'imagenes' => [],
            'video_url' => '',
            'biometria_url' => '',
        ];

        return $this->proxyPost('/v1/chatbot/reporte-siniestro/colision', $payload);
    }

    /** Tool Reporte Siniestro Robo Total */
    public function reporteRoboTotal(Request $request): JsonResponse
    {
        return $this->reporteRobo($request, '/v1/chatbot/reporte-siniestro/robo-total');
    }

    /** Tool Reporte Siniestro Robo Parcial */
    public function reporteRoboParcial(Request $request): JsonResponse
    {
        return $this->reporteRobo($request, '/v1/chatbot/reporte-siniestro/robo-parcial');
    }

    private function reporteRobo(Request $request, string $path): JsonResponse
    {
        $data = $request->validate([
            'telefono_remitente' => 'nullable|string',
            'id_afiliacion' => 'required',
            'id_vehiculo' => 'nullable',
            'id_estado_provincia_depto' => 'required',
            'id_condado_canton_ciudad' => 'required',
            'direccion_siniestro' => 'required|string|max:500',
            'fecha_siniestro' => 'required|string|max:32',
            'hora_siniestro' => 'required|string|max:16',
            'asegurado_nombre' => 'required|string|max:200',
            'asegurado_cedula' => 'required|string|size:10',
            'asegurado_telefono' => 'required|string|max:20',
            'asegurado_correo' => 'nullable|string|max:120',
        ]);

        $tel = GeaPhone::normalizeRemitente($data['telefono_remitente'] ?? null);
        $payload = [
            'telefono_remitente' => $tel,
            'id_afiliacion' => $data['id_afiliacion'],
            'id_vehiculo' => $data['id_vehiculo'] ?? null,
            'id_estado_provincia_depto' => $data['id_estado_provincia_depto'],
            'id_condado_canton_ciudad' => $data['id_condado_canton_ciudad'],
            'direccion_siniestro' => $data['direccion_siniestro'],
            'fecha_siniestro' => $data['fecha_siniestro'],
            'hora_siniestro' => $data['hora_siniestro'],
            'asegurado_nombre' => $data['asegurado_nombre'],
            'asegurado_cedula' => $data['asegurado_cedula'],
            'asegurado_telefono' => $data['asegurado_telefono'],
            'asegurado_correo' => $data['asegurado_correo'] ?? '',
            'imagenes' => [],
            'video_url' => '',
            'biometria_url' => '',
        ];

        return $this->proxyPost($path, $payload);
    }

    private function proxyPost(string $path, array $json): JsonResponse
    {
        try {
            $raw = $this->omniax->request('post', $path, ['json' => $json]);
        } catch (Throwable $e) {
            return response()->json([
                'ok' => false,
                'message' => $e->getMessage(),
            ], 502);
        }

        return response()->json($raw, (int) ($raw['estado'] ?? 200));
    }

    private function proxyGet(string $path, array $query = []): JsonResponse
    {
        try {
            $raw = $this->omniax->request('get', $path, ['query' => $query]);
        } catch (Throwable $e) {
            return response()->json([
                'ok' => false,
                'message' => $e->getMessage(),
            ], 502);
        }

        return response()->json($raw, (int) ($raw['estado'] ?? 200));
    }
}
