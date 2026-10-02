import {
    applyOmniaxQuickMeta,
    clearOmniaxMenu,
    getOmniaxDockCopy,
    getOmniaxEnterTask as getMedicoEnterTask,
    getOmniaxMenuActions,
    runOmniaxMedicoEnter,
} from './omniaxMedicoRunner.js';
import {
    getOmniaxDentalEnterTask,
    runOmniaxDentalEnter,
} from './omniaxDentalRunner.js';

export {
    applyOmniaxQuickMeta,
    clearOmniaxMenu,
    getOmniaxDockCopy,
    getOmniaxMenuActions,
};

function flowKind(state, node) {
    const id = state.nodeId || node?.id || '';
    if (String(id).startsWith('omx_den_')) return 'dental';
    if (String(id).startsWith('omx_med_')) return 'medico';
    const fromNode = node?.omniax?.kind;
    if (fromNode) return fromNode;
    const fromCtx = state.context?.omniax?.kind;
    if (fromCtx) return fromCtx;
    return 'medico';
}

const OMX_MENU_RESET_NODES = new Set(['menu_medico', 'menu_dental', 'menu_solucion_24_7']);

export function syncOmniaxKind(state, node) {
    const ctx = state.context;
    if (!ctx.omniax) ctx.omniax = {};
    const kind = flowKind(state, node);
    ctx.omniax.kind = kind;
    if (OMX_MENU_RESET_NODES.has(state.nodeId)) {
        ctx.omniax.reagendar = false;
    } else if (node?.omniax?.reagendar != null) {
        ctx.omniax.reagendar = Boolean(node.omniax.reagendar);
    }
    if (node?.omniax?.afterCabinaNext) {
        ctx.omniax.afterCabinaNext = node.omniax.afterCabinaNext;
    }
    if (node?.omniax?.afterPlanNext) {
        ctx.omniax.afterPlanNext = node.omniax.afterPlanNext;
    }
    if (node?.omniax?.tipoServicio) {
        ctx.omniax.tipoServicio = node.omniax.tipoServicio;
    }
}

export function getOmniaxEnterTask(state, node) {
    const kind = flowKind(state, node);
    if (kind === 'dental') return getOmniaxDentalEnterTask(state, node);
    return getMedicoEnterTask(state, node);
}

export async function runOmniaxEnter(task, state) {
    const kind = state.context?.omniax?.kind || flowKind(state, null);
    if (kind === 'dental') return runOmniaxDentalEnter(task, state);
    return runOmniaxMedicoEnter(task, state);
}
