<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Gea\OmniaxClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Servicios Omniax generales (PDF servicios-omniax-2024-03-15) — WF Jelou 4220.
 */
class OmniaxGeaController extends Controller
{
    public function __construct(private readonly OmniaxClient $omniax) {}

    public function actualizarUbicacion(Request $request, int $idAsistencia): JsonResponse
    {
        $data = $request->validate([
            'latitud' => 'required|string',
            'longitud' => 'required|string',
        ]);

        $payload = $this->omniax->request('put', "/v1/asistencias/{$idAsistencia}/ubicacion", [
            'json' => $data,
        ]);

        return response()->json($payload, $payload['estado'] ?? 201);
    }

    public function cuestionario(int $idAsistencia): JsonResponse
    {
        $payload = $this->omniax->request('get', "/v1/m2m/cuestionarios/asistencias/{$idAsistencia}");

        return response()->json($payload, $payload['estado'] ?? 200);
    }

    public function calificarCuestionario(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_asistencia' => 'required',
            'id_cuestionario' => 'required',
            'preguntas' => 'required|array',
            'preguntas.*.id' => 'required',
            'preguntas.*.respuestas' => 'required|array',
        ]);

        $payload = $this->omniax->request('post', '/v1/m2m/cuestionarios/calificar', [
            'json' => $data,
        ]);

        return response()->json($payload, $payload['estado'] ?? 200);
    }

    public function respuestaTermino(Request $request, int $idAsistencia): JsonResponse
    {
        $data = $request->validate([
            'respuesta_usuario' => 'required|string|in:1,2',
        ]);

        $payload = $this->omniax->request('post', "/v1/chatbot/asistencia/{$idAsistencia}/termino", [
            'json' => $data,
        ]);

        return response()->json($payload, $payload['estado'] ?? 200);
    }

    public function respuestaContacto(Request $request, int $idAsistencia): JsonResponse
    {
        $data = $request->validate([
            'respuesta_usuario' => 'required|string|in:1,2',
        ]);

        $payload = $this->omniax->request('post', "/v1/chatbot/asistencia/{$idAsistencia}/contacto", [
            'json' => $data,
        ]);

        return response()->json($payload, $payload['estado'] ?? 200);
    }

    public function crearAsistenciaGea(Request $request): JsonResponse
    {
        $data = $request->validate([
            'telefono' => 'required|string',
            'nombres' => 'required|string',
            'cveafiliado' => 'required|string',
            'id_servicio' => 'required|string',
            'direccion' => 'nullable|string',
            'placa' => 'nullable|string',
            'chasis' => 'nullable|string',
            'latitud' => 'required|string',
            'longitud' => 'required|string',
            'plan_asistencia' => 'nullable|string',
        ]);

        if (empty($data['plan_asistencia'])) {
            $data['plan_asistencia'] = config('services.gea_omniax.plan_asistencia', 'ASISTENCIAS');
        }

        $payload = $this->omniax->request('post', '/v1/chatbot/asistencias/gea', [
            'json' => array_filter($data, fn ($v) => $v !== null && $v !== ''),
        ]);

        return response()->json($payload, $payload['estado'] ?? 201);
    }

    public function listadoChatbotTelefono(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cveafiliado' => 'required|string',
            'telefono' => 'required|string',
        ]);

        $payload = $this->omniax->request('post', '/v1/asistencias/listado/chatbot-telefono', [
            'json' => $data,
        ]);

        return response()->json($payload, $payload['estado'] ?? 200);
    }

    public function asistenciasEnProcesoRemitente(Request $request): JsonResponse
    {
        $data = $request->validate([
            'telefono_remitente' => 'required|string',
        ]);

        $payload = $this->omniax->request('post', '/v1/chatbot/asistencias/en-proceso', [
            'json' => $data,
        ]);

        return response()->json($payload, $payload['estado'] ?? 200);
    }

    public function cancelarAsistencia(int $idAsistencia): JsonResponse
    {
        $payload = $this->omniax->request('put', "/v1/asistencias/{$idAsistencia}/cancelar");

        return response()->json($payload, $payload['estado'] ?? 201);
    }

    public function reenviarEvaluacion(int $idAsistencia): JsonResponse
    {
        $payload = $this->omniax->request('post', "/v1/chatbot/asistencia/{$idAsistencia}/reenviar-evaluacion");

        return response()->json($payload, $payload['estado'] ?? 200);
    }

    public function evaluacionConfirmada(int $idAsistencia): JsonResponse
    {
        $payload = $this->omniax->request('post', "/v1/chatbot/asistencia/{$idAsistencia}/evaluacion-confirmada");

        return response()->json($payload, $payload['estado'] ?? 200);
    }
}
