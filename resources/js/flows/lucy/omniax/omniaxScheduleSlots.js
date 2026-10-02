import {
    formatHora12LabelFrom24,
    formatOmniaxHora24FromMinutes,
    minutesFromOmniaxHora,
    minutesFromUser24,
    normalizeOmniaxHorasList,
    normalizeToOmniaxHora24,
} from './omniaxHoraFormat.js';

export const DIAS_MENU_MAX = 5;
export const HORAS_PAGE_SIZE = 9;

/** Fin mañana / inicio tarde / fin tarde / inicio noche (minutos desde 00:00). */
export const FRANJA_MANANA_END = 11 * 60 + 30;
export const FRANJA_TARDE_START = 12 * 60;
export const FRANJA_TARDE_END = 18 * 60 + 30;
export const FRANJA_NOCHE_START = 19 * 60;

export const FRANJAS = [
    { id: 'manana', label: 'Mañana', hint: 'Desde la apertura hasta las 11:30 a. m.' },
    { id: 'tarde', label: 'Tarde', hint: '12:00 p. m. a 6:30 p. m.' },
    { id: 'noche', label: 'Noche', hint: '7:00 p. m. hasta el cierre' },
];

const EST_OPEN_KEYS = [
    'hora_apertura',
    'hora_inicio',
    'hora_inicio_atencion',
    'horario_apertura',
    'hora_apertura_establecimiento',
];
const EST_CLOSE_KEYS = [
    'hora_cierre',
    'hora_fin',
    'hora_fin_atencion',
    'horario_cierre',
    'hora_cierre_establecimiento',
];

export function pickEstablecimientoHorarioFromRecord(record) {
    if (!record || typeof record !== 'object') return { open: null, close: null };
    let open = null;
    let close = null;
    for (const k of EST_OPEN_KEYS) {
        if (record[k]) {
            open = String(record[k]).trim();
            break;
        }
    }
    for (const k of EST_CLOSE_KEYS) {
        if (record[k]) {
            close = String(record[k]).trim();
            break;
        }
    }
    const horario = record.horario_atencion || record.horario;
    if ((!open || !close) && horario && typeof horario === 'string') {
        const parts = horario.split(/\s*[-–a]\s*/i);
        if (parts.length >= 2) {
            open = open || parts[0].trim();
            close = close || parts[parts.length - 1].trim();
        }
    }
    return { open, close };
}

export function establecimientoHorarioMinutes(omx) {
    const openRaw = omx?.hora_apertura_establecimiento;
    const closeRaw = omx?.hora_cierre_establecimiento;
    const openMin = openRaw ? minutesFromOmniaxHora(openRaw) ?? minutesFromUser24(openRaw) : null;
    const closeMin = closeRaw ? minutesFromOmniaxHora(closeRaw) ?? minutesFromUser24(closeRaw) : null;
    return { openMin, closeMin, openRaw, closeRaw };
}

export function inferHorarioFromSlots(horasByFecha) {
    let min = null;
    let max = null;
    for (const slots of Object.values(horasByFecha || {})) {
        for (const slot of normalizeOmniaxHorasList(slots)) {
            const m = slotMinutesFromApi(slot);
            if (m == null) continue;
            if (min == null || m < min) min = m;
            if (max == null || m > max) max = m;
        }
    }
    if (min == null || max == null) return { open: null, close: null };
    return {
        open: formatOmniaxHora24FromMinutes(min),
        close: formatOmniaxHora24FromMinutes(max),
    };
}

export function formatEstablecimientoHorarioHint(omx, horasByFecha) {
    let { openRaw, closeRaw } = establecimientoHorarioMinutes(omx);
    if (!openRaw || !closeRaw) {
        const inferred = inferHorarioFromSlots(horasByFecha);
        openRaw = openRaw || inferred.open;
        closeRaw = closeRaw || inferred.close;
    }
    if (!openRaw || !closeRaw) {
        return 'Horario del establecimiento: consulta con el centro si necesitas el detalle.';
    }
    const o = normalizeToOmniaxHora24(openRaw) || openRaw;
    const c = normalizeToOmniaxHora24(closeRaw) || closeRaw;
    return `Horario del establecimiento: ${formatHora12LabelFrom24(o)} a ${formatHora12LabelFrom24(c)}.`;
}

export function slotMinutesFromApi(slot) {
    const label =
        slot && typeof slot === 'object'
            ? String(slot.valor ?? slot.etiqueta ?? slot.hora ?? '').trim()
            : String(slot ?? '').trim();
    const startPart = label.split(/\s+a\s+/i)[0]?.trim() || label;
    return minutesFromOmniaxHora(startPart) ?? minutesFromUser24(startPart);
}

export function slotHora24FromApi(slot) {
    const m = slotMinutesFromApi(slot);
    if (m == null) return null;
    return formatOmniaxHora24FromMinutes(m);
}

export function classifyFranja(slotMin, { openMin, closeMin }) {
    const open = openMin ?? 0;
    const close = closeMin ?? 24 * 60 - 1;
    if (slotMin >= open && slotMin <= FRANJA_MANANA_END) return 'manana';
    if (slotMin >= FRANJA_TARDE_START && slotMin <= FRANJA_TARDE_END) return 'tarde';
    if (slotMin >= FRANJA_NOCHE_START && slotMin <= close) return 'noche';
    return null;
}

export function filterSlotsByFranja(slots, franjaId, horario) {
    if (!franjaId) return slots || [];
    const { openMin, closeMin } = horario;
    return (slots || []).filter((slot) => {
        const m = slotMinutesFromApi(slot);
        if (m == null) return false;
        return classifyFranja(m, { openMin, closeMin }) === franjaId;
    });
}

export function franjasWithAvailability(horasByFecha, horario) {
    const found = new Set();
    for (const slots of Object.values(horasByFecha || {})) {
        for (const slot of slots || []) {
            const m = slotMinutesFromApi(slot);
            if (m == null) continue;
            const f = classifyFranja(m, horario);
            if (f) found.add(f);
        }
    }
    return FRANJAS.filter((f) => found.has(f.id));
}

export function diasWithFranja(dias, horasByFecha, franjaId, horario) {
    return (dias || []).filter((d) => {
        const slots = horasByFecha?.[d.valor];
        return filterSlotsByFranja(slots, franjaId, horario).length > 0;
    });
}

export function limitDias(dias, max = DIAS_MENU_MAX) {
    return (dias || []).slice(0, max);
}

/** Agendar: bloques de 30 min (ej. 1:30 p. m. a 2:00 p. m.). Reagendar: cada 20 min (solo hora). */
export function formatSlotMenuLabel(slot, reagendar) {
    const raw =
        slot && typeof slot === 'object'
            ? String(slot.etiqueta ?? slot.valor ?? slot.hora ?? '').trim()
            : String(slot ?? '').trim();
    if (/\s+a\s+/i.test(raw)) {
        return raw.replace(/\s+a\s+/gi, (m) => m.trim() === 'a' ? ' a ' : ' a ');
    }
    const h24 = slotHora24FromApi(slot);
    if (!h24) return raw;
    if (reagendar) {
        return formatHora12LabelFrom24(h24);
    }
    const startMin = minutesFromUser24(h24);
    const endMin = startMin + 30;
    const end24 = formatOmniaxHora24FromMinutes(endMin);
    return `${formatHora12LabelFrom24(h24)} a ${formatHora12LabelFrom24(end24)}`;
}

export function cacheKeyForSchedule(omx) {
    return [
        omx.id_establecimiento,
        omx.id_especialidad ?? '',
        omx.id_asistencia ?? '',
        omx.reagendar ? '1' : '0',
    ].join('|');
}

export async function ensureScheduleHorasCache(omx, { fetchDias, fetchHoras }) {
    const key = cacheKeyForSchedule(omx);
    if (omx._schedule_cache_key === key && omx.schedule_horas_by_fecha) {
        return {
            dias: omx.schedule_dias || [],
            horasByFecha: omx.schedule_horas_by_fecha,
        };
    }

    const diasRes = await fetchDias();
    const diasAll = diasRes.data || [];
    const diasProbe = limitDias(diasAll, DIAS_MENU_MAX);

    const horasByFecha = {};
    await Promise.all(
        diasProbe.map(async (d) => {
            const horasRes = await fetchHoras(d.valor);
            horasByFecha[d.valor] = horasRes.data || [];
        }),
    );

    omx._schedule_cache_key = key;
    omx.schedule_dias = diasAll;
    omx.schedule_horas_by_fecha = horasByFecha;

    const { openMin, closeMin } = establecimientoHorarioMinutes(omx);
    if (openMin == null || closeMin == null) {
        const inferred = inferHorarioFromSlots(horasByFecha);
        if (!omx.hora_apertura_establecimiento && inferred.open) {
            omx.hora_apertura_establecimiento = inferred.open;
        }
        if (!omx.hora_cierre_establecimiento && inferred.close) {
            omx.hora_cierre_establecimiento = inferred.close;
        }
    }

    return { dias: diasAll, horasByFecha };
}

export function clearScheduleCache(omx) {
    delete omx._schedule_cache_key;
    delete omx.schedule_dias;
    delete omx.schedule_horas_by_fecha;
}

export function patchOmniaxScheduleMeta(target, rest, prevEstablecimiento) {
    const prevEst = prevEstablecimiento ?? target.id_establecimiento;
    if (rest.id_establecimiento !== undefined && rest.id_establecimiento !== prevEst) {
        clearScheduleCache(target);
        delete target.horas_franja;
        delete target.fecha;
        delete target.horas_slots;
        delete target._horas_fecha;
    }
    if (rest.hora_apertura_establecimiento !== undefined) {
        target.hora_apertura_establecimiento = rest.hora_apertura_establecimiento;
    }
    if (rest.hora_cierre_establecimiento !== undefined) {
        target.hora_cierre_establecimiento = rest.hora_cierre_establecimiento;
    }
    if (rest.horas_franja !== undefined) {
        target.horas_page = 0;
        delete target.horas_slots;
    }
}
