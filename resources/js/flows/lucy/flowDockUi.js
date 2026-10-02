import { isAdvisorHandoffDoneNode, isCabinaPrefaceNode } from './advisorHandoffCopy.js';

/** Pantallas donde no debe activarse el overlay de menú largo (evita ocultar botones / scroll). */
export function shouldDisableMenuOverlay(nodeId) {
    if (!nodeId) return false;
    if (isAdvisorHandoffDoneNode(nodeId)) return true;
    if (isCabinaPrefaceNode(nodeId)) return true;
    if (nodeId.startsWith('asist_') || nodeId.startsWith('auto_')) return true;
    if (nodeId === 'omx_med_who' || nodeId === 'omx_den_who') return true;
    if (nodeId === 'omx_med_donde' || nodeId === 'omx_den_donde') return true;
    if (nodeId === 'gea_crear_exit') return true;
    return false;
}
