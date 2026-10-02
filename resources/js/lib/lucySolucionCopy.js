/**
 * Copy visible: “asistencia” → “solución”, con familias (Vial / Dental / Médica / de Hogar).
 * No usar en ids, payloads ni claves de API.
 */
export function rewriteLucySolucionCopy(raw) {
    if (raw == null || raw === '') return raw;
    let s = String(raw);

    s = s.replace(/\b[Oo]tras?\s+[Aa]sistencias?\b/g, 'Solución');

    s = s.replace(/\b[Aa]sistencias?\s+de\s+[Hh]ogar\b/g, 'Solución de Hogar');
    s = s.replace(/\b[Aa]sistencias?\s+[Hh]ogar\b/g, 'Solución de Hogar');

    s = s.replace(/\b[Aa]sistencias\s+[Vv]iales\b/g, 'Soluciones Viales');
    s = s.replace(/\b[Aa]sistencia\s+[Vv]ial\b/g, 'Solución Vial');

    s = s.replace(/\b[Aa]sistencias\s+[Dd]entales\b/g, 'Soluciones Dentales');
    s = s.replace(/\b[Aa]sistencia\s+[Dd]ental\b/g, 'Solución Dental');

    s = s.replace(/\b[Aa]sistencias\s+[Mm][eé]dicas\b/g, 'Soluciones Médicas');
    s = s.replace(/\b[Aa]sistencia\s+[Mm][eé]dica\b/g, 'Solución Médica');

    s = s.replace(/ASISTENCIAS/g, 'SOLUCIONES');
    s = s.replace(/ASISTENCIA/g, 'SOLUCIÓN');
    s = s.replace(/[Aa]sistencias/g, (m) => (m[0] === 'A' ? 'Soluciones' : 'soluciones'));
    s = s.replace(/[Aa]sistencia/g, (m) => (m[0] === 'A' ? 'Solución' : 'solución'));

    s = s.replace(/\btienes soluciones en curso\b/gi, 'Tienes Soluciones en curso');

    return s;
}

export function isExitMenuLabel(label) {
    const text = String(label || '')
        .replace(/\*/g, '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    return /^(no|cancelar|salir|salir del menu|volver al menu|volver)$/.test(text);
}

export function isYesMenuLabel(label) {
    const text = String(label || '')
        .replace(/\*/g, '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    return text === 'si';
}

export function isPrimaryForwardLabel(label) {
    const text = String(label || '')
        .replace(/\*/g, '')
        .replace(/[→\-]/g, ' ')
        .trim()
        .toLowerCase();
    if (!text) return false;
    return /^(continuar|aceptar|aceptas|siguiente)(\b|$)/.test(text);
}

export function shouldUseDockDualCapsule({ canGoBack, actions, busy, grid }) {
    if (busy || grid || !canGoBack) return false;
    if (!Array.isArray(actions) || actions.length !== 1) return false;
    const action = actions[0];
    if (!action || action.type === 'location' || action.type === 'link') return false;
    return isPrimaryForwardLabel(action.label);
}
