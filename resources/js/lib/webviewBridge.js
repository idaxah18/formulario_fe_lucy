/**
 * Puente webview Jelou / WhatsApp (Fase 4).
 * Derivación: POST callback (executionId) para desbloquear el skill y CONNECT.
 */
import { postJelouWebviewCallback } from '@/api/comercialApi.js';

const CLOSE_TYPES = ['jelou:webview:close', 'JELou_WEBVIEW_CLOSE', 'closeWebView'];
const CALLBACK_SENT_PREFIX = 'lucy_wv_callback_';
/** Número de Lucy Ecuador (canal WhatsApp producción). */
const LUCY_WHATSAPP_E164 = '593958637937';

export function isEmbeddedWebview() {
    try {
        if (window.parent && window.parent !== window) return true;
    } catch {
        return true;
    }
    const q = new URLSearchParams(window.location.search);
    return q.has('telefono') || q.get('embedded') === '1';
}

export function getWebviewExecutionId() {
    const q = new URLSearchParams(window.location.search);
    return (
        q.get('executionId')
        || q.get('execution_id')
        || q.get('executionID')
        || ''
    );
}

export function getWebviewContext() {
    const q = new URLSearchParams(window.location.search);
    return {
        telefono: q.get('telefono') || '',
        flow: q.get('flow') || '',
        intent: q.get('intent') || '',
        userId: q.get('userId') || q.get('user_id') || '',
        executionId: getWebviewExecutionId(),
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

/** Cierra el in-app browser y vuelve al chat de Lucy (doc Jelou: wa.me). */
export function returnToWhatsApp(payload = {}) {
    closeWebview(payload);
    if (typeof window === 'undefined') return;
    window.location.replace(`https://wa.me/${LUCY_WHATSAPP_E164}`);
}

function callbackAlreadySent(executionId) {
    try {
        return sessionStorage.getItem(CALLBACK_SENT_PREFIX + executionId) === '1';
    } catch {
        return false;
    }
}

function markCallbackSent(executionId) {
    try {
        sessionStorage.setItem(CALLBACK_SENT_PREFIX + executionId, '1');
    } catch {
        /* ignore */
    }
}

/**
 * @param {{ success?: boolean, data?: Record<string, string>, close?: boolean, reason?: string, nodeId?: string }} opts
 */
export async function sendJelouWebviewCallback(opts = {}) {
    const executionId = getWebviewExecutionId();
    if (!executionId) {
        return { ok: true, skipped: true, reason: 'no_execution_id' };
    }
    if (callbackAlreadySent(executionId)) {
        if (opts.close !== false) {
            returnToWhatsApp({
                reason: opts.reason || 'already_sent',
                nodeId: opts.nodeId,
            });
        }
        return { ok: true, skipped: true, reason: 'already_sent' };
    }

    const ctx = getWebviewContext();
    const data = {
        motivo: '',
        producto: '',
        notas: '',
        cedula: '',
        nombre: '',
        telefono: ctx.telefono || '',
        nodo: opts.nodeId || '',
        ...(opts.data || {}),
    };
    if (!data.telefono) data.telefono = ctx.telefono || '';
    if (!data.nodo) data.nodo = opts.nodeId || '';

    try {
        await postJelouWebviewCallback({
            executionId,
            success: opts.success !== false,
            data,
        });
        markCallbackSent(executionId);
        if (opts.close !== false) {
            returnToWhatsApp({
                reason: opts.reason || data.motivo || 'callback',
                nodeId: data.nodo,
                data,
            });
        }
        return { ok: true, skipped: false };
    } catch (error) {
        console.warn('[lucy] Jelou webview callback falló', error);
        if (opts.close !== false) {
            returnToWhatsApp({
                reason: opts.reason || 'callback_error',
                nodeId: data.nodo,
            });
        }
        return { ok: false, skipped: false, error };
    }
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

/**
 * Solo al terminar derivación. Si no hay executionId (navegador local) no hace nada.
 * Tras el POST vuelve a WhatsApp para que el skill siga por la rama exit → CONNECT.
 *
 * @param {{ producto?: string, notas?: string, cedula?: string, nombre?: string, telefono?: string, nodo?: string, tipo?: string }} details
 */
export async function notifyJelouDerivacionCallback(details = {}) {
    return sendJelouWebviewCallback({
        success: true,
        reason: 'derivacion',
        nodeId: details.nodo,
        data: {
            motivo: 'derivacion',
            tipo: details.tipo || 'operacion',
            producto: details.producto || 'derivacion_asesor',
            notas: details.notas || '',
            cedula: details.cedula || '',
            nombre: details.nombre || '',
            telefono: details.telefono || '',
            nodo: details.nodo || '',
        },
    });
}

/** Botón header WhatsApp: desbloquea el nodo (sin CONNECT) y vuelve al chat. */
export async function notifyJelouUserCloseCallback() {
    return sendJelouWebviewCallback({
        success: true,
        reason: 'header_button',
        data: { motivo: 'user_close' },
    });
}
