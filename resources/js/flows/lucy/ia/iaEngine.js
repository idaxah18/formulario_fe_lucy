import {
    endIaSession,
    getIaEnterTask,
    isIaChatActive,
    runIaEnter,
    runIaUserMessage,
} from './iaRunner.js';

export { endIaSession, getIaEnterTask, isIaChatActive, runIaEnter, runIaUserMessage };

export function syncIaFromNode(state, node) {
    if (!node?.ia) return;
    const ia = state.context.ia || {};
    if (node.ia.profile) ia.profile = node.ia.profile;
    if (node.ia.enter === 'start_session' && !ia.active) {
        ia.pendingStart = true;
    }
    if (node.ia.afterTermsNext) ia.afterTermsNext = node.ia.afterTermsNext;
    state.context.ia = ia;
}
