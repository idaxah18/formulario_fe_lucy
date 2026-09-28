import { standardExitActions } from '../flowHelpers.js';

function idAsistenciaInput(nextNode, jelou = 'Utilidades GEA') {
    return {
        jelou,
        say: ['Escribe el **número de asistencia** (ID numérico).'],
        input: { next: nextNode, echoUser: true, geaField: 'id_asistencia_evaluar' },
    };
}

function proveedorSiNo(nextSendNode, headline) {
    return {
        jelou: 'Menú oculto proveedores',
        say: [headline],
        actions: [
            { id: 'si', label: 'Sí', next: nextSendNode, meta: { gea: { respuestaProveedor: '1' } } },
            { id: 'no', label: 'No', next: nextSendNode, meta: { gea: { respuestaProveedor: '2' } } },
            ...standardExitActions('menu_utilidades'),
        ],
    };
}

export function buildGeaNodes() {
    return {
        asistencias_en_curso: {
            jelou: 'Asistencias en curso',
            say: ['Revisando si tienes asistencias activas…'],
            skipSay: true,
            gea: { enter: 'post_auth_asistencias_gate' },
        },
        cancelar_asistencia: {
            jelou: 'Cancelar asistencia',
            say: ['Buscando asistencias que puedas cancelar…'],
            gea: { enter: 'listado_cancel' },
            useGeaMenu: true,
        },
        gea_cancel_done: {
            jelou: 'Cancelar asistencia',
            skipSay: true,
            gea: { enter: 'cancelar' },
        },
        gea_crear_exit: {
            jelou: 'V2 Crear asistencia',
            skipSay: true,
            actions: [
                {
                    id: 'home',
                    label: 'Menú principal',
                    next: 'menu_solucion_24_7',
                    icon: 'home',
                    menuTone: 'tone-blue',
                },
            ],
        },

        gea_encuesta_id: idAsistenciaInput('gea_encuesta_load', 'Encuesta'),
        gea_encuesta_load: {
            jelou: 'Encuesta',
            skipSay: true,
            gea: { enter: 'cuestionario_load' },
        },
        gea_encuesta_active: {
            jelou: 'Encuesta',
            skipSay: true,
            useGeaMenu: true,
        },

        gea_reeval_id: idAsistenciaInput('gea_reeval_send', 'Encuesta Solicitar'),
        gea_reeval_send: {
            jelou: 'Encuesta Solicitar',
            skipSay: true,
            gea: { enter: 'reenviar_evaluacion' },
        },
        gea_eval_conf_id: idAsistenciaInput('gea_eval_conf_send', 'Encuesta Confirmar'),
        gea_eval_conf_send: {
            jelou: 'Encuesta Confirmar',
            skipSay: true,
            gea: { enter: 'evaluacion_confirmada' },
        },

        gea_ubicacion_id: idAsistenciaInput('gea_ubicacion_loc', 'asistencia ubicación'),
        gea_ubicacion_loc: {
            jelou: 'asistencia ubicación',
            say: ['Comparte la **nueva ubicación** de la asistencia.'],
            actions: [
                {
                    id: 'share_location',
                    label: '📍 Compartir ubicación',
                    type: 'location',
                    next: 'gea_ubicacion_put',
                },
            ],
        },
        gea_ubicacion_put: {
            jelou: 'asistencia ubicación',
            skipSay: true,
            gea: { enter: 'ubicacion_put' },
        },

        gea_prov_contacto_id: idAsistenciaInput('gea_prov_valida_contacto', 'Menú oculto proveedores'),
        gea_prov_valida_contacto: {
            jelou: 'Menu Oculto Asistencia Valida',
            say: ['Validando asistencia…'],
            skipSay: true,
            gea: {
                enter: 'prov_valida',
                provOpcion: 'contacto',
                afterProvValidaNext: 'gea_prov_contacto_ask',
            },
        },
        gea_prov_contacto_ask: proveedorSiNo(
            'gea_prov_contacto_send',
            '¿El proveedor se comunicó contigo?',
        ),
        gea_prov_contacto_send: {
            jelou: 'Menú oculto proveedores',
            skipSay: true,
            gea: { enter: 'prov_contacto' },
        },

        gea_prov_termino_id: idAsistenciaInput('gea_prov_valida_termino', 'Menú oculto proveedores'),
        gea_prov_valida_termino: {
            jelou: 'Menu Oculto Asistencia Valida',
            say: ['Validando asistencia…'],
            skipSay: true,
            gea: {
                enter: 'prov_valida',
                provOpcion: 'termino',
                afterProvValidaNext: 'gea_prov_termino_ask',
            },
        },
        gea_prov_termino_ask: proveedorSiNo(
            'gea_prov_termino_send',
            '¿Confirmas el término del servicio con el proveedor?',
        ),
        gea_prov_termino_send: {
            jelou: 'Menú oculto proveedores',
            skipSay: true,
            gea: { enter: 'prov_termino' },
        },
    };
}
