<?php

namespace App\Support;

final class GeaPhone
{
    /** Normaliza WhatsApp 593… → 09… (tool Asistencia en Curso / Notificar Cabina). */
    /**
     * @param  bool  $allowDefault  Solo scripts/CLI legacy; el chat webview debe enviar teléfono explícito.
     */
    public static function normalizeRemitente(?string $telefono, bool $allowDefault = false): string
    {
        $digits = preg_replace('/\D+/', '', (string) $telefono) ?? '';
        if ($digits === '') {
            if ($allowDefault) {
                return (string) config('services.gea_omniax.telefono_default', '0999999999');
            }

            throw new \InvalidArgumentException('telefono_requerido');
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

    /** Normaliza o lanza si falta (APIs del chat webview). */
    public static function requireRemitente(?string $telefono): string
    {
        return self::normalizeRemitente($telefono, false);
    }
}
