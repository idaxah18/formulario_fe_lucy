import { bot } from '../flowHelpers.js';
import { OMX_SIN_COBERTURA_DOCK } from './omniaxDockCopy.js';

const SIN_AFILIACION_SAY = [
    'No encontramos una **afiliación activa** asociada a tu cédula para este servicio.',
    'Puede que no tengas el plan contratado, que los datos no coincidan o que el servicio no esté en tu cobertura.',
    'Si lo deseas, un asesor puede revisar tu caso y ayudarte a continuar.',
];

function familyMenu(kind) {
    return kind === 'dental' ? 'menu_dental' : 'menu_medico';
}

/** Pantallas de “sin afiliación” y el paso previo a reagendar. */
export function citaPlanNodes(kind) {
    const prefix = kind === 'dental' ? 'omx_den' : 'omx_med';
    const menu = familyMenu(kind);
    const servicio = kind === 'dental' ? 'cita dental' : 'cita médica';
    const tipo = kind === 'dental' ? 'DENTAL' : 'MEDICO';
    return {
        [`${prefix}_plan_reag_load`]: {
            jelou: `${servicio} — validar plan`,
            skipSay: true,
            omniax: {
                enter: 'plan_cita',
                kind,
                tipoServicio: tipo,
                afterPlanNext: `${prefix}_reag_cabina_preface`,
            },
        },
        [`${prefix}_sin_afiliacion`]: {
            jelou: `${servicio} — sin afiliación`,
            say: SIN_AFILIACION_SAY,
            actions: [
                {
                    id: 'asesor',
                    label: 'Contactar a un asesor',
                    next: `${prefix}_sin_afiliacion_asesor_load`,
                    icon: 'user-star',
                    menuTone: 'tone-warm',
                },
                {
                    id: 'back',
                    label: 'Volver al menú',
                    next: menu,
                    icon: 'arrow-left',
                    menuTone: 'tone-blue',
                },
            ],
        },
        [`${prefix}_sin_afiliacion_asesor_load`]: {
            jelou: 'Derivación a asesor',
            skipSay: true,
            com: {
                enter: 'derivacion_asesor',
                producto: `Sin afiliación — ${servicio}`,
                notas: `sin_afiliacion; tipo=${tipo}`,
                afterDerivacion: `${prefix}_sin_afiliacion_done`,
            },
        },
        [`${prefix}_sin_afiliacion_done`]: {
            jelou: 'Derivación a asesor',
            skipSay: true,
            actions: [],
        },
    };
}

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
 * La respuesta de Omniax se conserva en `aplica_asignacion_establecimiento`,
 * pero la cita siempre pide ubicación y establecimiento (cerca o por ciudad/zona).
 * No existe atajo al formulario manual de fecha y hora.
 */
export function routeAfterAplicaAsignacion(omx, kind) {
    omx.agenda_completa = true;
    const donde = kind === 'dental' ? 'omx_den_donde' : 'omx_med_donde';
    return {
        nextNodeId: donde,
        messages: [bot('¿Dónde te gustaría agendar tu cita?')],
    };
}
