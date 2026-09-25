<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Gea\OmniaxClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OmniaxDentalController extends Controller
{
    public function __construct(private readonly OmniaxClient $omniax) {}

    public function asistenciasEnProceso(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identificacion_titular' => 'required|string',
            'id_servicio' => 'required|integer',
            'para_reagendar' => 'sometimes|boolean',
        ]);

        $payload = $this->omniax->request('post', '/v1/chatbot/medico-dental/asistencias/en-proceso', [
            'json' => [
                'identificacion_titular' => $data['identificacion_titular'],
                'id_servicio' => $data['id_servicio'],
                'para_reagendar' => $data['para_reagendar'] ?? false,
            ],
        ]);

        return response()->json($payload);
    }

    public function aplicaAsignacion(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identificacion_titular' => 'required|string',
            'identificacion_beneficiario' => 'nullable|string',
        ]);

        $json = ['identificacion_titular' => $data['identificacion_titular']];
        if (! empty($data['identificacion_beneficiario'])) {
            $json['identificacion_beneficiario'] = $data['identificacion_beneficiario'];
        }

        $payload = $this->omniax->request('post', '/v1/chatbot/dental/establecimientos/aplica-asignacion', [
            'json' => $json,
        ]);

        return response()->json($payload);
    }

    public function establecimientos(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_servicio' => 'required|integer',
            'latitud' => 'nullable|string',
            'longitud' => 'nullable|string',
            'id_zona' => 'nullable|integer',
        ]);

        $json = ['id_servicio' => $data['id_servicio']];
        if (! empty($data['id_zona'])) {
            $json['id_zona'] = $data['id_zona'];
        } elseif (! empty($data['latitud']) && ! empty($data['longitud'])) {
            $json['latitud'] = $data['latitud'];
            $json['longitud'] = $data['longitud'];
        } else {
            return response()->json([
                'estado' => 422,
                'noticias' => ['mensaje' => 'Envía id_zona o latitud y longitud.'],
            ], 422);
        }

        $payload = $this->omniax->request('post', '/v1/chatbot/medico-dental/establecimientos', [
            'json' => $json,
        ]);

        return response()->json($payload);
    }

    public function zonasPorCiudad(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_servicio' => 'required|integer',
        ]);

        $payload = $this->omniax->request('get', '/v1/chatbot/zonas-por-ciudad', [
            'query' => ['id_servicio' => $data['id_servicio']],
        ]);

        return response()->json($payload);
    }

    public function disponibilidadDias(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_establecimiento' => 'required|integer',
            'id_asistencia' => 'nullable|integer',
        ]);

        $payload = $this->omniax->request('post', '/v1/chatbot/dental/establecimientos/disponibilidad-dias', [
            'json' => array_filter($data, fn ($v) => $v !== null),
        ]);

        return response()->json($payload);
    }

    public function disponibilidadHoras(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_establecimiento' => 'required|integer',
            'fecha' => 'required|string',
            'id_asistencia' => 'nullable|integer',
        ]);

        $payload = $this->omniax->request('post', '/v1/chatbot/dental/establecimientos/disponibilidad-horas', [
            'json' => array_filter($data, fn ($v) => $v !== null),
        ]);

        return response()->json($payload);
    }

    public function crearAsistencia(Request $request): JsonResponse
    {
        $data = $request->validate([
            'telefono' => 'required|string',
            'id_servicio' => 'required|integer',
            'identificacion_titular' => 'required|string',
            'nombre_titular' => 'required|string',
            'latitud' => 'required|string',
            'longitud' => 'required|string',
            'aplica_seguimiento_dental' => 'required|boolean',
            'identificacion_beneficiario' => 'nullable|string',
            'nombre_beneficiario' => 'nullable|string',
            'edad_beneficiario' => 'nullable|integer',
            'sexo_beneficiario' => 'nullable|string',
            'parentesco_beneficiario' => 'nullable|string',
            'id_establecimiento' => 'nullable|integer',
            'id_zona' => 'nullable|integer',
            'fecha' => 'nullable|string',
            'hora' => 'nullable|string',
        ]);

        $payload = $this->omniax->request('post', '/v1/chatbot/medico-dental/asistencias', [
            'json' => $data,
        ]);

        return response()->json($payload, $payload['estado'] ?? 201);
    }

    public function reagendarAsistencia(Request $request): JsonResponse
    {
        $data = $request->validate([
            'telefono' => 'required|string',
            'id_asistencia' => 'required|integer',
            'fecha' => 'required|string',
            'hora' => 'required|string',
            'id_servicio' => 'sometimes|integer',
            'identificacion_titular' => 'sometimes|string',
            'nombre_titular' => 'sometimes|string',
            'latitud' => 'sometimes|string',
            'longitud' => 'sometimes|string',
            'aplica_seguimiento_dental' => 'sometimes|boolean',
            'identificacion_beneficiario' => 'nullable|string',
            'nombre_beneficiario' => 'nullable|string',
            'edad_beneficiario' => 'nullable|integer',
            'sexo_beneficiario' => 'nullable|string',
            'parentesco_beneficiario' => 'nullable|string',
            'id_establecimiento' => 'nullable|integer',
            'id_zona' => 'nullable|integer',
        ]);

        $payload = $this->omniax->request('post', '/v1/chatbot/medico-dental/asistencias/reagendar', [
            'json' => $this->omniax->reagendarJsonFromValidated($data),
        ]);

        return response()->json($payload, $payload['estado'] ?? 200);
    }
}
