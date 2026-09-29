import { CABINA_REGISTRO_HANDOFF_DONE } from './advisorHandoffCopy.js';

/**
 * Tras Notificar Cabina con bloqueo: pantalla “jugosa” antes de volver al menú.
 * @param {object} gate Resultado de runCabinaGateOrBlock
 * @param {string} returnNode Menú de retorno si gate no trae nextNodeId
 */
export function buildCabinaBlockedTransition(gate, returnNode) {
    const target = gate.nextNodeId || returnNode;
    const variant = gate.blockedVariant || 'cabina_vigente';
    return {
        messages: gate.messages?.length ? gate.messages : [],
        nextNodeId: CABINA_REGISTRO_HANDOFF_DONE,
        patchContext: {
            cabinaHandoff: {
                returnNode: target,
                variant,
            },
        },
    };
}
