import {
    clearAsegMenu,
    getAsegDockCopy,
    getAsegEnterTask,
    getAsegMenuActions,
    runAsegEnter,
} from './aseguradoraRunner.js';

export {
    clearAsegMenu,
    getAsegDockCopy,
    getAsegEnterTask,
    getAsegMenuActions,
    runAsegEnter,
};

export function applyAsegQuickMeta(state, action) {
    if (!action?.meta?.aseg) return;
    const aseg = state.context.aseg || {};
    Object.assign(aseg, action.meta.aseg);
    state.context.aseg = aseg;
}

export function syncAsegFromNode(state, node) {
    if (!node?.aseg) return;
    const aseg = state.context.aseg || {};
    const keys = [
        'afterOkNext',
        'afterCabinaNext',
        'afterProvinciaNext',
        'afterCiudadNext',
        'sinReturnNode',
    ];
    for (const k of keys) {
        if (node.aseg[k]) aseg[k] = node.aseg[k];
    }
    if (node.aseg.enter) {
        /* enter resolved at runtime */
    }
    state.context.aseg = aseg;
}
