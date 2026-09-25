import { normalizeOmniaxHorasList, normalizeToOmniaxHora24 } from './omniaxHoraFormat.js';

const HORAS_PAGE_SIZE = 9;

export function buildDiasMenuActions(dias, nextHorasNode) {
    return (dias || []).map((d) => ({
        id: `dia_${String(d.valor).replace(/-/g, '')}`,
        label: d.etiqueta || d.valor,
        next: nextHorasNode,
        meta: { omx: true, fecha: d.valor, horas_page: 0 },
    }));
}

export function buildHorasMenuActions(horasRaw, page, { nextVerifyNode, nextHorasNode, fecha }) {
    const horas = normalizeOmniaxHorasList(horasRaw).map((h) => normalizeToOmniaxHora24(h) || h);
    const start = (page || 0) * HORAS_PAGE_SIZE;
    const slice = horas.slice(start, start + HORAS_PAGE_SIZE);

    const actions = slice.map((h) => ({
        id: `hora_${String(h).replace(':', '')}`,
        label: h,
        next: nextVerifyNode,
        meta: { omx: true, hora: h, fecha },
    }));

    if (horas.length > start + HORAS_PAGE_SIZE) {
        actions.push({
            id: 'horas_more',
            label: 'Más opciones',
            next: nextHorasNode,
            meta: { omx: true, horas_page_inc: true },
        });
    }

    return actions;
}
