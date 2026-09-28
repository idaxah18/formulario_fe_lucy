import { canOmniaxScheduleBack, resolveOmniaxScheduleBackTarget } from './omniax/omniaxScheduleBack.js';

/** Nodos que solo reenvían (cabina, load) — al volver atrás se saltan. */
export const NAV_SKIP_ON_BACK = new Set([
    'post_auth_gate_load',
    'asistencia_activa_pick_load',
    'asistencia_activa_list',
    'omx_med_cabina',
    'omx_med_reag_cabina',
    'omx_med_start',
    'omx_den_cabina',
    'omx_den_reag_cabina',
    'omx_den_start',
]);

function shouldSkipNavTarget(nodeId) {
    if (!nodeId) return false;
    if (NAV_SKIP_ON_BACK.has(nodeId)) return true;
    if (nodeId.endsWith('_load')) return true;
    if (nodeId.startsWith('asist_done_')) return true;
    return false;
}

export function isGeaServiceTerminalNode(nodeId) {
    if (!nodeId) return false;
    if (nodeId === 'gea_crear_exit') return true;
    if (nodeId === 'otras_soluciones_gea_done') return true;
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
    if (id === 'asistencias_activas_hub') return false;
    if (id === 'asistencia_activa_asesor_done') return false;
    if (id === 'otras_soluciones_gea_done') return false;
    if (id === 'gea_crear_exit') return false;
    if (id === 'auth_telefono') return false;
    if (canOmniaxScheduleBack(state)) return true;
    return Array.isArray(state?.navStack) && state.navStack.length > 0;
}
