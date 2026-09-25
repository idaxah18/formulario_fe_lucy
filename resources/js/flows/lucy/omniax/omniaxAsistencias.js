/**
 * Servicio 1 — normalización y criterios de reagendar (PDF + respuesta real test-ec).
 * Con `para_reagendar: true` Omniax a veces devuelve `asistencias: []` aunque existan
 * asistencias en proceso; se complementa filtrando el listado estándar.
 */

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

export function asistenciaMenuLabel(asistencia) {
    const detalle = String(asistencia.detalle || '').trim();
    if (detalle) return detalle;

    const parts = [`Asistencia No. ${asistencia.id_asistencia}`];
    if (asistencia.nombre_especialidad) parts.push(asistencia.nombre_especialidad);
    if (asistencia.nombre_paciente) parts.push(asistencia.nombre_paciente);
    if (asistencia.fecha_cita && !String(asistencia.fecha_cita).startsWith('0000')) {
        parts.push(asistencia.fecha_cita);
    }
    return parts.join(' - ');
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
