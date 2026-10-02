import { bootstrapIa, registerIaRouterTerms, sendIaMessage } from '@/api/lucyIaApi.js';
import { resolveLucyTelefono } from '@/lib/lucyTelefono.js';
import { bot } from '../flowHelpers.js';

function ensureIa(ctx) {
    if (!ctx.ia) ctx.ia = { messages: [] };
    return ctx.ia;
}

export function isIaChatActive(state) {
    const node = state?.nodeId;
    return Boolean(state?.context?.ia?.active && node);
}

export function getIaEnterTask(state, node) {
    return node?.ia?.enter || null;
}

export async function runIaEnter(task, state) {
    const ctx = state.context;
    const ia = ensureIa(ctx);

    switch (task) {
        case 'start_session': {
            const profile = ia.profile || 'router';
            const res = await bootstrapIa(profile);
            ia.active = true;
            ia.profile = profile;
            ia.llm = Boolean(res.llm);
            ia.messages = [];
            const welcome = res.welcome || 'Hola, soy Lucy. ¿En qué te ayudo?';
            ia.messages.push({ role: 'assistant', content: welcome });
            return {
                messages: [bot(welcome)],
                stayOnNode: true,
                patchContext: { ia },
            };
        }

        case 'register_router_terms': {
            const cedula = ctx.cedula;
            const nombre = ctx.nombre;
            if (!cedula || !nombre) {
                return {
                    messages: [bot('Completa cédula y nombre antes del registro IA Router.')],
                    nextNodeId: 'auth_cedula',
                    patchContext: { ia },
                };
            }
            await registerIaRouterTerms({
                identificacion: cedula,
                nombre,
                usuario: resolveLucyTelefono(ctx) || '',
            });
            return {
                messages: [bot('✅ Términos del IA Router registrados.')],
                nextNodeId: ia.afterTermsNext || 'ia_router_after_reg',
                patchContext: { ia },
            };
        }

        default:
            throw new Error(`Tarea IA desconocida: ${task}`);
    }
}

export async function runIaUserMessage(state, text) {
    const ctx = state.context;
    const ia = ensureIa(ctx);
    if (!ia.active || !ia.profile) {
        throw new Error('Sesión IA no iniciada.');
    }

    const trimmed = String(text || '').trim();
    if (!trimmed) throw new Error('Escribe un mensaje.');

    ia.messages.push({ role: 'user', content: trimmed });

    const res = await sendIaMessage({
        profile: ia.profile,
        message: trimmed,
        history: ia.messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
        context: {
            cedula: ctx.cedula,
            nombre: ctx.nombre,
        },
    });

    const reply = res.text || 'No pude generar respuesta.';
    ia.messages.push({ role: 'assistant', content: reply });
    ia.lastMode = res.mode;

    return {
        messages: [bot(reply)],
        stayOnNode: true,
        patchContext: { ia },
    };
}

export function endIaSession(ctx) {
    if (!ctx?.ia) return;
    ctx.ia.active = false;
}
