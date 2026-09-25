import {
    clearComMenu,
    getComDockCopy,
    getComEnterTask,
    getComMenuActions,
    runComEnter,
} from './comercialRunner.js';

export {
    clearComMenu,
    getComDockCopy,
    getComEnterTask,
    getComMenuActions,
    runComEnter,
};

export function applyComQuickMeta(state, action) {
    if (!action?.meta?.com) return;
    const com = state.context.com || {};
    Object.assign(com, action.meta.com);
    state.context.com = com;
}

export function syncComFromNode(state, node) {
    if (!node?.com) return;
    const com = state.context.com || {};
    const keys = [
        'payProduct',
        'afterPayOk',
        'afterPayFail',
        'afterDerivacion',
        'producto',
        'afterVipInfo',
    ];
    for (const k of keys) {
        if (node.com[k]) com[k] = node.com[k];
    }
    state.context.com = com;
}
