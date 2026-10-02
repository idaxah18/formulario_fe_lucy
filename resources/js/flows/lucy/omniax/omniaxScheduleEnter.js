import { bot } from '../flowHelpers.js';
import {
    buildDiasMenuActions,
    buildFranjaMenuActions,
    buildHorasMenuActions,
} from './omniaxDisponibilidadMenus.js';
import {
    DIAS_MENU_MAX,
    establecimientoHorarioMinutes,
    filterSlotsByFranja,
    formatEstablecimientoHorarioHint,
    franjasWithAvailability,
    FRANJAS,
    limitDias,
} from './omniaxScheduleSlots.js';

function franjaLabel(franjaId) {
    return FRANJAS.find((f) => f.id === franjaId)?.label || franjaId;
}

/** Agendar / reagendar — servicio 7 (médico) u 8 (dental): hasta 5 fechas con cupo. */
export async function runOmniaxDisponibilidadDias(ctx, omx, setMenu, {
    nodes,
    fetchDias,
    backNodeId,
    backMessage,
}) {
    if (!omx.id_establecimiento) {
        return {
            nextNodeId: backNodeId,
            messages: [bot(backMessage)],
        };
    }

    const diasRes = await fetchDias();
    const dias = limitDias(diasRes.data || [], DIAS_MENU_MAX);
    if (!dias.length) {
        return {
            nextNodeId: omx.reagendar ? nodes.sinFechasReag : nodes.sinFechas,
            messages: [bot('Lo sentimos. No existen fechas disponibles.')],
        };
    }

    const nextAfterFecha = nodes.franjaLoad;
    const hintParts = [];
    if (omx.especialidad_nombre) hintParts.push(omx.especialidad_nombre);
    hintParts.push(`Elige una de las fechas disponibles (máx. ${DIAS_MENU_MAX}).`);

    setMenu(
        ctx,
        '¿En qué fecha deseas la cita?',
        hintParts.filter(Boolean).join(' · '),
        buildDiasMenuActions(dias, nextAfterFecha),
    );
    return { nextNodeId: nodes.diasLoad, messages: [], stayOnNode: true };
}

/** Mañana / tarde / noche (agendar y reagendar), tras elegir fecha. */
export async function runOmniaxDisponibilidadFranja(ctx, omx, setMenu, {
    nodes,
    fetchHoras,
    backNodeId,
    backMessage,
}) {
    if (!omx.id_establecimiento) {
        return {
            nextNodeId: backNodeId,
            messages: [bot(backMessage)],
        };
    }
    if (!omx.fecha) {
        return {
            nextNodeId: nodes.diasLoad,
            messages: [bot('Primero elige la fecha de la cita.')],
        };
    }

    const horasRes = await fetchHoras(omx.fecha);
    const slots = horasRes.data || [];
    const horario = establecimientoHorarioMinutes(omx);
    const franjas = franjasWithAvailability({ [omx.fecha]: slots }, horario);

    if (!franjas.length) {
        return {
            nextNodeId: nodes.diasLoad,
            messages: [bot('No hay horarios para esa fecha. Elige otra fecha.')],
        };
    }

    const hint = formatEstablecimientoHorarioHint(omx, { [omx.fecha]: slots });
    setMenu(
        ctx,
        '¿En qué momento del día prefieres tu cita?',
        `${hint} Fecha: ${omx.fecha}.`,
        buildFranjaMenuActions(franjas, nodes.horasLoad),
    );
    return { nextNodeId: nodes.franjaLoad, messages: [], stayOnNode: true };
}

/** Servicio 9 / 10 — horarios devueltos por Omniax (30 min agendar, 20 min reagendar). */
export async function runOmniaxDisponibilidadHoras(ctx, omx, setMenu, {
    nodes,
    fetchHoras,
}) {
    if (!omx.id_establecimiento || !omx.fecha) {
        return {
            nextNodeId: nodes.diasLoad,
            messages: [bot('Elige primero la fecha de la cita.')],
        };
    }

    if (!omx.horas_franja) {
        return {
            nextNodeId: nodes.franjaLoad,
            messages: [bot('Primero elige mañana, tarde o noche.')],
        };
    }

    const page = omx.horas_page || 0;
    const horario = establecimientoHorarioMinutes(omx);
    if (!omx._horas_all_for_fecha?.length || omx._horas_fecha !== omx.fecha) {
        const horasRes = await fetchHoras(omx.fecha);
        omx._horas_all_for_fecha = horasRes.data || [];
        omx._horas_fecha = omx.fecha;
    }
    const all = omx._horas_all_for_fecha || [];
    omx.horas_slots = filterSlotsByFranja(all, omx.horas_franja, horario);

    if (!omx.horas_slots.length) {
        return {
            nextNodeId: nodes.franjaLoad,
            messages: [
                bot('No hay horarios en ese momento del día. Elige otra franja o fecha.'),
            ],
        };
    }

    const actions = buildHorasMenuActions(omx.horas_slots, page, {
        nextVerifyNode: nodes.verifyLoad,
        nextHorasNode: nodes.horasLoad,
        nextDiasNode: nodes.diasLoad,
        fecha: omx.fecha,
        reagendar: Boolean(omx.reagendar),
    });

    const slotHint = omx.reagendar
        ? 'Horarios cada 20 minutos en esta franja.'
        : 'Bloques de 30 minutos según disponibilidad.';

    const franjaMeta = FRANJAS.find((f) => f.id === omx.horas_franja);
    const franjaHint = `${franjaLabel(omx.horas_franja)} (${franjaMeta?.hint || ''}). `;

    setMenu(
        ctx,
        `Horarios — ${franjaLabel(omx.horas_franja)}`,
        `${franjaHint}${omx.fecha}. ${slotHint}`,
        actions,
    );
    return { nextNodeId: nodes.horasLoad, messages: [], stayOnNode: true };
}
