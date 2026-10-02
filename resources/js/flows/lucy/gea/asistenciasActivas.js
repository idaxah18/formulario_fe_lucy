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
    if (/\bvial\b|grúa|grua|remolque|llanta|gasolina|corriente|cerrajer[ií]a vial/.test(desc)) {
        return 'Vial';
    }
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
        const nombre = String(row.solicitante || row.nombre_persona || row.nombre_paciente || '').trim();
        const servicio = String(
            row.servicio_descripcion ?? row.servicio ?? row.descripcion ?? '',
        ).trim();
        const detalle =
            source === 'medico' || source === 'dental'
                ? asistenciaMenuLabel(row)
                : nombre
                  ? [nombre, servicio].filter(Boolean).join(' · ')
                  : servicio || asistenciaMenuLabel({ ...row, id_asistencia: id });

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

/**
 * Tras login / campana de notificaciones: solo médico y dental.
 * Hogar/vial (API GEA 2678) se listan al entrar al menú del segmento.
 */
export function filterAsistenciasForPostAuth(merged) {
    return (merged || []).filter((item) => {
        if (item?.source === 'gea') return false;
        const family = resolveAsistenciaFamilyId(item);
        return family !== 'hogar' && family !== 'vial';
    });
}

/** Solo asistencias GEA del segmento hogar o vial. */
export function filterAsistenciasBySegment(merged, segment) {
    const family = segment === 'hogar' ? 'hogar' : segment === 'vial' ? 'vial' : null;
    if (!family) return [];
    return (merged || []).filter(
        (item) => item.source === 'gea' && resolveAsistenciaFamilyId(item) === family,
    );
}

export { CHAT_MENU_PAGE_SIZE as ASISTENCIAS_ACTIVAS_PAGE_SIZE } from '@/lib/menuListPagination.js';

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

/** Familias del panel de notificaciones (Fase 1). Aseguradora y GEA sin tipo claro → otras. */
export const ASISTENCIA_FAMILY_ORDER = ['medico', 'dental', 'vial', 'hogar', 'otras'];

export const ASISTENCIA_FAMILY_META = {
    medico: {
        label: 'Médico',
        hint: 'Soluciones médicas',
        icon: 'heart',
        menuTone: 'tone-asist-medica',
    },
    dental: {
        label: 'Dental',
        hint: 'Soluciones dentales',
        icon: 'toothbrush-sparkles',
        menuTone: 'tone-asist-dental',
    },
    vial: {
        label: 'Vial',
        hint: 'Soluciones viales',
        icon: 'car',
        menuTone: 'tone-asist-vial',
    },
    hogar: {
        label: 'Hogar',
        hint: 'Solución de Hogar',
        icon: 'house',
        menuTone: 'tone-asist-hogar',
    },
    otras: {
        label: 'Otras soluciones',
        hint: 'Aseguradora y otros servicios',
        icon: 'link',
        menuTone: 'tone-green',
    },
};

/** Familia para hub / filtros (re-clasifica GEA si el listado vino como «Asistencia GEA»). */
export function resolveAsistenciaFamilyId(item) {
    let tipo = String(item?.tipo || '').trim();
    if (item?.source === 'gea' && item?.row) {
        const refined = resolveTipoAsistencia(item.row, 'gea');
        if (refined !== 'Asistencia GEA' || tipo === 'Asistencia GEA' || !tipo) {
            tipo = refined;
        }
    }
    if (tipo === 'Médica') return 'medico';
    if (tipo === 'Dental') return 'dental';
    if (tipo === 'Vial') return 'vial';
    if (tipo === 'Hogar') return 'hogar';
    return 'otras';
}

/** @param {ReturnType<typeof mergeAsistenciasActivas>} items */
/** Índice en el listado plano usado por `asistencia_activa_pick`. */
export function indexOfAsistenciaActiva(items, item) {
    if (!item || !Array.isArray(items) || !items.length) return -1;
    const direct = items.indexOf(item);
    if (direct >= 0) return direct;
    return items.findIndex(
        (row) =>
            row.source === item.source
            && row.id === item.id
            && row.detalle === item.detalle,
    );
}

export function groupAsistenciasByFamily(items) {
    const buckets = Object.fromEntries(ASISTENCIA_FAMILY_ORDER.map((id) => [id, []]));
    for (const item of items || []) {
        const familyId = resolveAsistenciaFamilyId(item);
        buckets[familyId].push(item);
    }
    return ASISTENCIA_FAMILY_ORDER.map((id) => {
        const familyItems = sortAsistenciasActivasDesc(buckets[id]);
        const meta = ASISTENCIA_FAMILY_META[id];
        const preview = familyItems[0]?.detalle || meta.hint;
        return {
            id,
            ...meta,
            items: familyItems,
            count: familyItems.length,
            preview,
        };
    }).filter((g) => g.count > 0);
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
