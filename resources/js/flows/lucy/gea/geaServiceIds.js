/**
 * id_servicio Omniax (Jelou Lucy Ecuador) para POST /v1/chatbot/asistencias/gea — skill 4220.
 * Fuente: workflows 2-3-hogar, 2-4-vial, 2-2-medico, v2-aseguradora-inicio.
 */
const ID_BY_SERVICE_LABEL = {
    Plomero: '260',
    Electricista: '288',
    Cerrajero: '259',
    Vidriería: '289',
    'Limpieza y mantenimiento': '484',
    'Spa y peluquería': '512',
    Handyman: '515',
    'Grúa (otro motivo)': '256',
    Grúa: '256',
    'Cambio de llanta': '258',
    'Suministro de gasolina': '258',
    'Paso de corriente': '258',
    'Cerrajería de puertas': '299',
    'Cerrajería para apertura': '299',
    'Inspector in situ': '295',
    /** WF `2.4 Vial` lista → MEMORY `Asistencia Legal telefónica` / skill **5231** (sin ubicación). Override: VITE_GEA_ID_ASISTENCIA_LEGAL_TELEFONICA */
    'Asistencia Legal telefónica': '322',
    /** WF `Otras soluciones 2` → skill **5231**. Override: VITE_GEA_ID_OTRAS_SOLUCIONES */
    'Otras soluciones': '476',
    Ambulancia: '257',
    /** WF `2.2 Médico` → Orientación Médica Telf. (skill 4220). Override: VITE_GEA_ID_ORIENTACION_MEDICA_TELEFONICA */
    'Orientación médica telefónica': '302',
    'Médico a domicilio': '303',
    /** WF `2.2.6 Bienestar y nutrición` (skill 4220). Override: VITE_GEA_ID_BIENESTAR_Y_NUTRICION */
    'Bienestar y nutrición': '304',
};

function envOverride(label) {
    const key = `VITE_GEA_ID_${String(label)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .toUpperCase()}`;
    const raw = import.meta.env[key];
    return raw ? String(raw) : null;
}

export function resolveGeaIdServicio(serviceLabel) {
    const fromMap = ID_BY_SERVICE_LABEL[serviceLabel];
    if (fromMap) return fromMap;
    const fromEnv = envOverride(serviceLabel);
    if (fromEnv) return fromEnv;
    return import.meta.env.VITE_GEA_ID_SERVICIO_DEFAULT || null;
}

const TIPO_SERVICIO_BY_JELOU_REF = {
    '2.3 Hogar': 'HOGAR',
    '2.4 Vial': 'VIAL',
    '2.2 Médico': 'MEDICO',
};

/** Opciones para crearAsistenciaChain (WF 4220). */
export function geaChainOptions(serviceLabel, jelouRef, extra = {}) {
    const idServicio = resolveGeaIdServicio(serviceLabel);
    const vial = jelouRef === '2.4 Vial' || jelouRef === 'V2 Aseguradora - Inicio';
    return {
        idServicio,
        requiresPlaca: vial || Boolean(extra.requiresPlaca),
        serviceLabel,
        tipoServicio: extra.tipoServicio || TIPO_SERVICIO_BY_JELOU_REF[jelouRef] || 'HOGAR',
        planAsistencia: extra.planAsistencia || 'ASISTENCIAS',
    };
}
