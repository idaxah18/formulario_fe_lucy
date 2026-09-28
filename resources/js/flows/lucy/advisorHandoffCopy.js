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

export function isAdvisorHandoffDoneNode(nodeId) {
    if (!nodeId) return false;
    if (nodeId === 'asistencia_activa_asesor_done') return true;
    if (nodeId === 'reportar_problema_done') return true;
    if (nodeId === 'solicitar_factura_done') return true;
    if (nodeId === 'otras_soluciones_gea_done') return true;
    if (nodeId === 'gea_crear_exit') return true;
    if (/_asesor_done$/.test(nodeId)) return true;
    if (/^leaf_info_\w+_done$/.test(nodeId)) return true;
    if (nodeId.endsWith('_done') && nodeId.startsWith('leaf_')) return true;
    return false;
}
