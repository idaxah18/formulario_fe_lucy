import { bot } from '../flowHelpers.js';
import { OMX_SIN_COBERTURA_DOCK } from './omniaxDockCopy.js';

/** Pantalla asesor cuando Omniax no permite agendar (sin especialidades / error API). */
export function buildSinCoberturaTransition(ctx, omx, kind) {
    const returnMenu = kind === 'dental' ? 'menu_dental' : 'menu_medico';
    const doneNode = kind === 'dental' ? 'omx_den_sin_cobertura' : 'omx_med_sin_cobertura';
    omx.dockHeadline = OMX_SIN_COBERTURA_DOCK.headline;
    omx.dockHint = OMX_SIN_COBERTURA_DOCK.hint;
    omx.menuActions = [
        {
            id: 'asesor',
            label: 'Continuar con asesor',
            next: kind === 'dental' ? 'omx_den_asesor_load' : 'omx_med_asesor_load',
        },
        { id: 'menu', label: 'Menú principal', next: 'menu_solucion_24_7' },
        {
            id: 'back',
            label: 'Volver',
            next: returnMenu,
            icon: 'arrow-left',
            menuTone: 'tone-blue',
        },
    ];
    return {
        nextNodeId: doneNode,
        messages: [],
        patchContext: { omniax: omx },
    };
}

/**
 * Tras POST aplica-asignacion.
 * `false` = agenda simplificada (ubicación + crear), NO derivación a asesor.
 * @see docs/OMNIAX_MEDICO.md
 */
export function routeAfterAplicaAsignacion(omx, kind) {
    const applies = Boolean(omx.aplica_asignacion_establecimiento);
    omx.agenda_completa = applies;
    const donde = kind === 'dental' ? 'omx_den_donde' : 'omx_med_donde';
    const skipLoc = kind === 'dental' ? 'omx_den_location_skip_load' : 'omx_med_location_skip_load';
    if (applies) {
        return {
            nextNodeId: donde,
            messages: [bot('¿Dónde te gustaría agendar tu cita?')],
        };
    }
    return {
        nextNodeId: skipLoc,
        messages: [
            bot(
                'Tu plan permite agendar sin elegir centro en este paso. Comparte tu ubicación para continuar con la cita.',
            ),
        ],
    };
}
