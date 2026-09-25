/**
 * Puente webview Jelou / WhatsApp (Fase 4).
 * El skill en Jelou debe escuchar el mismo payload en postMessage o query al cerrar.
 */
const CLOSE_TYPES = ['jelou:webview:close', 'JELou_WEBVIEW_CLOSE', 'closeWebView'];

export function isEmbeddedWebview() {
    try {
        if (window.parent && window.parent !== window) return true;
    } catch {
        return true;
    }
    const q = new URLSearchParams(window.location.search);
    return q.has('telefono') || q.get('embedded') === '1';
}

export function getWebviewContext() {
    const q = new URLSearchParams(window.location.search);
    return {
        telefono: q.get('telefono') || '',
        flow: q.get('flow') || '',
        userId: q.get('userId') || q.get('user_id') || '',
    };
}

/**
 * @param {{ reason?: string, nodeId?: string, summary?: string }} payload
 */
export function closeWebview(payload = {}) {
    const body = {
        type: CLOSE_TYPES[0],
        source: 'lucy-ecuador-webview',
        at: new Date().toISOString(),
        telefono: getWebviewContext().telefono,
        ...payload,
    };

    for (const type of CLOSE_TYPES) {
        try {
            window.parent?.postMessage?.({ ...body, type }, '*');
        } catch {
            /* ignore */
        }
    }

    try {
        window.ReactNativeWebView?.postMessage?.(JSON.stringify(body));
    } catch {
        /* ignore */
    }

    if (typeof window.webkit?.messageHandlers?.jelou?.postMessage === 'function') {
        try {
            window.webkit.messageHandlers.jelou.postMessage(body);
        } catch {
            /* ignore */
        }
    }

    return body;
}
