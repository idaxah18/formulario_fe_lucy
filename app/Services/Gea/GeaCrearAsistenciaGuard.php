<?php

namespace App\Services\Gea;

use Illuminate\Validation\ValidationException;

/**
 * Bloquea ids de proceso-automatico en POST /v1/chatbot/asistencias/gea.
 * (299 cerrajería es válido en ambos mundos — no incluido.)
 */
final class GeaCrearAsistenciaGuard
{
    /** @var list<int> */
    private const PROCESO_AUTOMATICO_ONLY = [2, 3, 4, 57, 159, 163];

    public static function assertIdServicioPermitido(string $idServicio): void
    {
        $n = (int) $idServicio;
        if (in_array($n, self::PROCESO_AUTOMATICO_ONLY, true)) {
            throw ValidationException::withMessages([
                'id_servicio' => [
                    'El id pertenece a proceso automático; no es válido para POST asistencias/gea (cabina).',
                ],
            ]);
        }
    }
}
