/**
 * Plan de preguntas por servicio — mismas pantallas Hogar/Vial donde el diagrama es común.
 * Ramas con `cabina: true` desactivan automático (aplica_servicio_automatico = 0).
 */

const SHARED_START = [
    {
        id: 'titular',
        say: '¿La solicitud corresponde al **titular** registrado en el plan?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
        ],
    },
    {
        id: 'en_lugar',
        say: '¿Te encuentras **en el lugar** donde necesitas la asistencia?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
        ],
    },
];

const VIAL_EN_VEHICULO = {
    id: 'en_vehiculo',
    say: '¿Te encuentras **dentro del vehículo**?',
    actions: [
        { id: 'si', label: 'Sí', aplicaAutomatico: true },
        { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
    ],
};

const REMOLQUE_EXTRA = [
    {
        id: 'cargado',
        say: '¿El vehículo se encuentra **cargado** o **vacío**?',
        actions: [
            { id: 'cargado', label: 'Cargado', aplicaAutomatico: true },
            { id: 'vacio', label: 'Vacío', aplicaAutomatico: true },
        ],
    },
    {
        id: 'rueda',
        say: '¿El vehículo **rueda** o está **bloqueado**?',
        actions: [
            { id: 'rueda', label: 'Rueda', aplicaAutomatico: true },
            { id: 'bloqueado', label: 'Bloqueado', aplicaAutomatico: false, cabina: true },
        ],
    },
    {
        id: 'sotano',
        say: '¿El vehículo se encuentra en un **sótano**?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: false, cabina: true },
            { id: 'no', label: 'No', aplicaAutomatico: true },
        ],
    },
    {
        id: 'destino',
        say: 'Selecciona el **lugar de destino** del traslado:',
        actions: [
            { id: 'domicilio', label: 'Domicilio', meta: { id_lugar_destino: 4 } },
            { id: 'taller', label: 'Taller', meta: { id_lugar_destino: 5 } },
            { id: 'otro', label: 'Otro lugar', meta: { id_lugar_destino: 8 } },
        ],
    },
];

const BY_SERVICE = {
    'Grúa por avería': [...SHARED_START, VIAL_EN_VEHICULO, ...REMOLQUE_EXTRA],
    'Remolque por avería': [...SHARED_START, VIAL_EN_VEHICULO, ...REMOLQUE_EXTRA],
    'Cambio de llanta': [...SHARED_START, VIAL_EN_VEHICULO],
    'Suministro de gasolina': [...SHARED_START, VIAL_EN_VEHICULO],
    'Paso de corriente': [...SHARED_START, VIAL_EN_VEHICULO],
    'Cerrajería de puertas': [...SHARED_START, VIAL_EN_VEHICULO],
    Plomero: [...SHARED_START],
    Electricista: [...SHARED_START],
};

/** @returns {import('./automaticoQuestions.js').QuestionStep[]} */
export function getAutomaticoQuestionPlan(serviceLabel) {
    return BY_SERVICE[serviceLabel] || [...SHARED_START];
}
