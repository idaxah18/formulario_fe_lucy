import { asistenciaMenuLabel, parseAsistenciasResponse } from './omniaxAsistencias.js';
import { botFromOmniaxResponse } from './omniaxNoticias.js';
import { bot } from '../flowHelpers.js';

const PREFIX = {
    medico: 'omx_med',
    dental: 'omx_den',
};

const RETURN_MENU = {
    medico: 'menu_medico',
    dental: 'menu_dental',
};

/** @param {'medico'|'dental'} kind */
export function mapEnProcesoToGeaItems(list, kind) {
    const source = kind === 'dental' ? 'dental' : 'medico';
    const tipo = kind === 'dental' ? 'Dental' : 'Médica';
    return (list || []).map((row) => ({
        source,
        tipo,
        id: row?.id_asistencia != null ? Number(row.id_asistencia) : null,
        row,
        detalle: asistenciaMenuLabel(row),
    }));
}

/**
 * Tras servicio 1 (agendar): dental puede ir a pregunta seguimiento; luego hub o flujo largo.
 * @param {'medico'|'dental'} kind
 */
export function routeAfterEnProcesoFetch(omx, kind, apiRes) {
    const list = parseAsistenciasResponse(apiRes);
    omx.enProcesoList = list;
    omx.aplica_seguimiento_dental = Boolean(apiRes?.data?.aplica_seguimiento_dental);
    omx.reagendar = false;

    const messages = [];
    if (apiRes?.noticias) {
        messages.push(botFromOmniaxResponse(apiRes));
    }

    if (kind === 'dental' && omx.aplica_seguimiento_dental) {
        return {
            nextNodeId: `${PREFIX[kind]}_seguimiento_ask`,
            messages,
            patchContext: { omniax: omx },
        };
    }

    return buildEnProcesoHubTransition(omx, kind, { messages });
}

export function buildEnProcesoHubMenu(omx, kind) {
    const list = omx.enProcesoList || [];
    const p = PREFIX[kind];
    const returnMenu = RETURN_MENU[kind];

    const headline = 'Tienes estos servicios en proceso. ¿Qué necesitas?';
    const hint =
        'Elige una asistencia para ver el detalle o continúa para agendar una nueva cita.';

    const actions = list.map((row, index) => ({
        id: `enp_${row.id_asistencia ?? index}`,
        label: asistenciaMenuLabel(row),
        next: `${p}_en_proceso_pick_load`,
        meta: { omx: true, en_proceso_index: index },
        icon: kind === 'dental' ? 'toothbrush-sparkles' : 'heart',
        menuTone: kind === 'dental' ? 'tone-asist-dental' : 'tone-asist-medica',
    }));

    actions.push({
        id: 'nueva',
        label: 'Generar una nueva asistencia',
        next: `${p}_cabina_preface`,
        icon: 'calendar',
        menuTone: 'tone-blue',
        meta: { menuPinned: true },
    });

    actions.push({
        id: 'nueva_no',
        label: 'No deseo generar una nueva asistencia',
        next: returnMenu,
        icon: 'x-mark',
        menuTone: 'tone-blue',
        meta: { menuPinned: true },
    });

    return { headline, hint, actions, hubNodeId: `${p}_en_proceso_hub` };
}

/** Lista de citas a reagendar: scroll en el cuerpo y botonera fija abajo. */
export function buildReagendarPickActions(list, kind) {
    const p = PREFIX[kind];
    const returnMenu = RETURN_MENU[kind];
    const returnLabel = kind === 'dental' ? 'Volver a Dental' : 'Volver a Médico';
    const actions = list.map((a) => ({
        id: `reag_${a.id_asistencia}`,
        label: asistenciaMenuLabel(a),
        next: `${p}_dias_load`,
        icon: kind === 'dental' ? 'toothbrush-sparkles' : 'heart',
        menuTone: kind === 'dental' ? 'tone-asist-dental' : 'tone-asist-medica',
        meta: {
            omx: true,
            id_asistencia: a.id_asistencia,
            id_especialidad: a.id_especialidad,
            id_establecimiento: a.id_establecimiento,
            especialidad_nombre: a.nombre_especialidad || '',
            reagendar: true,
        },
    }));
    actions.push(
        {
            id: 'back_familia',
            label: returnLabel,
            next: returnMenu,
            icon: 'arrow-left',
            menuTone: 'tone-blue',
            meta: { menuPinned: true },
        },
        {
            id: 'home',
            label: 'Menú principal',
            next: 'menu_solucion_24_7',
            icon: 'home',
            menuTone: 'tone-blue',
            meta: { menuPinned: true },
        },
    );
    return actions;
}

/** Hub o salto directo a nueva cita si no hay listado. */
export function buildEnProcesoHubTransition(omx, kind, { messages = [] } = {}) {
    const list = omx.enProcesoList || [];

    if (!list.length) {
        return beginNuevaCitaAgendar(omx, kind, { messages });
    }

    const menu = buildEnProcesoHubMenu(omx, kind);

    return {
        nextNodeId: menu.hubNodeId,
        messages,
        patchContext: { omniax: omx },
        enProcesoMenu: menu,
    };
}

export function beginNuevaCitaAgendar(omx, kind, { messages = [] } = {}) {
    const p = PREFIX[kind];
    omx.enProcesoNuevaCita = true;
    return {
        nextNodeId: `${p}_cabina_preface`,
        messages: [
            ...messages,
            bot(
                kind === 'dental'
                    ? 'Continuemos con tu nueva cita dental.'
                    : 'Continuemos con tu nueva cita médica.',
            ),
        ],
        patchContext: { omniax: omx },
    };
}

/**
 * Prepara contexto GEA y navega al detalle compartido (asesor / atrás).
 * @param {object} ctx
 * @param {object} omx
 * @param {'medico'|'dental'} kind
 * @param {number} index
 */
export function buildEnProcesoPickTransition(ctx, omx, kind, index) {
    const list = omx.enProcesoList || [];
    const item = list[index];
    if (!item) {
        return {
            nextNodeId: `${PREFIX[kind]}_en_proceso_hub`,
            messages: [bot('No encontramos esa asistencia. Elige otra del listado.')],
            patchContext: { omniax: omx },
        };
    }

    const geaItems = mapEnProcesoToGeaItems(list, kind);
    if (!ctx.gea) ctx.gea = {};
    ctx.gea.asistenciasActivas = geaItems;
    ctx.gea.selectedAsistenciaIndex = index;
    ctx.gea.asistenciaDetalleFromNotif = true;
    ctx.gea.enProcesoHubNode = `${PREFIX[kind]}_en_proceso_hub`;
    ctx.gea.enProcesoReturnMenu = RETURN_MENU[kind];

    return {
        nextNodeId: 'asistencia_activa_pick_load',
        messages: [],
        patchContext: { gea: ctx.gea, omniax: omx },
    };
}
