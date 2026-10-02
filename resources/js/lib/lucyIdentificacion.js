/** Cédula en webview Lucy: solo dígitos, máx. 15. */
export const CEDULA_DIGITS_RE = /^\d{1,15}$/;

/** Otros flujos (beneficiario, etc.): alfanumérico. */
export const IDENTIFICACION_RE = /^[A-Za-z0-9]{1,15}$/;

export function normalizeLucyIdentificacion(raw) {
    return String(raw ?? '').trim();
}

export function isValidLucyIdentificacion(raw) {
    const t = normalizeLucyIdentificacion(raw);
    return IDENTIFICACION_RE.test(t);
}

export function isValidLucyCedula(raw) {
    const t = normalizeLucyIdentificacion(raw);
    return CEDULA_DIGITS_RE.test(t);
}

export function sanitizeCedulaDigits(raw) {
    return String(raw ?? '')
        .replace(/\D/g, '')
        .slice(0, 15);
}

export function sanitizeIdentificacionInput(raw) {
    return String(raw ?? '')
        .replace(/[^A-Za-z0-9]/g, '')
        .slice(0, 15);
}

export function sanitizeTelefonoDigits(raw) {
    return String(raw ?? '')
        .replace(/\D/g, '')
        .slice(0, 10);
}
