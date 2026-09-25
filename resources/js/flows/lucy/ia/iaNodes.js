import { standardExitActions } from '../flowHelpers.js';

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
                { id: 'menu', label: 'Menú principal', next: 'menu_principal' },
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
            'omx_den_cabina',
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
            'omx_med_cabina',
            ['Modo **Agendar cita IA** (médico/dental).'],
        ),
        ...iaChatNode(
            'reagendar_cita_ia',
            'reagendar',
            'reagendar cita IA',
            'omx_med_reag_cabina',
            ['Modo **Reagendar cita IA**.'],
        ),
        ia_router_terms_load: {
            jelou: 'IA Router',
            skipSay: true,
            ia: { enter: 'register_router_terms', afterTermsNext: 'menu_principal' },
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
