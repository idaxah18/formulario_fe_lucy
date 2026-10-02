/** Máximo de opciones seleccionables por página en menús del dock (móvil). */
export const CHAT_MENU_PAGE_SIZE = 4;

/**
 * @param {Array<{ meta?: { menuPinned?: boolean }; type?: string }>} actions
 * @param {{ pinLocation?: boolean }} [opts]
 */
export function splitMenuActions(actions, opts = {}) {
    const pinLocation = opts.pinLocation !== false;
    const items = [];
    const pinned = [];
    for (const action of actions || []) {
        const isPinned =
            action?.meta?.menuPinned || (pinLocation && action?.type === 'location');
        if (isPinned) {
            pinned.push(action);
        } else {
            items.push(action);
        }
    }
    return { items, pinned };
}
