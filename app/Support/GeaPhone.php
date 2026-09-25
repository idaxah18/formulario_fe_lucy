<?php

namespace App\Support;

final class GeaPhone
{
    /** Normaliza WhatsApp 593… → 09… (tool Asistencia en Curso / Notificar Cabina). */
    public static function normalizeRemitente(?string $telefono): string
    {
        $digits = preg_replace('/\D+/', '', (string) $telefono) ?? '';
        if ($digits === '') {
            return (string) config('services.gea_omniax.telefono_default', '0999999999');
        }
        if (str_starts_with($digits, '593') && strlen($digits) >= 12) {
            $local = '0'.substr($digits, 3);
            return substr($local, 0, 10);
        }
        if (strlen($digits) === 9 && $digits[0] !== '0') {
            return '0'.$digits;
        }
        if (strlen($digits) > 10) {
            $tail = substr($digits, -10);
            if (! str_starts_with($tail, '0')) {
                $tail = '0'.substr($tail, 1);
            }

            return $tail;
        }

        return $digits;
    }
}
