/** Valores API (`tipo_vehiculo` en cobertura) — catálogo GEA. */
export const TIPO_VEHICULO_OPCIONES = [
    'MOTOCICLETA',
    'LIVIANO',
    'SEMI PESADO',
    'PESADO',
    'EXTRA PESADO',
    'MEDIANO',
    'BLINDADO',
];

export const TIPO_VEHICULO_ICON = {
    MOTOCICLETA: 'motorbike',
    LIVIANO: 'car',
    'SEMI PESADO': 'van',
    PESADO: 'bus',
    'EXTRA PESADO': 'truck',
    MEDIANO: 'car',
    BLINDADO: 'caravan',
};

/** Etiqueta en menú (Motocicleta, Semi pesado, …). */
export function formatTipoVehiculoLabel(apiValue) {
    return String(apiValue)
        .trim()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export function tipoVehiculoApiValue(raw) {
    return String(raw).trim().toUpperCase();
}

export function mergeTiposVehiculoPermitidosFromApi(gea, res) {
    const raw = res?.data;
    if (!raw) return;
    const list =
        (Array.isArray(raw) ? raw[0] : raw)?.tipos_vehiculo_permitidos
        ?? (Array.isArray(raw) ? raw[0] : raw)?.tipos_vehiculo_autogestionados
        ?? raw?.tipos_vehiculo_permitidos
        ?? raw?.tipos_vehiculo_autogestionados
        ?? (Array.isArray(raw) ? null : raw?.tipos_vehiculo);
    if (Array.isArray(list) && list.length) {
        gea.tiposVehiculoPermitidos = list.map((t) => tipoVehiculoApiValue(t));
    }
}

export function resolvedTipoVehiculo(gea) {
    const v = gea?.vehiculo || {};
    const raw =
        v.tipo_vehiculo
        ?? v.tipo
        ?? v.categoria_vehiculo
        ?? v.categoria
        ?? '';
    const api = tipoVehiculoApiValue(raw);
    return api || '';
}

export function needsTipoVehiculoCategorization(gea) {
    const tipo = gea?.tipoServicio || gea?.automatico?.tipo_servicio;
    if (tipo !== 'VIAL') return false;
    return !resolvedTipoVehiculo(gea);
}

export function buildTipoVehiculoMenuActions(gea, nextNodeId) {
    return TIPO_VEHICULO_OPCIONES.map((apiValue, index) => ({
        id: `tipo_veh_${index}`,
        label: formatTipoVehiculoLabel(apiValue),
        next: nextNodeId,
        icon: TIPO_VEHICULO_ICON[apiValue] || 'car',
        menuTone: 'tone-asist-vial',
        meta: { gea: { setTipoVehiculo: apiValue } },
    }));
}

export function resolveTipoVehiculoMenuNodeId(gea) {
    if (gea?.afterTipoVehiculoMenuNext) return gea.afterTipoVehiculoMenuNext;
    const base = gea?.chainBase;
    if (base) return `auto_tipo_vehiculo_pick_${base}`;
    return null;
}

export function clearVehiculoTipoCategorization(gea) {
    if (!gea?.vehiculo) return;
    delete gea.vehiculo.tipo_vehiculo;
    delete gea.vehiculo.tipo;
    delete gea.vehiculo.categoria;
    delete gea.vehiculo.categoria_vehiculo;
}
