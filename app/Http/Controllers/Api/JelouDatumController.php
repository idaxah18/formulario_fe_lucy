<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Jelou\JelouApiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class JelouDatumController extends Controller
{
    public function __construct(private readonly JelouApiClient $jelou) {}

    public function queryRows(Request $request, string $tableKey): JsonResponse
    {
        if (! $this->jelou->configured()) {
            return response()->json([
                'ok' => false,
                'message' => 'Datum no configurado (JELOU_API_TOKEN).',
            ], 503);
        }

        try {
            $allowed = array_keys(config('services.jelou.datum_tables', []));
            if (! in_array($tableKey, $allowed, true)) {
                return response()->json(['ok' => false, 'message' => 'Tabla no permitida.'], 422);
            }

            $query = $request->only([
                'limit', 'sortBy', 'sortByOrder', 'identificacion', 'accion_ejecutada', 'telefono',
            ]);

            $data = $this->jelou->queryRows($tableKey, $query);

            return response()->json(['ok' => true, 'data' => $data]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 502);
        }
    }

    public function patchRow(Request $request, string $tableKey, string $rowId): JsonResponse
    {
        if (! $this->jelou->configured()) {
            return response()->json(['ok' => false, 'message' => 'Datum no configurado.'], 503);
        }

        try {
            $payload = $request->validate([
                'fields' => 'required|array',
            ]);

            $data = $this->jelou->updateRow($tableKey, $rowId, $payload['fields']);

            return response()->json(['ok' => true, 'data' => $data]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 502);
        }
    }

    public function createRow(Request $request, string $tableKey): JsonResponse
    {
        if (! $this->jelou->configured()) {
            return response()->json(['ok' => false, 'message' => 'Datum no configurado.'], 503);
        }

        try {
            $payload = $request->validate([
                'fields' => 'required|array',
            ]);

            $data = $this->jelou->createRow($tableKey, $payload['fields']);

            return response()->json(['ok' => true, 'data' => $data]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 502);
        }
    }

    /** Venta asistencias — buscar lead por cédula (workflow Venta - Contratar). */
    public function ventaLead(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identificacion' => 'required|string|max:20',
        ]);

        if (! $this->jelou->configured()) {
            return response()->json([
                'ok' => true,
                'interested' => false,
                'simulated' => true,
                'message' => 'Datum no configurado; simulación sin lead.',
            ]);
        }

        try {
            $raw = $this->jelou->queryRows('venta_asistencias', [
                'limit' => 1,
                'sortBy' => 'createdAt',
                'sortByOrder' => 'desc',
                'identificacion' => $data['identificacion'],
                'accion_ejecutada' => 'CONTRATADO',
            ]);

            $rows = $raw['results'] ?? $raw['data'] ?? [];
            if (! is_array($rows)) {
                $rows = [];
            }

            $lead = $rows[0] ?? null;

            return response()->json([
                'ok' => true,
                'interested' => $lead !== null,
                'lead' => $lead,
            ]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 502);
        }
    }

    public function ventaMarcarContrato(Request $request): JsonResponse
    {
        $data = $request->validate([
            'row_id' => 'required|string',
            'user_id' => 'nullable|string',
        ]);

        if (! $this->jelou->configured()) {
            return response()->json([
                'ok' => true,
                'simulated' => true,
                'message' => 'Contrato registrado (simulación).',
            ]);
        }

        try {
            $fields = [
                'contrato_asistencia' => 'SI',
                'fecha_hora_contrato' => now('America/Guayaquil')->format('Y-m-d H:i:s'),
            ];
            if (! empty($data['user_id'])) {
                $fields['user_id_contrato'] = $data['user_id'];
            }

            $updated = $this->jelou->updateRow('venta_asistencias', $data['row_id'], $fields);

            return response()->json(['ok' => true, 'data' => $updated]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 502);
        }
    }

    /** IA Router — registro términos (Datum 2756 en Jelou). */
    public function iaRouterTerms(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identificacion' => 'required|string|max:20',
            'nombre' => 'required|string|max:120',
            'usuario' => 'nullable|string|max:64',
        ]);

        if (! $this->jelou->configured()) {
            return response()->json([
                'ok' => true,
                'simulated' => true,
                'message' => 'Términos IA Router (simulación).',
            ]);
        }

        try {
            $created = $this->jelou->createRow('ia_router_terms', [
                'Nombre' => $data['nombre'],
                'Identificación' => $data['identificacion'],
                'Usuario' => $data['usuario'] ?? '',
                'Aprobación' => 'true',
                'Fecha_registro' => now('America/Guayaquil')->toDateString(),
            ]);

            return response()->json(['ok' => true, 'data' => $created]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 502);
        }
    }

    /** Interés comercial / derivación a asesor. */
    public function derivacionLead(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identificacion' => 'required|string|max:20',
            'nombre' => 'nullable|string|max:120',
            'telefono' => 'nullable|string|max:20',
            'producto' => 'nullable|string|max:80',
            'notas' => 'nullable|string|max:500',
        ]);

        if (! $this->jelou->configured()) {
            return response()->json([
                'ok' => true,
                'simulated' => true,
                'message' => 'Solicitud de asesor registrada (simulación).',
            ]);
        }

        try {
            $created = $this->jelou->createRow('venta_asistencias', [
                'identificacion' => $data['identificacion'],
                'nombre' => $data['nombre'] ?? '',
                'telefono' => $data['telefono'] ?? '',
                'producto' => $data['producto'] ?? 'derivacion_asesor',
                'accion_ejecutada' => 'INTERESADO',
                'notas' => $data['notas'] ?? '',
                'origen' => 'lucy_webview',
            ]);

            return response()->json(['ok' => true, 'data' => $created]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 502);
        }
    }
}
