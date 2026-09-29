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
        intent: q.get('intent') || '',
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

/**
 * Abre URL fuera de la webview (navegador del sistema cuando el contenedor lo soporta).
 */
export function openExternalUrl(url) {
    const href = String(url || '').trim();
    if (!href) return false;

    const payload = {
        type: 'jelou:webview:openUrl',
        source: 'lucy-ecuador-webview',
        url: href,
        at: new Date().toISOString(),
        telefono: getWebviewContext().telefono,
    };

    try {
        window.parent?.postMessage?.(payload, '*');
    } catch {
        /* ignore */
    }

    try {
        window.ReactNativeWebView?.postMessage?.(JSON.stringify(payload));
    } catch {
        /* ignore */
    }

    if (typeof window.webkit?.messageHandlers?.jelou?.postMessage === 'function') {
        try {
            window.webkit.messageHandlers.jelou.postMessage(payload);
        } catch {
            /* ignore */
        }
    }

    const opened = window.open(href, '_blank', 'noopener,noreferrer');
    if (!opened) {
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }
    return true;
}
