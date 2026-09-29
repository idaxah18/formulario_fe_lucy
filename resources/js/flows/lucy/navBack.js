import { CABINA_REGISTRO_HANDOFF_DONE } from './advisorHandoffCopy.js';
import { LUCY_FLOW_NODES } from './lucyFlowGraph.js';
import { canOmniaxScheduleBack, resolveOmniaxScheduleBackTarget } from './omniax/omniaxScheduleBack.js';

/** Nodos que solo reenvían (cabina, load) — al volver atrás se saltan. */
export const NAV_SKIP_ON_BACK = new Set([
    'post_auth_gate_load',
    'asistencia_activa_pick_load',
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
        node.gea?.enter || node.com?.enter || node.aseg?.enter || node.omx?.enter || null;
    if (!enter) return false;

    if (node.skipSay) return true;
    if (String(enter).startsWith('auto_')) return true;
    if (['cabina_gate', 'lopdp', 'post_auth_asistencias_gate'].includes(enter)) return true;

    return false;
}

function shouldSkipNavTarget(nodeId) {
    if (!nodeId) return false;
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
    if (nodeId === 'otras_soluciones_gea_done') return true;
    return false;
}

export function isComHandoffTerminalNode(nodeId) {
    if (!nodeId) return false;
    if (nodeId === 'venta_contratar_ok') return true;
    if (nodeId === 'venta_derivacion_done') return true;
    if (nodeId === 'solicitar_factura_done') return true;
    if (nodeId === 'gea_auto_sin_afiliacion_done') return true;
    if (/^leaf_info_\w+_done$/.test(nodeId)) return true;
    return false;
}

export function isDerivacionTerminalNode(nodeId) {
    if (!nodeId) return false;
    if (nodeId === 'gea_auto_sin_afiliacion_done') return true;
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

export function shouldShowBackButton(state) {
    const id = state?.nodeId;
    if (!id) return false;
    if (isApiConsumerNode(id)) return false;
    if (isDerivacionTerminalNode(id)) return false;
    if (id === 'asistencias_activas_hub') return false;
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
