import { LUCY_FLOW_NODES } from './lucyFlowGraph.js';
import { getComDockCopy } from './comercial/comercialEngine.js';
import { getAsegDockCopy } from './aseguradora/aseguradoraEngine.js';
import { getGeaDockCopy } from './gea/geaEngine.js';
import { getOmniaxDockCopy } from './omniax/omniaxMedicoRunner.js';

function getNode(nodeId) {
    return LUCY_FLOW_NODES[nodeId] || null;
}

export function getCurrentNodeSaySet(nodeId) {
    const node = getNode(nodeId);
    if (!node?.say) return new Set();
    return new Set(node.say.map((line) => line.replace(/\*\*/g, '').trim()));
}

/** Texto del paso actual (solo en el panel inferior, no en el historial) */
export function getDockPrompt(state) {
    const node = getNode(state.nodeId);
    const omxDock = getOmniaxDockCopy(state);
    if (node?.useOmniaxMenu && omxDock?.headline) {
        return { headline: omxDock.headline, hint: omxDock.hint || '' };
    }
    const geaDock = getGeaDockCopy(state);
    if (node?.useGeaMenu && geaDock?.headline) {
        return { headline: geaDock.headline, hint: geaDock.hint || '' };
    }
    const asegDock = getAsegDockCopy(state);
    if (node?.useAsegMenu && asegDock?.headline) {
        return { headline: asegDock.headline, hint: asegDock.hint || '' };
    }
    const comDock = getComDockCopy(state);
    if (node?.useComMenu && comDock?.headline) {
        return { headline: comDock.headline, hint: comDock.hint || '' };
    }

    if (!node?.say?.length) return null;
    const lines = node.say.map((l) => l.replace(/\*\*/g, ''));
    return {
        headline: lines[0] || '',
        hint: lines.slice(1).join('\n'),
    };
}

export function isDockStepActive(state, hasQuickActions, hasForm) {
    return Boolean(hasForm || hasQuickActions);
}

export function getInputFormConfig(state) {
    const node = getNode(state.nodeId);
    if (!node?.input) return null;

    const field = node.input.field || 'text';
    const lines = (node.say || []).map((l) => l.replace(/\*\*/g, ''));
    const headline = lines[0] || 'Completa tus datos';
    const hint = lines.slice(1).join('\n') || '';

    const configs = {
        telefono: {
            label: 'Número de celular',
            type: 'tel',
            inputmode: 'tel',
            autocomplete: 'tel',
            maxlength: 13,
            placeholder: 'Ej: 0991234567',
        },
        cedula: {
            label: 'Número de cédula',
            type: 'tel',
            inputmode: 'numeric',
            autocomplete: 'off',
            maxlength: 10,
            placeholder: 'Ej: 1712345678',
        },
        nombre: {
            label: 'Nombre completo',
            type: 'text',
            autocomplete: 'name',
            placeholder: 'Como aparece en tu documento',
        },
        plate: {
            label: 'Placa del vehículo',
            type: 'text',
            autocomplete: 'off',
            placeholder: 'Ej: GYE1234',
        },
    };

    const base = configs[field] || {
        label: 'Tu respuesta',
        type: 'text',
        placeholder: 'Escribe aquí…',
    };

    return {
        field,
        headline,
        hint,
        submitLabel: 'Continuar',
        ...base,
    };
}

export function parseBotMessage(text) {
    const raw = String(text || '');
    const clean = raw.replace(/\*\*/g, '');
    const isSuccess = raw.includes('✅') || /solicitud.*registrada/i.test(clean);
    const isNote = clean.startsWith('(') && clean.endsWith(')');
    const lines = clean.split('\n').filter(Boolean);
    const title = lines.length > 1 && lines[0].length < 120 ? lines[0] : null;
    const body = title ? lines.slice(1).join('\n') : clean;

    return {
        text: clean,
        title,
        body,
        variant: isSuccess ? 'success' : isNote ? 'muted' : 'default',
    };
}

export function isNpsMenu(actions) {
    if (!actions?.length) return false;
    const numeric = actions.filter((a) => /^\d{1,2}$/.test(String(a.label).trim()));
    return numeric.length >= 8;
}
