import { createPayCheckoutLink, crearDerivacionLead, fetchVentaLead, marcarVentaContrato } from '@/api/comercialApi.js';
import { requireLucyTelefono } from '@/lib/lucyTelefono.js';
import { notifyJelouDerivacionCallback } from '@/lib/webviewBridge.js';
import { isAdvisorHandoffDoneNode } from '../advisorHandoffCopy.js';
import { bot, LUCY_HOME_NODE, standardExitActions } from '../flowHelpers.js';

function ensureCom(ctx) {
    if (!ctx.com) ctx.com = {};
    return ctx.com;
}

function splitNombre(full) {
    const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { names: 'Cliente', surname: '' };
    if (parts.length === 1) return { names: parts[0], surname: '' };
    return { names: parts[0], surname: parts.slice(1).join(' ') };
}

export function clearComMenu(ctx) {
    if (!ctx?.com) return;
    delete ctx.com.menuActions;
    delete ctx.com.dockHeadline;
    delete ctx.com.dockHint;
}

export function getComMenuActions(state) {
    return state.context?.com?.menuActions || null;
}

export function getComDockCopy(state) {
    const com = state.context?.com;
    if (!com?.dockHeadline) return null;
    return { headline: com.dockHeadline, hint: com.dockHint || '' };
}

export function getComEnterTask(state, node) {
    return node?.com?.enter || null;
}

export async function runComEnter(task, state) {
    const ctx = state.context;
    const com = ensureCom(ctx);
    const cedula = ctx.cedula;
    const nombre = ctx.nombre;
    const telefono = requireLucyTelefono(ctx);

    clearComMenu(ctx);

    switch (task) {
        case 'pay_checkout': {
            const product = com.payProduct || 'viaja';
            if (!cedula || !nombre) throw new Error('Completa cédula y nombre al inicio.');
            const { names, surname } = splitNombre(nombre);
            const email = com.email_edoctor || com.email || '';

            try {
                const res = await createPayCheckoutLink({
                    product,
                    legal_id: cedula,
                    names,
                    surname,
                    email,
                });
                const plan = res.plan || {};
                const link = res.link || {};
                const shortUrl = link.short_url || link.url || link.payment_url;
                if (!shortUrl) {
                    return {
                        messages: [
                            bot(
                                'No pudimos generar el enlace de pago. Intenta de nuevo más tarde.',
                            ),
                        ],
                        nextNodeId: com.afterPayFail || LUCY_HOME_NODE,
                        patchContext: { com },
                    };
                }
                const price = plan.price_with_tax ?? plan.price_base ?? '';
                const planName = plan.name || product;
                return {
                    messages: [
                        bot(
                            `Has recibido una solicitud de pago.\n\n*Plan: ${planName}*\n*Monto: $${price} mensual incluido IVA*\n\nPaga en el siguiente enlace:\n${shortUrl}`,
                        ),
                        bot(
                            'Cuando completes el pago en la pasarela, vuelve aquí para continuar la activación.',
                        ),
                    ],
                    nextNodeId: com.afterPayOk || `${product}_ok`,
                    patchContext: { com },
                };
            } catch (e) {
                const simulated = e.response?.data?.simulated;
                if (simulated || e.response?.status === 503) {
                    return {
                        messages: [
                            bot('No pudimos generar el enlace de pago. Intenta de nuevo más tarde.'),
                        ],
                        nextNodeId: com.afterPayFail || LUCY_HOME_NODE,
                        patchContext: { com },
                    };
                }
                throw e;
            }
        }

        case 'venta_contratar': {
            if (!cedula) throw new Error('Ingresa tu cédula al inicio.');
            const res = await fetchVentaLead(cedula);
            if (!res.interested || !res.lead) {
                com.afterDerivacion = 'venta_derivacion_done';
                return {
                    messages: [
                        bot(
                            'No encontramos una oferta de contratación activa para tu cédula. Un asesor puede ayudarte.',
                        ),
                    ],
                    nextNodeId: 'derivacion_asesor_load',
                    patchContext: { com },
                };
            }
            const lead = res.lead;
            if (lead.contrato_asistencia === 'SI') {
                return {
                    messages: [bot('Ya tienes una asistencia contratada con este proceso. ¡Gracias!')],
                    nextNodeId: 'menu_solucion_24_7',
                    patchContext: { com },
                };
            }
            const rowId = lead._id || lead.id;
            if (!rowId) {
                throw new Error('Lead sin identificador Datum.');
            }
            await marcarVentaContrato(String(rowId), telefono);
            return {
                messages: [],
                nextNodeId: 'venta_contratar_ok',
                patchContext: { com },
            };
        }

        case 'derivacion_asesor': {
            if (!cedula) throw new Error('Ingresa tu cédula al inicio.');
            const producto = com.producto || 'general';
            const derivacion = await crearDerivacionLead({
                identificacion: cedula,
                nombre: nombre || '',
                telefono,
                producto,
                notas: com.notas || '',
            });
            const simulated = Boolean(derivacion?.simulated);
            const nextNodeId = com.afterDerivacion || LUCY_HOME_NODE;
            if (simulated) {
                com.advisorHandoffSimulated = true;
            }
            const messages = isAdvisorHandoffDoneNode(nextNodeId)
                ? []
                : [bot('Muy bien, enseguida te contactaré con un asesor comercial.')];
            await notifyJelouDerivacionCallback({
                tipo: com.tipo || 'operacion',
                producto,
                notas: com.notas || '',
                cedula,
                nombre: nombre || '',
                telefono,
                nodo: nextNodeId,
            });
            return {
                messages,
                nextNodeId,
                patchContext: { com },
            };
        }

        case 'vip_info': {
            return {
                messages: [
                    bot(
                        'Para activar *GEA Experience* ingresa tu código exclusivo en el siguiente paso.',
                    ),
                    bot(
                        'El registro completo con empresa y cargo se hace en este chat (equivalente al formulario WhatsApp).',
                    ),
                ],
                nextNodeId: com.afterVipInfo || 'vip_codigo',
                patchContext: { com },
            };
        }

        case 'vip_codigo_stub': {
            const code = com.codigo_vip;
            if (!code) throw new Error('Ingresa el código VIP.');
            return {
                messages: [
                    bot(
                        `Código **${code}** recibido. La verificación Omniax (tool Verifica Código VIP) se activará cuando el equipo configure el proxy en servidor.`,
                    ),
                    bot(
                        'Por ahora, completa el registro en WhatsApp con Lucy si el código fue rechazado aquí.',
                    ),
                ],
                nextNodeId: 'vip_registro_empresa',
                patchContext: { com },
            };
        }

        default:
            throw new Error(`Tarea comercial desconocida: ${task}`);
    }
}

export function buildPayConfirmNode(id, jelouRef, returnNode = LUCY_HOME_NODE) {
    return {
        [id]: {
            say: ['¿Necesitas algo más?'],
            actions: standardExitActions(returnNode),
            jelou: jelouRef,
        },
    };
}
