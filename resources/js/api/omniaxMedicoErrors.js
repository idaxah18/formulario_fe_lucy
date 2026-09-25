/**
 * Texto para el chat a partir de la respuesta estándar de Omniax
 * ({ estado, noticias, errors }).
 */
export function formatOmniaxErrorMessage(error) {
    const body = error?.omniax ?? error?.response?.data;
    if (!body || typeof body !== 'object') {
        return error?.message || 'No pudimos completar la operación con Omniax.';
    }

    const lines = [];

    const titulo = body.noticias?.titulo;
    const mensaje = body.noticias?.mensaje;
    if (titulo && titulo !== 'Aviso' && titulo !== 'Error') {
        lines.push(titulo);
    }
    if (mensaje) {
        lines.push(mensaje);
    }

    if (body.errors && typeof body.errors === 'object') {
        for (const [field, msgs] of Object.entries(body.errors)) {
            const list = Array.isArray(msgs) ? msgs : [msgs];
            for (const item of list) {
                const text = String(item).trim();
                if (!text) continue;
                lines.push(field ? `${field}: ${text}` : text);
            }
        }
    }

    if (lines.length) {
        return lines.join('\n');
    }

    return error?.message || 'No pudimos completar la operación con Omniax.';
}

export function attachOmniaxError(err, body, status) {
    const wrapped = err instanceof Error ? err : new Error('Error Omniax');
    wrapped.omniax = body;
    wrapped.status = status;
    if (body?.noticias?.mensaje) {
        wrapped.message = body.noticias.mensaje;
    }
    return wrapped;
}
