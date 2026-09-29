import { parseAsistenciasResponse, asistenciaMenuLabel } from '../omniax/omniaxAsistencias.js';

export function pickIdAsistenciaRow(row) {
    const id = row?.id_asistencia ?? row?.IdAsistencia ?? row?.id ?? row?.ID;
    return id != null ? Number(id) : null;
}

/** @param {'gea'|'medico'|'dental'} source */
export function resolveTipoAsistencia(row, source) {
    if (source === 'medico') return 'Médica';
    if (source === 'dental') return 'Dental';

    const ts = String(row?.tipo_servicio ?? row?.TipoServicio ?? row?.tipo ?? '').toUpperCase();
    if (ts.includes('VIAL')) return 'Vial';
    if (ts.includes('HOGAR') || ts.includes('HOME')) return 'Hogar';
    if (ts.includes('MEDIC')) return 'Médica';
    if (ts.includes('DENT')) return 'Dental';

    const desc = String(
        row?.servicio_descripcion ?? row?.servicio ?? row?.detalle ?? row?.descripcion ?? '',
    ).toLowerCase();
    if (/\bvial\b|grúa|grua|llanta/.test(desc)) return 'Vial';
    if (/hogar|plomer|electric|cerraj/.test(desc)) return 'Hogar';
    if (/dental|odont/.test(desc)) return 'Dental';
    if (/médic|medic|consulta|cita/.test(desc)) return 'Médica';

    return 'Asistencia GEA';
}

function geaEnCursoRows(toolPayload) {
    if (!toolPayload || typeof toolPayload !== 'object') return [];
    if (toolPayload.branch === 'exito_consulta' && Array.isArray(toolPayload.data)) {
        return toolPayload.data;
    }
    const raw = toolPayload.raw;
    if (!raw || typeof raw !== 'object') return [];
    const data = raw.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.asistencias)) return data.asistencias;
    return [];
}

/**
 * @param {object} params
 * @param {Awaited<ReturnType<import('@/api/geaToolsApi.js').fetchAsistenciaEnCurso>>|null} params.geaTool
 * @param {object|null} params.medicoRes
 * @param {object|null} params.dentalRes
 */
export function mergeAsistenciasActivas({ geaTool, medicoRes, dentalRes }) {
    const merged = [];
    const seen = new Set();

    const push = (row, source) => {
        if (!row || typeof row !== 'object') return;
        const id = pickIdAsistenciaRow(row);
        const key = id != null ? `id:${id}` : `x:${source}:${merged.length}`;
        if (id != null && seen.has(key)) return;
        if (id != null) seen.add(key);

        const tipo = resolveTipoAsistencia(row, source);
        const detalle =
            source === 'medico' || source === 'dental'
                ? asistenciaMenuLabel(row)
                : String(
                      row.servicio_descripcion ??
                          row.servicio ??
                          row.detalle ??
                          row.descripcion ??
                          '',
                  ).trim() || `Asistencia #${id ?? '?'}`;

        merged.push({
            source,
            tipo,
            id,
            row,
            detalle,
        });
    };

    for (const row of geaEnCursoRows(geaTool)) push(row, 'gea');
    for (const row of parseAsistenciasResponse(medicoRes)) push(row, 'medico');
    for (const row of parseAsistenciasResponse(dentalRes)) push(row, 'dental');

    return merged;
}

export const ASISTENCIAS_ACTIVAS_PAGE_SIZE = 6;

function itemSortTimestamp(item) {
    const row = item?.row ?? {};
    const raw =
        row.fecha_cita
        ?? row.fecha
        ?? row.fecha_registro
        ?? row.FechaCreacion
        ?? row.created_at
        ?? row.fecha_hora;
    if (!raw) return 0;
    const normalized = String(raw).trim().replace(/^(\d{4}-\d{2}-\d{2}) (\d)/, '$1T$2');
    const t = Date.parse(normalized);
    return Number.isNaN(t) ? 0 : t;
}

/** Más reciente primero. */
export function sortAsistenciasActivasDesc(items) {
    return [...items].sort((a, b) => itemSortTimestamp(b) - itemSortTimestamp(a));
}

export function labelAsistenciaActiva(item) {
    const idPart = item.id != null ? ` #${item.id}` : '';
    return `${item.tipo}${idPart} — ${item.detalle}`.slice(0, 120);
}

/** Icono y tono pastel para filas del hub de asistencias en curso. */
export function asistenciaActivaMenuStyle(item) {
    const tipo = String(item?.tipo || '').trim();
    if (tipo === 'Médica') return { icon: 'heart', menuTone: 'tone-asist-medica' };
    if (tipo === 'Dental') return { icon: 'toothbrush-sparkles', menuTone: 'tone-asist-dental' };
    if (tipo === 'Hogar') return { icon: 'house', menuTone: 'tone-asist-hogar' };
    if (tipo === 'Vial') return { icon: 'car', menuTone: 'tone-asist-vial' };
    if (tipo === 'Asistencia GEA') return { icon: 'cog', menuTone: 'tone-blue' };
    return { icon: 'cog', menuTone: 'tone-blue' };
}

export function buildDerivacionAsistenciaPayload(item, { cedula, nombre, telefono }) {
    const tipo = item.tipo || 'Asistencia';
    const id = item.id != null ? String(item.id) : 'sin-id';
    const origen =
        item.source === 'medico'
            ? 'Omniax medico-dental (3829)'
            : item.source === 'dental'
              ? 'Omniax medico-dental (3829)'
              : 'Asistencia en curso (2678)';

    return {
        identificacion: cedula,
        nombre: nombre || '',
        telefono,
        producto: `Asistencia en curso — ${tipo}`,
        notas: `id_asistencia=${id}; tipo_servicio=${tipo}; ${item.detalle}; api=${origen}`.slice(
            0,
            500,
        ),
    };
}
