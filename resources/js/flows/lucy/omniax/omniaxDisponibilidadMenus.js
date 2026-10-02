import { normalizeToOmniaxHora24 } from './omniaxHoraFormat.js';

import {

    DIAS_MENU_MAX,

    formatSlotMenuLabel,

    HORAS_PAGE_SIZE,

    limitDias,

    slotHora24FromApi,

} from './omniaxScheduleSlots.js';



export function buildFranjaMenuActions(franjas, nextDiasNode) {

    return franjas.map((f) => ({

        id: `franja_${f.id}`,

        label: f.label,

        next: nextDiasNode,

        meta: { omx: true, horas_franja: f.id, horas_page: 0 },

    }));

}



export function buildDiasMenuActions(dias, nextHorasNode, { max = DIAS_MENU_MAX } = {}) {

    return limitDias(dias, max).map((d) => ({

        id: `dia_${String(d.valor).replace(/-/g, '')}`,

        label: d.etiqueta || d.valor,

        next: nextHorasNode,

        meta: { omx: true, fecha: d.valor, horas_page: 0 },

    }));

}



export function buildHorasMenuActions(
    horasRaw,
    page,
    { nextVerifyNode, nextHorasNode, nextDiasNode, fecha, reagendar },
) {

    const start = (page || 0) * HORAS_PAGE_SIZE;

    const slice = (horasRaw || []).slice(start, start + HORAS_PAGE_SIZE);



    const actions = slice.map((slot) => {

        const h24 = slotHora24FromApi(slot) || normalizeToOmniaxHora24(slot);

        const label = formatSlotMenuLabel(slot, reagendar);

        return {

            id: `hora_${String(h24).replace(':', '')}`,

            label,

            next: nextVerifyNode,

            meta: { omx: true, hora: h24, fecha },

        };

    });



    if ((horasRaw || []).length > start + HORAS_PAGE_SIZE) {

        actions.push({

            id: 'horas_more',

            label: 'Más opciones',

            next: nextHorasNode,

            meta: { omx: true, horas_page_inc: true },

        });

    }

    if (reagendar && nextDiasNode) {
        actions.push({
            id: 'horas_otra_fecha',
            label: 'Otra fecha',
            next: nextDiasNode,
            meta: { omx: true, horas_page: 0, otra_fecha: true },
        });
    }

    return actions;

}


