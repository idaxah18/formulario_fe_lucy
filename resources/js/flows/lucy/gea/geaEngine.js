import {
    applyGeaQuickMeta,
    clearGeaMenu,
    getGeaDockCopy,
    getGeaEnterTask,
    getGeaMenuActions,
    runGeaEnter,
} from './geaRunner.js';

export {
    applyGeaQuickMeta,
    clearGeaMenu,
    getGeaDockCopy,
    getGeaMenuActions,
    getGeaEnterTask,
    runGeaEnter,
};

export function syncGeaFromNode(state, node) {
    if (!node?.gea) return;
    const gea = state.context.gea || {};
    if (node.gea.idServicio) gea.idServicio = String(node.gea.idServicio);
    if (node.gea.serviceLabel) gea.serviceLabel = node.gea.serviceLabel;
    if (node.gea.afterCrearNext) gea.afterCrearNext = node.gea.afterCrearNext;
    state.context.gea = gea;
}
