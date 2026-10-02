/**
 * Servicio 5 — listado establecimientos por proximidad / zona (Omniax medico-dental).
 * Orden y etiquetas según respuesta API (distancia cuando existe).
 */

function parseDistanceKm(record) {
    if (!record || typeof record !== 'object') return null;
    const raw =
        record.distancia_kilometros ??
        record.distancia_km ??
        record.distancia ??
        record.kilometros ??
        record.km;
    if (raw == null || raw === '') return null;
    const n = Number.parseFloat(String(raw).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
}

export function normalizeEstablecimientosList(raw) {
    const list = Array.isArray(raw) ? [...raw] : [];
    list.sort((a, b) => {
        const da = parseDistanceKm(a);
        const db = parseDistanceKm(b);
        if (da != null && db != null) return da - db;
        if (da != null) return -1;
        if (db != null) return 1;
        const oa = Number(a.orden ?? a.orden_proximidad ?? 0);
        const ob = Number(b.orden ?? b.orden_proximidad ?? 0);
        return oa - ob;
    });
    return list;
}

function formatKm(km) {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function establecimientoMenuLabel(record) {
    const name = String(record.nombre_establecimiento ?? record.nombre ?? 'Establecimiento').trim();
    const km = parseDistanceKm(record);
    if (km != null) return `${name} · ${formatKm(km)}`;
    return name;
}
