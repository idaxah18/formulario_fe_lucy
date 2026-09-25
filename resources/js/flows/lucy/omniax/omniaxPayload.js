/** Coordenadas QA documentadas (proveedor Jelou en listados GPS). */
export const OMNX_QA_LAT = '-2.164525162397198';
export const OMNX_QA_LNG = '-79.89574580754577';

export function resolveCrearCoordenadas(omx, ctx) {
    const loc = ctx?.lastLocation || omx;
    const lat = String(omx?.latitud ?? loc?.latitude ?? OMNX_QA_LAT);
    const lng = String(omx?.longitud ?? loc?.longitude ?? OMNX_QA_LNG);
    return { latitud: lat, longitud: lng };
}

export function withBeneficiarioFields(payload, omx) {
    if (!omx?.para_beneficiario) return payload;
    return {
        ...payload,
        identificacion_beneficiario: omx.identificacion_beneficiario,
        nombre_beneficiario: omx.nombre_beneficiario,
        edad_beneficiario: omx.edad_beneficiario,
        sexo_beneficiario: omx.sexo_beneficiario,
        parentesco_beneficiario: omx.parentesco_beneficiario,
    };
}

/** Payload servicio 12 (PDF Omniax): telefono, id_asistencia, fecha, hora (+ beneficiario opcional). */
export function buildReagendarPayload({ telefono, omx }) {
    const base = {
        telefono: String(telefono),
        id_asistencia: Number(omx.id_asistencia),
        fecha: String(omx.fecha || ''),
        hora: String(omx.hora || ''),
    };
    return withBeneficiarioFields(base, omx);
}

export function clearBeneficiarioFields(omx) {
    omx.para_beneficiario = false;
    delete omx.identificacion_beneficiario;
    delete omx.nombre_beneficiario;
    delete omx.edad_beneficiario;
    delete omx.sexo_beneficiario;
    delete omx.parentesco_beneficiario;
}
