/**
 * Subgrafo Omniax — agendar / reagendar cita médica.
 */

export const OMX_MED_FECHA_HORA_NODE = 'omx_med_fecha_hora';
export const OMX_MED_BENEF_FORM_NODE = 'omx_med_benef_form';

export function buildOmniaxMedicoNodes() {
    return {
        omx_med_start: {
            jelou: '2.2 Agendar cita médica - Omniax',
            skipSay: true,
            omniax: { enter: 'en_proceso', kind: 'medico', reagendar: false },
        },
        omx_med_reag_start: {
            jelou: '2.2.4 Reagendar cita médica',
            omniax: { kind: 'medico', reagendar: true },
            say: ['Cuéntame, ¿para quién reagendamos la cita?'],
            actions: [
                {
                    id: 'para_mi',
                    label: 'Para mí',
                    next: 'omx_med_reag_list_load',
                    meta: { omx: true, para_beneficiario: false },
                },
                {
                    id: 'benef',
                    label: 'Beneficiario',
                    next: 'omx_med_benef_form',
                },
            ],
        },
        omx_med_reag_list_load: {
            jelou: 'Listado reagendar',
            skipSay: true,
            omniax: { enter: 'en_proceso_reagendar' },
        },
        omx_med_reag_pick: {
            jelou: 'Reagendar - elegir cita',
            skipSay: true,
            useOmniaxMenu: true,
        },
        omx_med_reagendar_load: {
            jelou: 'Reagendar cita',
            skipSay: true,
            omniax: { enter: 'reagendar' },
        },
        omx_med_who: {
            jelou: 'Agendar - titular',
            say: ['Genial, ¿para quién es la cita?'],
            actions: [
                {
                    id: 'para_mi',
                    label: 'Para mí',
                    next: 'omx_med_especialidades_load',
                    meta: { omx: true, para_beneficiario: false },
                },
                {
                    id: 'benef',
                    label: 'Beneficiario',
                    next: 'omx_med_benef_form',
                },
            ],
        },
        omx_med_benef_form: {
            jelou: 'Beneficiario',
            say: ['Completa los datos del beneficiario en el formulario.'],
        },
        omx_med_especialidades_load: {
            jelou: 'Especialidades',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'especialidades' },
        },
        omx_med_aplica_load: {
            jelou: 'Aplica asignación',
            skipSay: true,
            omniax: { enter: 'aplica_asignacion' },
        },
        omx_med_donde: {
            jelou: 'Ubicación cita',
            say: ['¿Dónde te gustaría agendar tu cita?'],
            actions: [
                { id: 'cerca', label: 'Cerca de tu ubicación actual', next: 'omx_med_share_location' },
                { id: 'otra', label: 'Otra ubicación', next: 'omx_med_ciudades_load' },
            ],
        },
        omx_med_share_location: {
            jelou: 'Ubicación',
            say: ['Por favor compárteme tu ubicación actual 📍'],
            actions: [
                {
                    id: 'share_location',
                    label: '📍 Compartir ubicación',
                    type: 'location',
                    next: 'omx_med_est_gps_load',
                },
            ],
        },
        omx_med_ciudades_load: {
            jelou: 'Ciudades',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'zonas_ciudades' },
        },
        omx_med_zonas_load: {
            jelou: 'Zonas',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'zonas_lista' },
        },
        omx_med_est_gps_load: {
            jelou: 'Establecimientos',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'establecimientos_gps' },
        },
        omx_med_est_zona_load: {
            jelou: 'Establecimientos zona',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'establecimientos_zona' },
        },
        omx_med_dias_load: {
            jelou: 'Fechas disponibles',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'disponibilidad_dias' },
        },
        omx_med_horas_load: {
            jelou: 'Horarios disponibles',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'disponibilidad_horas' },
        },
        omx_med_fecha_hora: {
            jelou: 'Fecha y hora (reagendar)',
            say: ['Ingresa la nueva fecha y hora para reagendar la cita.'],
        },
        omx_med_sin_asignacion: {
            jelou: 'Sin asignación establecimiento',
            say: [
                'Listo, en breve un asesor se comunicará contigo para darte detalles de tu servicio.',
            ],
            actions: [{ id: 'menu', label: 'Menú principal', next: 'menu_principal' }],
        },
        omx_med_verificar_disponibilidad_load: {
            jelou: 'Verificar disponibilidad',
            skipSay: true,
            omniax: { enter: 'verificar_disponibilidad' },
        },
        omx_med_crear_load: {
            jelou: 'Crear asistencia',
            skipSay: true,
            omniax: { enter: 'crear' },
        },
        omx_med_location_skip_load: {
            jelou: 'Ubicación mínima',
            say: ['Por favor compárteme tu ubicación actual 📍'],
            actions: [
                {
                    id: 'share_location',
                    label: '📍 Compartir ubicación',
                    type: 'location',
                    next: 'omx_med_fecha_hora',
                },
            ],
        },
        omx_med_done: {
            jelou: 'Cita confirmada',
            skipSay: true,
            actions: [
                { id: 'menu', label: 'Menú principal', next: 'menu_principal' },
                { id: 'med', label: 'Menú médico', next: 'menu_medico' },
            ],
        },
        omx_med_error: {
            jelou: 'Error Omniax',
            skipSay: true,
            actions: [
                { id: 'retry', label: 'Reintentar', next: 'omx_med_start' },
                { id: 'menu', label: 'Menú principal', next: 'menu_principal' },
            ],
        },
        omx_med_sin_fechas: {
            jelou: 'Sin fechas',
            say: ['Lo sentimos. No existen fechas disponibles. Por favor, escoge otro establecimiento.'],
            actions: [
                { id: 'volver', label: 'Elegir otro establecimiento', next: 'omx_med_donde' },
                { id: 'menu', label: 'Menú principal', next: 'menu_principal' },
            ],
        },
    };
}
