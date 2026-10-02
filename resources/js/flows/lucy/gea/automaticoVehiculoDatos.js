/** Marca / modelo / año para cobertura vial (PNG + CoberturaHelper en Omniax). */

export function ensureVehiculo(gea) {
    if (!gea.vehiculo) gea.vehiculo = {};
    return gea.vehiculo;
}

/** Normaliza fila vehículo-afiliación antes de guardar en contexto. */
export function normalizeVehiculoFromApi(raw) {
    if (!raw || typeof raw !== 'object') return raw;
    const v = { ...raw };
    const marca = String(v.marca_vehiculo || v.marca || v.Marca || '').trim();
    const modelo = String(v.modelo_vehiculo || v.modelo || v.Modelo || '').trim();
    if (marca) {
        v.marca_vehiculo = marca;
        v.marca = marca;
    }
    if (modelo) {
        v.modelo_vehiculo = modelo;
        v.modelo = modelo;
    }
    const anioRaw =
        v.anio_vehiculo
        ?? v.anio
        ?? v.año
        ?? v.año_vehiculo
        ?? v.AnioVehiculo
        ?? v.anio_modelo
        ?? v.year
        ?? '';
    const digits = String(anioRaw).replace(/\D/g, '');
    if (digits) {
        v.anio_vehiculo = digits;
        v.anio = digits;
    }
    return v;
}

function vehNodeId(gea, kind) {
    const byKind = {
        marca: gea?.vehMarcaNodeId,
        modelo: gea?.vehModeloNodeId,
        anio: gea?.vehAnioNodeId,
    };
    const direct = byKind[kind];
    if (direct) return direct;
    const base = gea?.chainBase;
    if (!base) return null;
    const slug = { marca: 'marca', modelo: 'modelo', anio: 'anio' }[kind];
    return slug ? `auto_veh_${slug}_${base}` : null;
}

export function resolveVehMarcaNodeId(gea) {
    return vehNodeId(gea, 'marca');
}

export function resolveVehModeloNodeId(gea) {
    return vehNodeId(gea, 'modelo');
}

export function resolveVehAnioNodeId(gea) {
    return vehNodeId(gea, 'anio');
}

export function resolveVehDatosGateId(gea) {
    return gea?.vehDatosGateId || (gea?.chainBase ? `auto_veh_datos_gate_${gea.chainBase}` : null);
}

export function mergeVehiculoDato(gea, field, raw) {
    const v = ensureVehiculo(gea);
    const text = String(raw ?? '').trim();
    if (field === 'marca_vehiculo') {
        v.marca_vehiculo = text;
        v.marca = text;
    } else if (field === 'modelo_vehiculo') {
        v.modelo_vehiculo = text;
        v.modelo = text;
    } else if (field === 'anio_vehiculo') {
        const digits = text.replace(/\D/g, '');
        v.anio_vehiculo = digits;
        v.anio = digits;
    }
}

export function resolvedAnioVehiculo(gea) {
    const v = gea?.vehiculo || {};
    const raw =
        v.anio_vehiculo
        ?? v.anio
        ?? v.año
        ?? v.año_vehiculo
        ?? v.AnioVehiculo
        ?? v.anio_modelo
        ?? v.year
        ?? '';
    const digits = String(raw).replace(/\D/g, '');
    return digits || '';
}

export function vehiculoDatosCompletos(gea) {
    const v = gea?.vehiculo || {};
    const marca = String(v.marca_vehiculo || v.marca || '').trim();
    const modelo = String(v.modelo_vehiculo || v.modelo || '').trim();
    const anio = resolvedAnioVehiculo(gea);
    if (!marca || !modelo || !anio) return false;
    const y = Number.parseInt(anio, 10);
    return Number.isFinite(y) && y >= 1950 && y <= new Date().getFullYear() + 1;
}

/** Siguiente pantalla de datos vehículo o null si ya está completo. */
export function nextVehiculoDatoStep(gea) {
    const v = gea?.vehiculo || {};
    if (!String(v.marca_vehiculo || v.marca || '').trim()) return 'marca';
    if (!String(v.modelo_vehiculo || v.modelo || '').trim()) return 'modelo';
    if (!vehiculoDatosCompletos(gea)) return 'anio';
    return null;
}

export const ANIO_VEHICULO_RE = /^(19|20)\d{2}$/;
