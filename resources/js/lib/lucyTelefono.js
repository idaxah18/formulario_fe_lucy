const STORAGE_KEY = 'lucy_prueba_telefono';

/** Celular Ecuador: 10 dígitos iniciando en 09 */
export const TELEFONO_EC_RE = /^09\d{8}$/;

export function getTelefonoFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('telefono') || params.get('userId') || '';
    const normalized = normalizeLucyTelefono(raw);
    return normalized || null;
}

/** Solo webview/WhatsApp: teléfono viene en la URL y no pedimos input de prueba. */
export function shouldSkipTelefonoPrompt() {
    return Boolean(getTelefonoFromQuery());
}

export function normalizeLucyTelefono(raw) {
    const digits = String(raw ?? '').replace(/\D+/g, '');
    if (!digits) return null;

    if (digits.startsWith('593') && digits.length >= 12) {
        const local = `0${digits.slice(3)}`;
        return local.slice(0, 10);
    }
    if (digits.length === 9 && digits[0] !== '0') {
        return `0${digits}`;
    }
    if (digits.length > 10) {
        let tail = digits.slice(-10);
        if (!tail.startsWith('0')) {
            tail = `0${tail.slice(1)}`;
        }
        return tail;
    }
    return digits;
}

export function isValidLucyTelefono(raw) {
    const n = normalizeLucyTelefono(raw);
    return n != null && TELEFONO_EC_RE.test(n);
}

export function persistLucyTelefono(telefono) {
    try {
        sessionStorage.setItem(STORAGE_KEY, telefono);
    } catch {
        /* ignore */
    }
}

export function readPersistedLucyTelefono() {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        return normalizeLucyTelefono(stored);
    } catch {
        return null;
    }
}

/** Teléfono activo para APIs: query (producción) → contexto del chat → sesión de prueba. */
export function resolveLucyTelefono(context = null) {
    if (context?.telefono) {
        const n = normalizeLucyTelefono(context.telefono);
        if (n) return n;
    }
    const fromQuery = getTelefonoFromQuery();
    if (fromQuery) return fromQuery;
    return readPersistedLucyTelefono();
}

export function requireLucyTelefono(context = null) {
    const tel = resolveLucyTelefono(context);
    if (!tel) {
        throw new Error(
            'Falta tu número de celular. Vuelve al inicio e ingrésalo (paso Teléfono) o usa ?telefono= en la URL.',
        );
    }
    return tel;
}

export function applyLucyTelefonoToContext(context, raw) {
    const tel = normalizeLucyTelefono(raw);
    if (!tel || !TELEFONO_EC_RE.test(tel)) return false;
    context.telefono = tel;
    persistLucyTelefono(tel);
    return true;
}
