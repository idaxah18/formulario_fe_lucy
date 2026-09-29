/**
 * Texto del dock para cierres “cabina / asesor” (mismo tono que Reportar un problema).
 * Se muestra en el panel inferior; no duplicar en burbujas del chat.
 */

const VARIANTS = {
    problema: {
        headline: 'Oh, lamento que hayas tenido un problema. 😕',
        hint: 'Para poder atenderte mejor, inmediatamente un agente se comunicará contigo para resolverlo.',
    },
    asistencia_en_curso: {
        headline: '¡Listo! Ya registramos tu solicitud. 🙂',
        hint:
            'Un asesor te contactará para contarte el estado de tu asistencia y ayudarte con lo que necesites.',
    },
    comercial: {
        headline: '¡Perfecto! Te conectamos con un asesor. 😊',
        hint: 'En breve un agente se comunicará contigo para continuar tu solicitud.',
    },
    cita_agenda: {
        headline: '¡Listo! Un asesor continuará contigo. 🙂',
        hint:
            'Te contactaremos para ayudarte a completar tu cita según tu plan de asistencia.',
    },
    otras_soluciones: {
        headline: '¡Listo! 🙂',
        hint: 'En breve un asesor se comunicará contigo para darte detalles de tu servicio.',
    },
    cabina_preface_servicio: {
        headline: '¡Perfecto! Vamos a registrar tu solicitud. 🙂',
        hint:
            'Al continuar, notificaremos a cabina para que un ejecutivo atienda tu requerimiento y coordine la asistencia contigo por este mismo canal.',
    },
    cabina_preface_cita_medica: {
        headline: '¡Genial! Continuemos con tu cita médica. 🙂',
        hint:
            'Al continuar notificaremos a cabina y seguirás el agendamiento según tu plan (con o sin elección de centro en la app).',
    },
    cabina_preface_cita_dental: {
        headline: '¡Genial! Continuemos con tu cita dental. 🙂',
        hint:
            'Al continuar notificaremos a cabina y seguirás el agendamiento según tu plan (con o sin elección de centro en la app).',
    },
    cabina_preface_cita_reagendar: {
        headline: 'Entendido, reagendemos tu cita. 🙂',
        hint:
            'Al continuar notificaremos a cabina para que un ejecutivo te ayude con el cambio de fecha u hora.',
    },
    cabina_preface_aseguradora: {
        headline: '¡Listo! Validemos tu asistencia vial. 🙂',
        hint:
            'Al continuar notificaremos a cabina para que un ejecutivo atienda tu requerimiento de aseguradora.',
    },
    cabina_vigente: {
        headline: 'Tu solicitud ya está en proceso. 🙂',
        hint:
            'Un ejecutivo de cabina o un asesor se comunicará contigo pronto para darte seguimiento. No necesitas volver a registrar el mismo requerimiento.',
    },
    cabina_error: {
        headline: 'No pudimos notificar a cabina en este momento. 😕',
        hint:
            'Tu información quedó en este chat. Intenta de nuevo en unos minutos o escribe a un asesor desde el menú.',
    },
    sin_afiliacion: {
        headline: 'No encontramos afiliación para este servicio. 😕',
        hint:
            'Un asesor puede revisar tu plan y tus datos para ayudarte a continuar o indicarte cómo contratar cobertura.',
    },
    derivacion_registrada: {
        headline: '¡Listo! Un ejecutivo de GEA se comunicará contigo.',
        hint: 'Revisa este chat o tu teléfono en los próximos minutos.',
    },
};

/**
 * @param {'problema'|'asistencia_en_curso'|'comercial'|'cita_agenda'|'otras_soluciones'} variant
 * @param {{ simulated?: boolean }} [options]
 * @returns {string[]}
 */
export function advisorHandoffSay(variant = 'comercial', options = {}) {
    const v = VARIANTS[variant] || VARIANTS.comercial;
    const lines = [v.headline, v.hint];
    if (options.simulated) {
        lines.push(
            '(Modo prueba: configura JELOU_DATUM_VENTA_BASIC_* en el servidor para derivación real.)',
        );
    }
    return lines;
}

/** Nodo compartido tras bloqueo de Notificar Cabina (asistencia vigente / error). */
export const CABINA_REGISTRO_HANDOFF_DONE = 'cabina_registro_handoff_done';

export function isCabinaPrefaceNode(nodeId) {
    if (!nodeId) return false;
    if (nodeId.endsWith('_cabina_preface')) return true;
    if (nodeId.startsWith('asist_preface_')) return true;
    if (nodeId.startsWith('aseg_cabina_preface_')) return true;
    return false;
}

/** @param {object} [node] Nodo del grafo (puede traer cabinaPreface / serviceLabel). */
export function resolveCabinaPrefaceVariant(node, state) {
    const kind = node?.cabinaPreface || 'servicio';
    const map = {
        servicio: 'cabina_preface_servicio',
        cita_medica: 'cabina_preface_cita_medica',
        cita_dental: 'cabina_preface_cita_dental',
        cita_reagendar: 'cabina_preface_cita_reagendar',
        aseguradora: 'cabina_preface_aseguradora',
    };
    let variant = map[kind] || map.servicio;
    const label = node?.serviceLabel || state?.context?.gea?.serviceLabel;
    if (variant === 'cabina_preface_servicio' && label) {
        return { variant, serviceLabel: label };
    }
    return { variant, serviceLabel: null };
}

export function cabinaPrefaceDockLines(node, state) {
    const { variant, serviceLabel } = resolveCabinaPrefaceVariant(node, state);
    const lines = advisorHandoffSay(variant);
    if (serviceLabel) {
        return [
            lines[0],
            `Servicio: ${serviceLabel}. ${lines[1] || ''}`.trim(),
        ];
    }
    return lines;
}

export function isAdvisorHandoffDoneNode(nodeId) {
    if (!nodeId) return false;
    if (nodeId === CABINA_REGISTRO_HANDOFF_DONE) return true;
    if (nodeId === 'asistencia_activa_asesor_done') return true;
    if (nodeId === 'reportar_problema_done') return true;
    if (nodeId === 'solicitar_factura_done') return true;
    if (nodeId === 'otras_soluciones_gea_done') return true;
    if (nodeId === 'gea_crear_exit') return true;
    if (nodeId === 'venta_contratar_ok') return true;
    if (nodeId === 'venta_derivacion_done') return true;
    if (nodeId === 'gea_auto_sin_afiliacion_done') return true;
    if (/_asesor_done$/.test(nodeId)) return true;
    if (/^leaf_info_\w+_done$/.test(nodeId)) return true;
    if (nodeId.endsWith('_done') && nodeId.startsWith('leaf_')) return true;
    return false;
}
