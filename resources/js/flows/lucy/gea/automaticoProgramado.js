/**
 * UI: fecha y hora en dos pasos; API: mismos campos + fecha_hora_programada combinada (diagrama).
 */
export function isAsistenciaProgramada(gea) {
    return Number(gea?.esProgramado) === 1;
}

export function mergeProgramadoForApi(gea) {
    if (!isAsistenciaProgramada(gea)) return {};
    const fecha = String(gea.fecha_programada || '').trim();
    const horaRaw = String(gea.hora_programada || '').trim();
    if (!fecha || !horaRaw) return {};

    let hora = horaRaw;
    if (/^\d{1,2}:\d{2}$/.test(horaRaw)) {
        hora = `${horaRaw}:00`;
    } else if (/^\d{1,2}:\d{2}:\d{2}$/.test(horaRaw)) {
        hora = horaRaw;
    }

    const fecha_hora_programada = `${fecha} ${hora}`;
    gea.fecha_hora_programada = fecha_hora_programada;

    const horaCorta = hora.length >= 5 ? hora.slice(0, 5) : horaRaw;

    return {
        fecha_programada: fecha,
        hora_programada: horaCorta,
        fecha_hora_programada,
    };
}

/** Cobertura/crear vial: GPS obligatorio solo si no es programada (API Automatización). */
export function requiereUbicacionGps(gea, tipoServicio) {
    if (tipoServicio !== 'VIAL') return false;
    return !isAsistenciaProgramada(gea);
}
