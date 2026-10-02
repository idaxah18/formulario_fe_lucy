/**
 * Preguntas por servicio — LUCY_V3.drawio (Hogar/Vial automático).
 * early: tras elegir servicio, antes de S1/S2.
 * late: tras S3 cobertura, antes de S5 crear.
 */

const SHARED_HOGAR_EARLY = [
    {
        id: 'titular',
        say: '¿La solicitud corresponde al titular registrado en el plan?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
        ],
    },
    {
        id: 'en_lugar',
        say: '¿Te encuentras en el lugar donde necesitas la asistencia?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
        ],
    },
];

export const HOGAR_DOMICILIO_PERMANENTE = {
    id: 'domicilio_permanente',
    say: '¿Esta dirección corresponde a su domicilio permanente?',
    actions: [
        { id: 'si', label: 'Sí', aplicaAutomatico: true },
        { id: 'no', label: 'No', aplicaAutomatico: true },
    ],
};

const SHARED_VIAL_EARLY = [
    {
        id: 'vehiculo_tuyo',
        say: '¿El vehículo registrado pertenece a usted?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
        ],
    },
    {
        id: 'con_vehiculo',
        say: '¿Se encuentra con el vehículo?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
        ],
    },
];

const VIAL_EN_VEHICULO = {
    id: 'en_vehiculo',
    say: '¿Te encuentras dentro del vehículo?',
    actions: [
        { id: 'si', label: 'Sí', aplicaAutomatico: true },
        { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
    ],
};

const REMOLQUE_EARLY = [
    {
        id: 'cargado',
        say: '¿El vehículo se encuentra con carga?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: true },
        ],
    },
    {
        id: 'rueda',
        say: '¿El vehículo rueda o está bloqueado?',
        actions: [
            { id: 'rueda', label: 'Rueda', aplicaAutomatico: true },
            { id: 'bloqueado', label: 'Bloqueado', aplicaAutomatico: false, cabina: true },
        ],
    },
    {
        id: 'sotano',
        say: '¿El vehículo se encuentra en un sótano?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: false, cabina: true },
            { id: 'no', label: 'No', aplicaAutomatico: true },
        ],
    },
    {
        id: 'destino',
        say: 'Selecciona el lugar de destino del traslado:',
        actions: [
            { id: 'domicilio', label: 'Domicilio', meta: { id_lugar_destino: 4 } },
            { id: 'taller', label: 'Taller', meta: { id_lugar_destino: 5 } },
            { id: 'otro', label: 'Otro lugar', meta: { id_lugar_destino: 8 } },
        ],
    },
];

const GRUA_LATE = [
    {
        id: 'neutro_plataforma',
        say:
            '¿El vehículo se puede poner en neutro, no se encuentra bloqueado para poder subir a la plataforma?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
        ],
    },
    {
        id: 'accesible_plataforma',
        say: '¿El vehículo se encuentra en un lugar accesible para la plataforma?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
        ],
    },
];

const LLANTA_LATE = [
    {
        id: 'llantas_plataforma',
        say: '¿Las llantas se encuentran en buen estado para subir a la plataforma?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
        ],
    },
    {
        id: 'llanta_emergencia',
        say: '¿La llanta de emergencia se encuentra en buen estado?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
        ],
    },
    {
        id: 'tuerca_seguridad',
        say: '¿Tiene tuerca de seguridad?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
        ],
    },
];

const CERRAJERIA_LATE = [
    {
        id: 'luces_pito',
        say: '¿Tiene luces y pito?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
        ],
    },
    {
        id: 'llaves_cabina',
        say: '¿Las llaves se encuentran en la cabina o en el maletero del vehículo?',
        actions: [
            { id: 'cabina', label: 'Cabina', aplicaAutomatico: true },
            { id: 'maletero', label: 'Maletero', aplicaAutomatico: true },
            { id: 'otro', label: 'Otro', aplicaAutomatico: false, cabina: true },
        ],
    },
    {
        id: 'motivo_llaves',
        say: '¿Es pérdida, olvido o robo de llaves?',
        actions: [
            { id: 'perdida', label: 'Pérdida', aplicaAutomatico: true },
            { id: 'olvido', label: 'Olvido', aplicaAutomatico: true },
            { id: 'robo', label: 'Robo', aplicaAutomatico: false, cabina: true },
        ],
    },
];

const GASOLINA_LATE = [
    {
        id: 'plan_cubre_combustible',
        say: '¿Plan cubre el combustible?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true },
        ],
    },
    {
        id: 'acepta_pago_combustible',
        say: '¿Acepta pagar el combustible?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true, meta: { acepta_pago_combustible: 1 } },
            { id: 'no', label: 'No', aplicaAutomatico: false, cabina: true, meta: { acepta_pago_combustible: 0 } },
        ],
    },
];

const PLOMERO_LATE = [
    {
        id: 'fuga_tipo',
        say: '¿Es una fuga de agua o problemas con el suministro o evacuación de las aguas?',
        actions: [
            { id: 'fuga', label: 'Fuga de agua', aplicaAutomatico: true },
            { id: 'suministro', label: 'Suministro o evacuación', aplicaAutomatico: true },
        ],
    },
    {
        id: 'griferia',
        say: '¿Es un problema en la grifería o llaves que regulan el paso del agua?',
        actions: [
            { id: 'si', label: 'Sí', aplicaAutomatico: true },
            { id: 'no', label: 'No', aplicaAutomatico: true },
        ],
    },
];

const ELECTRICISTA_LATE = [
    {
        id: 'suministro',
        say: '¿La falta del suministro eléctrico es total o parcial?',
        actions: [
            { id: 'parcial', label: 'Parcial', aplicaAutomatico: true },
            { id: 'total', label: 'Total', aplicaAutomatico: false, cabina: true },
        ],
    },
];

const BY_SERVICE = {
    'Grúa por avería': {
        early: [...SHARED_VIAL_EARLY, VIAL_EN_VEHICULO, ...REMOLQUE_EARLY],
        late: GRUA_LATE,
    },
    'Remolque por avería': {
        early: [...SHARED_VIAL_EARLY, VIAL_EN_VEHICULO, ...REMOLQUE_EARLY],
        late: GRUA_LATE,
    },
    'Cambio de llanta': {
        early: [...SHARED_VIAL_EARLY, VIAL_EN_VEHICULO],
        late: LLANTA_LATE,
    },
    'Suministro de gasolina': {
        early: [...SHARED_VIAL_EARLY, VIAL_EN_VEHICULO],
        late: GASOLINA_LATE,
    },
    'Paso de corriente': {
        early: [...SHARED_VIAL_EARLY, VIAL_EN_VEHICULO],
        late: [],
    },
    'Cerrajería de puertas': {
        early: [...SHARED_VIAL_EARLY, VIAL_EN_VEHICULO],
        late: CERRAJERIA_LATE,
    },
    Plomero: { early: [...SHARED_HOGAR_EARLY], late: PLOMERO_LATE },
    Electricista: { early: [...SHARED_HOGAR_EARLY], late: ELECTRICISTA_LATE },
};

function planFor(serviceLabel) {
    return BY_SERVICE[serviceLabel] || {
        early: [...SHARED_HOGAR_EARLY],
        late: [],
    };
}

export function getAutomaticoQuestionPlan(serviceLabel) {
    return planFor(serviceLabel).early;
}

export function getAutomaticoEarlyQuestionPlan(serviceLabel) {
    return planFor(serviceLabel).early;
}

export function getAutomaticoLateQuestionPlan(serviceLabel) {
    return planFor(serviceLabel).late;
}
