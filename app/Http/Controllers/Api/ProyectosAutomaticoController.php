<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Gea\ProyectosGeaClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Proxy proceso automático hogar/vial — Omniax test-ec ({GEA_OMNIAX_BASE_URL}).
 */
class ProyectosAutomaticoController extends Controller
{
    public function __construct(private readonly ProyectosGeaClient $proyectos) {}

    public function afiliacion(Request $request): JsonResponse
    {
        $data = $request->validate([
            'telefono' => 'required|string',
            'cveafiliado' => 'required|string',
            'nivel_busquedad' => 'required|string|in:SERVICIO,SUBSERVICIO',
            'id_servicio_subservicio' => 'required|integer',
            'tipo_servicio' => 'required|string|in:HOGAR,VIAL',
            'plan_asistencia' => 'nullable|string',
            'placa' => 'nullable|string',
            'chasis' => 'nullable|string',
        ]);

        if (empty($data['plan_asistencia'])) {
            $data['plan_asistencia'] = config('services.gea_omniax.plan_asistencia', 'ASISTENCIAS');
        }

        $payload = $this->proyectos->post('chatbot/proceso-automatico/afiliacion', $data);

        return response()->json($payload, $payload['estado'] ?? 200);
    }

    public function vehiculoAfiliacion(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_detalle_proceso_automatico_chatbot' => 'required|integer',
            'placa' => 'required|string',
            'chasis' => 'nullable|string',
            'plan_asistencia' => 'nullable|string',
        ]);

        if (empty($data['plan_asistencia'])) {
            $data['plan_asistencia'] = config('services.gea_omniax.plan_asistencia', 'ASISTENCIAS');
        }

        $payload = $this->proyectos->post('chatbot/proceso-automatico/vehiculo-afiliacion', $data);

        return response()->json($payload, $payload['estado'] ?? 200);
    }

    public function cobertura(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_detalle_proceso_automatico_chatbot' => 'required|integer',
            'tipo_servicio' => 'required|string|in:HOGAR,VIAL',
            'plan_asistencia' => 'nullable|string',
            'fecha_emergencia' => 'nullable|string',
            'aplica_servicio_automatico' => 'nullable',
            'es_programado' => 'nullable|integer',
            'latitud' => 'nullable|string',
            'longitud' => 'nullable|string',
            'referencia' => 'nullable|string',
            'direccion' => 'nullable|string',
            'marca_vehiculo' => 'nullable|string',
            'modelo_vehiculo' => 'nullable|string',
            'anio_vehiculo' => 'nullable|string',
            'tipo_vehiculo' => 'nullable|string',
            'datos_extra' => 'nullable|array',
            'telefono' => 'nullable|string',
        ]);

        if (empty($data['plan_asistencia'])) {
            $data['plan_asistencia'] = config('services.gea_omniax.plan_asistencia', 'ASISTENCIAS');
        }

        $payload = $this->proyectos->post('chatbot/proceso-automatico/cobertura', array_filter(
            $data,
            fn ($v) => $v !== null && $v !== '',
        ));

        return response()->json($payload, $payload['estado'] ?? 200);
    }

    public function validacionCombustible(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_detalle_proceso_automatico_chatbot' => 'required|integer',
        ]);

        $payload = $this->proyectos->post(
            'chatbot/proceso-automatico/validacion-cobertura-combustible',
            $data,
        );

        return response()->json($payload, $payload['estado'] ?? 200);
    }

    public function validacionCoordenadas(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_detalle_proceso_automatico_chatbot' => 'required|integer',
            'tipo_coordenada' => 'required|string',
        ]);

        $payload = $this->proyectos->post('chatbot/proceso-automatico/validacion-coordenadas', $data);

        return response()->json($payload, $payload['estado'] ?? 200);
    }

    public function ubicacion(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_detalle_proceso_automatico_chatbot' => 'required|integer',
            'latitud' => 'required|string',
            'longitud' => 'required|string',
            'referencia' => 'nullable|string',
            'direccion' => 'nullable|string',
            'tipo_coordenada' => 'nullable|string',
        ]);

        $payload = $this->proyectos->post('proceso-chatbot/ubicacion', $data);

        return response()->json($payload, $payload['estado'] ?? 200);
    }

    public function asistencia(Request $request): JsonResponse
    {
        $data = $request->validate([
            'telefono' => 'required|string',
            'id_detalle_proceso_automatico_chatbot' => 'required|integer',
            'tipo_servicio' => 'required|string|in:HOGAR,VIAL',
            'fecha_emergencia' => 'nullable|string',
            'latitud' => 'nullable|string',
            'longitud' => 'nullable|string',
            'referencia' => 'nullable|string',
            'direccion' => 'nullable|string',
            'es_programado' => 'nullable|integer',
            'fecha_programada' => 'nullable|string',
            'hora_programada' => 'nullable|string',
            'preguntas_respuestas' => 'nullable|string',
            'aplica_servicio_automatico' => 'nullable',
            'plan_asistencia' => 'nullable|string',
            'tipo_combustible' => 'nullable|string',
            'id_lugar_destino' => 'nullable|integer',
        ]);

        if (empty($data['plan_asistencia'])) {
            $data['plan_asistencia'] = config('services.gea_omniax.plan_asistencia', 'ASISTENCIAS');
        }

        $payload = $this->proyectos->post('chatbot/proceso-automatico/asistencia', array_filter(
            $data,
            fn ($v) => $v !== null && $v !== '',
        ));

        return response()->json($payload, $payload['estado'] ?? 201);
    }
}
