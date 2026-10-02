import { LUCY_HOME_NODE, standardExitActions } from '../flowHelpers.js';

function iaChatNode(id, profile, jelouRef, classicNext, introLines) {
    return {
        [id]: {
            jelou: jelouRef,
            say: introLines,
            useIaChat: true,
            ia: { profile, enter: 'start_session' },
            actions: [
                { id: 'classic', label: 'Usar menú guiado', next: classicNext },
                { id: 'wa_close', label: 'Volver a WhatsApp', type: 'webview_close' },
                { id: 'menu', label: 'Menú principal', next: LUCY_HOME_NODE },
            ],
        },
    };
}

export function buildIaNodes() {
    return {
        ...iaChatNode(
            'dental_ia',
            'dental',
            'Dental IA',
            'omx_den_elegibilidad_load',
            [
                'Modo **Dental IA**: escribe tu solicitud como en WhatsApp.',
                'También puedes usar el menú guiado de agendar cita.',
            ],
        ),
        ...iaChatNode(
            'hogar_ia',
            'hogar',
            'Hogar IA',
            'menu_hogar',
            ['Modo **Hogar IA**: describe tu necesidad de asistencia en casa.'],
        ),
        ...iaChatNode(
            'vial_ia',
            'vial',
            'vial IA',
            'menu_vial',
            ['Modo **Vial IA**: cuéntame qué le pasa a tu vehículo.'],
        ),
        ...iaChatNode(
            'agendar_cita_ia',
            'agendar',
            'Agendar cita IA',
            'omx_med_elegibilidad_load',
            ['Modo **Agendar cita IA** (médico/dental).'],
        ),
        ...iaChatNode(
            'reagendar_cita_ia',
            'reagendar',
            'reagendar cita IA',
            'omx_med_reag_list_load',
            ['Modo **Reagendar cita IA**.'],
        ),
        ...iaChatNode(
            'leaf_proteccion',
            'proteccion',
            '4 - Servicios Protección - Inicio',
            LUCY_HOME_NODE,
            [
                'Modo **Servicios de protección**: pregúntame por documentos para tu producto o por tu situación (robo, secuestro express, etc.).',
                'Con todo listo, llama al **1700 247000** para solicitar beneficios.',
            ],
        ),
        ia_router_terms_load: {
            jelou: 'IA Router',
            skipSay: true,
            ia: { enter: 'register_router_terms', afterTermsNext: LUCY_HOME_NODE },
        },
        ia_router_after_reg: {
            jelou: 'IA Router',
            say: [
                'Registro listo. Puedes usar los flujos con IA desde Médico, Dental, Hogar o Vial.',
            ],
            actions: standardExitActions(),
        },
    };
}
