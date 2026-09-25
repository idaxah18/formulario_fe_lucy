import { bot } from '../flowHelpers.js';

/** Mensaje de chat a partir de la respuesta estándar Omniax. */
export function botFromOmniaxResponse(res, extraLines = []) {
    const lines = [];
    const titulo = res?.noticias?.titulo;
    const mensaje = res?.noticias?.mensaje;
    if (titulo && !/^éxito|exito|ok$/i.test(String(titulo).trim())) {
        lines.push(String(titulo).trim());
    }
    if (mensaje) {
        lines.push(String(mensaje).trim());
    }
    for (const line of extraLines) {
        if (line) lines.push(String(line).trim());
    }
    const text = lines.filter(Boolean).join('\n');
    return bot(text || 'Operación completada.');
}
