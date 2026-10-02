/**
 * Omniax espera `hora` como HH:mm en 24 h (ej. "08:30", "20:30").
 * El servicio 9 puede devolver etiquetas con AM/PM; se normalizan al enviar crear/reagendar.
 */

export function normalizeOmniaxHoraLabel(slot) {
    if (slot && typeof slot === 'object') {
        return String(slot.valor ?? slot.etiqueta ?? slot.hora ?? '').trim();
    }
    return String(slot ?? '').trim();
}

export function normalizeOmniaxHorasList(data) {
    return (data || []).map(normalizeOmniaxHoraLabel).filter(Boolean);
}

export function minutesFromUser24(hora) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hora).trim());
    if (!m) return null;
    const h = Number.parseInt(m[1], 10);
    const min = Number.parseInt(m[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return h * 60 + min;
}

export function minutesFromOmniaxHora(label) {
    let s = String(label).trim();
    const rangeSplit = /\s+a\s+/i.exec(s);
    if (rangeSplit) {
        s = s.slice(0, rangeSplit.index).trim();
    }
    const twelve = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(a\.?\s*m\.?|p\.?\s*m\.?|AM|PM)$/i.exec(s);
    if (twelve) {
        let h = Number.parseInt(twelve[1], 10);
        const min = Number.parseInt(twelve[2], 10);
        const pm = /^p/i.test(twelve[3]);
        if (pm && h < 12) h += 12;
        if (!pm && h === 12) h = 0;
        return h * 60 + min;
    }
    const twentyFour = /^(\d{1,2}):(\d{2})$/.exec(s);
    if (twentyFour) {
        const h = Number.parseInt(twentyFour[1], 10);
        const min = Number.parseInt(twentyFour[2], 10);
        if (h < 0 || h > 23 || min < 0 || min > 59) return null;
        return h * 60 + min;
    }
    return null;
}

export function formatOmniaxHora24FromMinutes(mins) {
    const h = Math.floor(mins / 60);
    const min = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Etiqueta amigable 12 h (API sigue en 24 h). */
export function formatHora12LabelFrom24(hhmm) {
    const mins = minutesFromUser24(hhmm);
    if (mins == null) return String(hhmm ?? '').trim();
    const h24 = Math.floor(mins / 60);
    const min = mins % 60;
    const pm = h24 >= 12;
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const suffix = pm ? 'p. m.' : 'a. m.';
    return `${h12}:${String(min).padStart(2, '0')} ${suffix}`;
}

/** Servicios 7–9: solo validar contra slots cuando hay agenda con establecimiento o es reagendar. */
export function mustValidateOmniaxSlots(omx) {
    if (omx?.reagendar) return true;
    return omx?.agenda_completa !== false;
}

/** Normaliza entrada del usuario (24 h o 12 h AM/PM) → "HH:mm" para la API. */
export function normalizeToOmniaxHora24(input) {
    const mins = minutesFromUser24(input) ?? minutesFromOmniaxHora(input);
    if (mins == null) return null;
    return formatOmniaxHora24FromMinutes(mins);
}

/** Valida que la hora exista en los slots del servicio 9 y devuelve "HH:mm". */
export function resolveOmniaxHoraSlot24(userHora, apiSlots) {
    const userMin = minutesFromUser24(userHora) ?? minutesFromOmniaxHora(userHora);
    if (userMin == null) return null;

    const labels = normalizeOmniaxHorasList(apiSlots);
    for (const label of labels) {
        const slotMin = minutesFromOmniaxHora(label);
        if (slotMin === userMin) {
            return formatOmniaxHora24FromMinutes(slotMin);
        }
    }
    return null;
}
