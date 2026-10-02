import { CABINA_REGISTRO_HANDOFF_DONE } from './advisorHandoffCopy.js';
import { LUCY_FLOW_NODES } from './lucyFlowGraph.js';
import { canOmniaxScheduleBack, isOmniaxScheduleFlow, resolveOmniaxScheduleBackTarget } from './omniax/omniaxScheduleBack.js';

/**
 * Menú Solución 24/7 y el primer submenú de cada familia.
 * Al entrar se olvida el camino anterior: Atrás no debe devolver al blog, a la cita, etc.
 */
export const DOCK_MENU_ROOTS = new Set([
    'menu_solucion_24_7',
    'menu_dental',
    'menu_medico',
    'menu_hogar',
    'menu_vial',
    'otras_soluciones',
    'ver_mas_opciones',
]);

export function isDockMenuRoot(nodeId) {
    return DOCK_MENU_ROOTS.has(nodeId);
}

/**
 * Consultas que solo pintan una lista o un menú en el nodo actual.
 * Al volver atrás se vuelven a ejecutar. No incluyen altas ni notificaciones.
 */
const DISPLAY_STAY_ENTERS = new Set([
    'especialidades',
    'zonas_ciudades',
    'zonas_lista',
    'establecimientos_gps',
    'establecimientos_zona',
    'disponibilidad_franja',
    'disponibilidad_dias',
    'disponibilidad_horas',
    'provincias_menu',
    'ciudades_menu',
    'listado_cancel',
]);

/**
 * Consultas de solo lectura que reconstruyen un menú (a veces en el nodo siguiente).
 * Seguras para repetir en Atrás. Crear, reagendar, cabina y derivar no están aquí.
 */
const DISPLAY_REPLAY_ENTERS = new Set([
    ...DISPLAY_STAY_ENTERS,
    'en_proceso_hub',
    'en_proceso_hub_after_seguimiento',
    'en_proceso_reagendar',
    'auto_vehiculo',
    'auto_tipo_vehiculo_gate',
    'asistencia_activa_list',
]);

export function isDisplayStayEnter(task) {
    return Boolean(task) && DISPLAY_STAY_ENTERS.has(task);
}

export function isDisplayOnlyEnter(task) {
    return Boolean(task) && DISPLAY_REPLAY_ENTERS.has(task);
}

/** Evita que un replay sin datos dispare un alta o un desvío. */
export function canReplayDisplayEnter(state, task) {
    if (!isDisplayOnlyEnter(task)) return false;
    if (task === 'asistencia_activa_list') {
        return Boolean(state?.context?.gea?.asistenciasActivas?.length);
    }
    if (task === 'en_proceso_hub' || task === 'en_proceso_hub_after_seguimiento') {
        return Boolean(state?.context?.omniax?.enProcesoList?.length);
    }
    return true;
}

function nodePrimaryEnter(node) {
    return node?.omniax?.enter || node?.gea?.enter || node?.aseg?.enter || node?.com?.enter || null;
}

/** La pantalla de atrás es una lista: no saltarla. */
function nodeShowsDisplayOnEnter(nodeId) {
    const node = flowNode(nodeId);
    if (!node) return false;
    const primary = nodePrimaryEnter(node);
    if (primary) return isDisplayStayEnter(primary);
    const refresh = node.omniax?.refreshMenuEnter || node.gea?.refreshMenuEnter || null;
    return isDisplayOnlyEnter(refresh);
}

/** Nodos que solo reenvían (cabina, load) — al volver atrás se saltan. */
export const NAV_SKIP_ON_BACK = new Set([
    'post_auth_gate_load',
    'gea_hogar_segment_gate_load',
    'gea_vial_segment_gate_load',
    'asistencia_activa_pick_load',
    'omx_med_en_proceso_load',
    'omx_den_en_proceso_load',
    'omx_med_en_proceso_pick_load',
    'omx_den_en_proceso_pick_load',
    'omx_den_en_proceso_hub_load',
    'omx_den_seguimiento_crear_load',
    'asistencia_activa_list',
    'omx_med_elegibilidad_load',
    'omx_med_cabina',
    'omx_med_reag_cabina',
    'omx_med_start',
    'omx_den_elegibilidad_load',
    'omx_den_cabina',
    'omx_den_reag_cabina',
    'omx_den_start',
    'gea_auto_sin_afiliacion_asesor_load',
    'omx_med_sin_afiliacion_asesor_load',
    'omx_den_sin_afiliacion_asesor_load',
    'omx_med_plan_reag_load',
    'omx_den_plan_reag_load',
    'derivacion_asesor_load',
]);

function flowNode(nodeId) {
    return LUCY_FLOW_NODES[nodeId] || null;
}

/**
 * Pantallas que al entrar disparan API (gea/com/aseg/omx enter).
 * No deben mostrar «Atrás» ni quedar en el historial (evita re-ejecutar el proceso).
 */
export function isApiConsumerNode(nodeId) {
    const node = flowNode(nodeId);
    if (!node) return false;
    if (node.navAllowBack === true) return false;
    if (node.navAllowBack === false) return true;

    const enter =
        node.gea?.enter || node.com?.enter || node.aseg?.enter || node.omniax?.enter || node.omx?.enter || null;
    if (!enter) return false;
    if (isDisplayStayEnter(enter)) return false;

    if (node.skipSay) return true;
    if (String(enter).startsWith('auto_')) return true;
    if (['cabina_gate', 'lopdp', 'post_auth_asistencias_gate'].includes(enter)) return true;

    return false;
}

function shouldSkipNavTarget(nodeId) {
    if (!nodeId) return false;
    if (nodeShowsDisplayOnEnter(nodeId)) return false;
    if (NAV_SKIP_ON_BACK.has(nodeId)) return true;
    if (isApiConsumerNode(nodeId)) return true;
    if (nodeId.endsWith('_load')) return true;
    if (nodeId.startsWith('asist_done_')) return true;
    if (nodeId.startsWith('asist_cabina_')) return true;
    if (nodeId.startsWith('aseg_cab_')) return true;
    return false;
}

export function isCabinaHandoffTerminalNode(nodeId) {
    return nodeId === CABINA_REGISTRO_HANDOFF_DONE;
}

export function isGeaServiceTerminalNode(nodeId) {
    if (!nodeId) return false;
    if (nodeId === CABINA_REGISTRO_HANDOFF_DONE) return true;
    if (nodeId === 'gea_crear_exit') return true;
    if (nodeId === 'gea_auto_sin_afiliacion_done') return true;
    if (nodeId === 'omx_med_sin_afiliacion_done' || nodeId === 'omx_den_sin_afiliacion_done') return true;
    if (nodeId === 'otras_soluciones_gea_done') return true;
    return false;
}

export function isComHandoffTerminalNode(nodeId) {
    if (!nodeId) return false;
    if (nodeId === 'venta_contratar_ok') return true;
    if (nodeId === 'venta_derivacion_done') return true;
    if (nodeId === 'solicitar_factura_done') return true;
    if (nodeId === 'gea_auto_sin_afiliacion_done') return true;
    if (nodeId === 'omx_med_sin_afiliacion_done' || nodeId === 'omx_den_sin_afiliacion_done') return true;
    if (/^leaf_info_\w+_done$/.test(nodeId)) return true;
    return false;
}

export function isDerivacionTerminalNode(nodeId) {
    if (!nodeId) return false;
    if (nodeId === 'gea_auto_sin_afiliacion_done') return true;
    if (nodeId === 'omx_med_sin_afiliacion_done' || nodeId === 'omx_den_sin_afiliacion_done') return true;
    if (nodeId === 'venta_derivacion_done') return true;
    if (nodeId === 'asistencia_activa_asesor_done') return true;
    if (nodeId === 'reportar_problema_done') return true;
    if (/^leaf_info_\w+_done$/.test(nodeId)) return true;
    return false;
}

export function resolveBackNodeId(stack) {
    const copy = [...stack];
    let target = copy.pop();
    while (target && shouldSkipNavTarget(target) && copy.length) {
        target = copy.pop();
    }
    return { target, stack: copy };
}

export function resolveNavigateBackTarget(state) {
    const omxTarget = resolveOmniaxScheduleBackTarget(state);
    if (omxTarget) return omxTarget;

    const { target } = resolveBackNodeId(state?.navStack || []);
    return target || null;
}

/** No, Cancelar o Salir que ya hace el mismo salto que Atrás en una pantalla de un solo paso. */
const REDUNDANT_EXIT_LABEL = /^(no|cancelar|salir|salir del menú|salir del menu|volver al menú|volver al menu)$/i;

function backRepeatsSingleStepExit(state) {
    if (isOmniaxScheduleFlow(state?.nodeId)) return false;
    const target = resolveNavigateBackTarget(state);
    if (!target) return false;
    const actions = flowNode(state?.nodeId)?.actions || [];
    return actions.some((action) => {
        const label = String(action?.label || '').replace(/\*/g, '').trim();
        return REDUNDANT_EXIT_LABEL.test(label) && action.next === target;
    });
}

export function shouldShowBackButton(state) {
    const id = state?.nodeId;
    if (!id) return false;
    if (isDockMenuRoot(id)) return false;
    if (id === 'omx_med_sin_afiliacion' || id === 'omx_den_sin_afiliacion') return false;
    if (backRepeatsSingleStepExit(state)) return false;
    if (isApiConsumerNode(id)) return false;
    if (isDerivacionTerminalNode(id)) return false;
    if (id === 'asistencias_activas_hub') {
        return Array.isArray(state?.navStack) && state.navStack.length > 0;
    }
    if (id === 'asistencia_activa_detalle') return false;
    if (id === 'omx_med_en_proceso_hub' || id === 'omx_den_en_proceso_hub') return false;
    if (id === 'asistencia_activa_asesor_done') return false;
    if (id === 'otras_soluciones_gea_done') return false;
    if (id === 'gea_crear_exit') return false;
    if (id === CABINA_REGISTRO_HANDOFF_DONE) return false;
    if (id === 'venta_contratar_ok') return false;
    if (id === 'venta_derivacion_done') return false;
    if (id === 'auth_telefono') return false;
    if (canOmniaxScheduleBack(state)) return true;
    return Array.isArray(state?.navStack) && state.navStack.length > 0;
}
