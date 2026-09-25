/**
 * Subgrafo Omniax — agendar / reagendar cita dental.
 */

export const OMX_DEN_FECHA_HORA_NODE = 'omx_den_fecha_hora';
export const OMX_DEN_BENEF_FORM_NODE = 'omx_den_benef_form';

export function buildOmniaxDentalNodes() {
    return {
        omx_den_cabina: {
            jelou: 'Notificar Cabina Asistencia en Proceso',
            say: ['Validando asistencias en curso…'],
            skipSay: true,
            omniax: {
                enter: 'cabina_gate',
                kind: 'dental',
                tipoServicio: 'DENTAL',
                afterCabinaNext: 'omx_den_start',
            },
        },
        omx_den_reag_cabina: {
            jelou: 'Notificar Cabina Asistencia en Proceso',
            skipSay: true,
            omniax: {
                enter: 'cabina_gate',
                kind: 'dental',
                tipoServicio: 'DENTAL',
                afterCabinaNext: 'omx_den_reag_start',
            },
        },
        omx_den_start: {
            jelou: '2.1.1 Agendar cita dental - Omniax',
            skipSay: true,
            omniax: { enter: 'en_proceso', kind: 'dental', reagendar: false },
        },
        omx_den_reag_start: {
            jelou: '2.1.2 Reagendar cita dental',
            omniax: { kind: 'dental', reagendar: true },
            say: ['¿Para quién reagendamos la cita dental?'],
            actions: [
                {
                    id: 'para_mi',
                    label: 'Para mí',
                    next: 'omx_den_reag_list_load',
                    meta: { omx: true, para_beneficiario: false },
                },
                {
                    id: 'benef',
                    label: 'Beneficiario',
                    next: 'omx_den_benef_form',
                },
            ],
        },
        omx_den_reag_list_load: {
            jelou: 'Listado reagendar dental',
            skipSay: true,
            omniax: { enter: 'en_proceso_reagendar' },
        },
        omx_den_reag_pick: {
            jelou: 'Reagendar dental',
            skipSay: true,
            useOmniaxMenu: true,
        },
        omx_den_reagendar_load: {
            jelou: 'Reagendar cita dental',
            skipSay: true,
            omniax: { enter: 'reagendar' },
        },
        omx_den_who: {
            jelou: 'Agendar dental',
            say: ['¿Para quién es la cita dental?'],
            actions: [
                {
                    id: 'para_mi',
                    label: 'Para mí',
                    next: 'omx_den_aplica_load',
                    meta: { omx: true, para_beneficiario: false },
                },
                {
                    id: 'benef',
                    label: 'Beneficiario',
                    next: 'omx_den_benef_form',
                },
            ],
        },
        omx_den_benef_form: {
            jelou: 'Beneficiario dental',
            say: ['Completa los datos del beneficiario en el formulario.'],
        },
        omx_den_aplica_load: {
            jelou: 'Aplica asignación dental',
            skipSay: true,
            omniax: { enter: 'aplica_asignacion' },
        },
        omx_den_donde: {
            jelou: 'Ubicación cita dental',
            say: ['¿Dónde te gustaría agendar tu cita?'],
            actions: [
                { id: 'cerca', label: 'Cerca de tu ubicación actual', next: 'omx_den_share_location' },
                { id: 'otra', label: 'Otra ubicación', next: 'omx_den_ciudades_load' },
            ],
        },
        omx_den_share_location: {
            jelou: 'Ubicación',
            say: ['Por favor compárteme tu ubicación actual 📍'],
            actions: [
                {
                    id: 'share_location',
                    label: '📍 Compartir ubicación',
                    type: 'location',
                    next: 'omx_den_est_gps_load',
                },
            ],
        },
        omx_den_ciudades_load: {
            jelou: 'Ciudades',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'zonas_ciudades' },
        },
        omx_den_zonas_load: {
            jelou: 'Zonas',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'zonas_lista' },
        },
        omx_den_est_gps_load: {
            jelou: 'Establecimientos',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'establecimientos_gps' },
        },
        omx_den_est_zona_load: {
            jelou: 'Establecimientos zona',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'establecimientos_zona' },
        },
        omx_den_dias_load: {
            jelou: 'Fechas disponibles dental',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'disponibilidad_dias' },
        },
        omx_den_horas_load: {
            jelou: 'Horarios disponibles dental',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'disponibilidad_horas' },
        },
        omx_den_fecha_hora: {
            jelou: 'Fecha y hora (reagendar)',
            say: ['Ingresa la nueva fecha y hora para reagendar la cita dental.'],
        },
        omx_den_sin_asignacion: {
            jelou: 'Sin asignación dental',
            say: [
                'Listo, en breve un asesor se comunicará contigo para darte detalles de tu servicio.',
            ],
            actions: [{ id: 'menu', label: 'Menú principal', next: 'menu_principal' }],
        },
        omx_den_sin_fechas: {
            jelou: 'Sin fechas dental',
            say: ['Lo sentimos. No existen fechas disponibles. Por favor, escoge otro establecimiento.'],
            actions: [
                { id: 'volver', label: 'Elegir otro establecimiento', next: 'omx_den_donde' },
                { id: 'menu', label: 'Menú principal', next: 'menu_principal' },
            ],
        },
        omx_den_verificar_disponibilidad_load: {
            jelou: 'Verificar disponibilidad',
            skipSay: true,
            omniax: { enter: 'verificar_disponibilidad' },
        },
        omx_den_crear_load: {
            jelou: 'Crear asistencia dental',
            skipSay: true,
            omniax: { enter: 'crear' },
        },
        omx_den_location_skip_load: {
            jelou: 'Ubicación mínima',
            say: ['Por favor compárteme tu ubicación actual 📍'],
            actions: [
                {
                    id: 'share_location',
                    label: '📍 Compartir ubicación',
                    type: 'location',
                    next: 'omx_den_fecha_hora',
                },
            ],
        },
        omx_den_done: {
            jelou: 'Cita dental confirmada',
            skipSay: true,
            actions: [
                { id: 'menu', label: 'Menú principal', next: 'menu_principal' },
                { id: 'den', label: 'Menú dental', next: 'menu_dental' },
            ],
        },
        omx_den_error: {
            jelou: 'Error Omniax dental',
            skipSay: true,
            actions: [
                { id: 'retry', label: 'Reintentar', next: 'omx_den_start' },
                { id: 'menu', label: 'Menú principal', next: 'menu_principal' },
            ],
        },
    };
}
