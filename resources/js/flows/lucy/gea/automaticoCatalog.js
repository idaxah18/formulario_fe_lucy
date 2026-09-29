/**
 * Servicios que entran al flujo automático (Listado opciones chatbot + Api Automatizacion).
 * Grúa (otro motivo) 256, inspector, legal, etc. siguen crearAsistenciaChain → asistencias/gea.
 */
const AUTOMATIC_BY_JELOU = {
    '2.4 Vial': new Set([
        'Grúa por avería',
        'Cambio de llanta',
        'Suministro de gasolina',
        'Paso de corriente',
        'Cerrajería de puertas',
    ]),
    '2.3 Hogar': new Set(['Plomero', 'Electricista']),
};

/** IDs proceso-automatico (listado GEA; override con VITE_GEA_AUTO_ID_*). */
const AUTOMATIC_SERVICE_META = {
    'Cambio de llanta': { id: 3, nivel_busquedad: 'SUBSERVICIO' },
    'Suministro de gasolina': { id: 163, nivel_busquedad: 'SUBSERVICIO', requiresCombustible: true },
    'Paso de corriente': { id: 2, nivel_busquedad: 'SUBSERVICIO' },
    'Cerrajería de puertas': { id: 299, nivel_busquedad: 'SERVICIO' },
    Plomero: { id: 4, nivel_busquedad: 'SUBSERVICIO' },
    Electricista: { id: 57, nivel_busquedad: 'SUBSERVICIO' },
    'Grúa por avería': {
        id: 159,
        nivel_busquedad: 'SUBSERVICIO',
        requiresCoordValidation: true,
        tiposVehiculoAutogestion: ['MOTOCICLETA', 'LIVIANO'],
    },
    'Remolque por avería': {
        id: 159,
        nivel_busquedad: 'SUBSERVICIO',
        requiresCoordValidation: true,
        tiposVehiculoAutogestion: ['MOTOCICLETA', 'LIVIANO'],
    },
};

function envAutoId(serviceLabel) {
    const key = `VITE_GEA_AUTO_ID_${String(serviceLabel)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .toUpperCase()}`;
    const raw = import.meta.env[key];
    return raw ? Number(raw) : null;
}

export function usesProcesoAutomatico(serviceLabel, jelouRef) {
    const set = AUTOMATIC_BY_JELOU[jelouRef];
    return set ? set.has(serviceLabel) : false;
}

export function resolveAutomaticoConfig(serviceLabel, jelouRef) {
    const meta = AUTOMATIC_SERVICE_META[serviceLabel] || {};
    const id = envAutoId(serviceLabel) ?? meta.id ?? null;
    const tipoServicio = jelouRef === '2.3 Hogar' ? 'HOGAR' : 'VIAL';
    const vial = tipoServicio === 'VIAL';

    return {
        serviceLabel,
        jelouRef,
        id_servicio_subservicio: id,
        nivel_busquedad: meta.nivel_busquedad || (vial ? 'SUBSERVICIO' : 'SUBSERVICIO'),
        tipo_servicio: tipoServicio,
        plan_asistencia: 'ASISTENCIAS',
        requiresPlaca: vial,
        requiresVehiculo: vial,
        requiresUbicacionApi: vial,
        requiresCombustible: Boolean(meta.requiresCombustible),
        requiresCoordValidation: Boolean(meta.requiresCoordValidation),
        tiposVehiculoAutogestion: meta.tiposVehiculoAutogestion ?? (vial ? ['MOTOCICLETA', 'LIVIANO'] : null),
        tipo_coordenada: 'TRASLADO',
    };
}
