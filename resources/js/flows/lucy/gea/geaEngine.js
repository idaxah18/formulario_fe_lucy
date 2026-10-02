import {
    applyGeaQuickMeta,
    clearGeaMenu,
    getGeaDockCopy,
    getGeaEnterTask,
    getGeaMenuActions,
    runGeaEnter,
} from './geaRunner.js';
import { resolveIdServicioCrearGea } from './geaServiceIds.js';

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
    if (node.gea.serviceLabel) gea.serviceLabel = node.gea.serviceLabel;
    if (node.gea.idServicio || node.gea.serviceLabel) {
        const crearId = resolveIdServicioCrearGea(
            node.gea.serviceLabel || gea.serviceLabel,
            node.gea.idServicio || gea.idServicio,
        );
        if (crearId) gea.idServicio = crearId;
    }
    if (node.gea.afterCrearNext) gea.afterCrearNext = node.gea.afterCrearNext;
    if (node.gea.afterLopdpNext) gea.afterLopdpNext = node.gea.afterLopdpNext;
    if (node.gea.segment) gea.segment = node.gea.segment;
    if (node.gea.afterSegmentNext) gea.afterSegmentNext = node.gea.afterSegmentNext;
    if (node.gea.tipoServicio) gea.tipoServicio = node.gea.tipoServicio;
    if (node.gea.planAsistencia) gea.planAsistencia = node.gea.planAsistencia;
    if (node.gea.exitReturnMenu) gea.exitReturnMenu = node.gea.exitReturnMenu;
    if (node.gea.provOpcion) gea.provOpcion = node.gea.provOpcion;
    if (node.gea.afterProvValidaNext) gea.afterProvValidaNext = node.gea.afterProvValidaNext;
    if (node.gea.afterAutoNext) gea.afterAutoNext = node.gea.afterAutoNext;
    if (node.gea.afterVehiculoPickNext) gea.afterVehiculoPickNext = node.gea.afterVehiculoPickNext;
    if (node.gea.afterTipoVehiculoMenuNext) {
        gea.afterTipoVehiculoMenuNext = node.gea.afterTipoVehiculoMenuNext;
    }
    if (node.gea.vehMarcaNodeId) gea.vehMarcaNodeId = node.gea.vehMarcaNodeId;
    if (node.gea.vehModeloNodeId) gea.vehModeloNodeId = node.gea.vehModeloNodeId;
    if (node.gea.vehAnioNodeId) gea.vehAnioNodeId = node.gea.vehAnioNodeId;
    if (node.gea.vehDatosGateId) gea.vehDatosGateId = node.gea.vehDatosGateId;
    if (node.gea.afterCoberturaSinAplica) {
        gea.afterCoberturaSinAplica = node.gea.afterCoberturaSinAplica;
    }
    if (node.gea.chainBase) gea.chainBase = node.gea.chainBase;
    if (node.gea.automatico) {
        gea.automatico = { ...(gea.automatico || {}), ...node.gea.automatico };
    }
    if (node.gea.enter?.startsWith('auto_')) {
        gea.jelouRef = node.gea.jelouRef || gea.jelouRef;
    }
    state.context.gea = gea;
}
