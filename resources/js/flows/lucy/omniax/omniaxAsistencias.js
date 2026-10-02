/**
 * Servicio 1 — normalización y criterios de reagendar (PDF + respuesta real test-ec).
 * Con `para_reagendar: true` Omniax a veces devuelve `asistencias: []` aunque existan
 * asistencias en proceso; se complementa filtrando el listado estándar.
 */

import { fetchListadoChatbotTelefono } from '@/api/omniaxGeaApi.js';

export function parseAsistenciasResponse(res) {
    const raw = res?.data?.asistencias;
    return Array.isArray(raw) ? raw : [];
}

export function isReagendableAsistencia(asistencia, { requireEspecialidad = true } = {}) {
    if (!asistencia?.id_asistencia) return false;
    const detalle = String(asistencia.detalle || '').trim();
    if (!detalle) return false;

    if (requireEspecialidad) {
        if (!asistencia.id_especialidad || !asistencia.id_establecimiento) return false;
    } else if (!asistencia.id_establecimiento) {
        return false;
    }

    const fecha = String(asistencia.fecha_cita || '').trim();
    if (!fecha || fecha.startsWith('0000')) return false;

    return true;
}

const BARE_ASISTENCIA = /^asistencia\s*(no\.?|#|n[°º]\.?)?\s*\d+\s*$/i;

export function isBareAsistenciaDetalle(detalle) {
    const text = String(detalle || '').trim();
    return !text || BARE_ASISTENCIA.test(text);
}

/** El listado médico/dental deja `detalle` vacío; el nombre vive en listado por teléfono (`solicitante`). */
export function mergeListadoIntoAsistencias(asistencias, listadoRows) {
    const byId = new Map();
    for (const row of listadoRows || []) {
        const id = Number(row?.id_asistencia);
        if (id) byId.set(id, row);
    }
    return (asistencias || []).map((row) => {
        const extra = byId.get(Number(row?.id_asistencia));
        if (!extra) return row;
        const nombre = String(
            row?.nombre_paciente || extra.solicitante || extra.nombre_persona || extra.titular || '',
        ).trim();
        const fecha = String(row?.fecha_cita || extra.fecha || '').trim();
        const hora = String(row?.hora_cita || extra.hora || '').trim();
        return {
            ...row,
            nombre_paciente: nombre || row?.nombre_paciente || null,
            fecha_cita: fecha && !fecha.startsWith('0000') ? fecha : row?.fecha_cita,
            hora_cita: hora || row?.hora_cita || null,
        };
    });
}

export function applyListadoToEnProcesoResponse(apiRes, listadoRows) {
    if (!apiRes?.data || !Array.isArray(apiRes.data.asistencias)) return apiRes;
    apiRes.data.asistencias = mergeListadoIntoAsistencias(apiRes.data.asistencias, listadoRows);
    return apiRes;
}

export async function enrichEnProcesoResponse(apiRes, cedula, telefono) {
    if (!cedula || !telefono || !apiRes?.data?.asistencias?.length) return apiRes;
    try {
        const listado = await fetchListadoChatbotTelefono(cedula, telefono);
        const rows = Array.isArray(listado?.data) ? listado.data : [];
        return applyListadoToEnProcesoResponse(apiRes, rows);
    } catch {
        return apiRes;
    }
}

export function asistenciaMenuLabel(asistencia) {
    const detalle = String(asistencia?.detalle || '').trim();
    const nombre = String(
        asistencia?.nombre_paciente || asistencia?.solicitante || asistencia?.nombre_persona || '',
    ).trim();
    const especialidad = String(asistencia?.nombre_especialidad || '').trim();
    const fecha = String(asistencia?.fecha_cita || '').trim();
    const hora = String(asistencia?.hora_cita || '').trim();
    const fechaOk = fecha && !fecha.startsWith('0000') ? fecha : '';

    if (detalle && !isBareAsistenciaDetalle(detalle)) return detalle;

    const parts = [];
    if (nombre) parts.push(nombre);
    if (especialidad) parts.push(especialidad);
    if (fechaOk) parts.push(hora ? `${fechaOk} ${hora}` : fechaOk);
    parts.push(`Asistencia No. ${asistencia?.id_asistencia ?? ''}`.trim());
    return parts.filter(Boolean).join(' · ');
}

/**
 * @param {(cedula: string, paraReagendar: boolean) => Promise<object>} fetchEnProceso
 */
export async function loadAsistenciasParaReagendar(fetchEnProceso, cedula, options = {}) {
    const resReag = await fetchEnProceso(cedula, true);
    let list = parseAsistenciasResponse(resReag).filter((a) =>
        isReagendableAsistencia(a, options),
    );

    if (list.length) {
        return { res: resReag, list, usedFallback: false };
    }

    const resAll = await fetchEnProceso(cedula, false);
    list = parseAsistenciasResponse(resAll).filter((a) => isReagendableAsistencia(a, options));

    return {
        res: list.length ? resAll : resReag,
        list,
        usedFallback: list.length > 0,
    };
}

/** Mensaje cuando el filtro de reagendar deja la lista vacía (no usar noticias.mensaje del API: suele decir «Listado de asistencias»). */
export function mensajeSinCitasReagendar(tipo) {
    if (tipo === 'dental') {
        return [
            'No hay citas dentales confirmadas para reagendar en Omniax.',
            'Se requiere cita con detalle, establecimiento y fecha válida (servicio dental).',
            'Si tu cita es médica, usa «Reagendar cita médica» en el menú principal.',
        ].join('\n');
    }
    return [
        'No hay citas médicas confirmadas para reagendar en Omniax.',
        'Se requiere especialidad, establecimiento y fecha de cita válida.',
        'Si tu cita es dental, usa el flujo de reagendar en servicios dentales.',
    ].join('\n');
}
