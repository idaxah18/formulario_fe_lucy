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
    if (node.gea.afterLopdpNext) gea.afterLopdpNext = node.gea.afterLopdpNext;
    if (node.gea.tipoServicio) gea.tipoServicio = node.gea.tipoServicio;
    if (node.gea.planAsistencia) gea.planAsistencia = node.gea.planAsistencia;
    if (node.gea.provOpcion) gea.provOpcion = node.gea.provOpcion;
    if (node.gea.afterProvValidaNext) gea.afterProvValidaNext = node.gea.afterProvValidaNext;
    state.context.gea = gea;
}
