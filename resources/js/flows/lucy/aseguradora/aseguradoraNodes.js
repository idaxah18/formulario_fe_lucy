import { standardExitActions } from '../flowHelpers.js';

function sinDatosChain(prefix, submitTask, returnMenu = 'menu_siniestro') {
    return {
        [`${prefix}_placa`]: {
            jelou: 'Siniestro',
            say: ['Ingresa la **placa** del vehículo involucrado.'],
            input: { field: 'plate', next: `${prefix}_placa_load`, echoUser: true },
        },
        [`${prefix}_placa_load`]: {
            jelou: 'Consulta Placa Siniestro',
            skipSay: true,
            aseg: {
                enter: 'consulta_placa_siniestro',
                afterOkNext: `${prefix}_prov`,
                sinReturnNode: returnMenu,
            },
        },
        [`${prefix}_prov`]: {
            jelou: 'Consulta Provincias',
            skipSay: true,
            aseg: {
                enter: 'provincias_menu',
                afterProvinciaNext: `${prefix}_ciud_load`,
                sinReturnNode: returnMenu,
            },
            useAsegMenu: true,
        },
        [`${prefix}_ciud_load`]: {
            jelou: 'Consulta Ciudades Por Provincia',
            skipSay: true,
            aseg: {
                enter: 'ciudades_menu',
                afterCiudadNext: `${prefix}_dir`,
                sinReturnNode: returnMenu,
            },
            useAsegMenu: true,
        },
        [`${prefix}_dir`]: {
            say: ['Escribe la **dirección** o referencia del siniestro.'],
            input: { next: `${prefix}_fecha`, echoUser: true, asegField: 'direccion' },
        },
        [`${prefix}_fecha`]: {
            say: ['Fecha del siniestro (DD/MM/AAAA).'],
            input: { next: `${prefix}_hora`, echoUser: true, asegField: 'fecha_siniestro' },
        },
        [`${prefix}_hora`]: {
            say: ['Hora del siniestro (HH:MM, formato 24h).'],
            input: { next: `${prefix}_submit`, echoUser: true, asegField: 'hora_siniestro' },
        },
        [`${prefix}_submit`]: {
            jelou: 'Reporte Siniestro',
            skipSay: true,
            aseg: { enter: submitTask },
        },
    };
}

export function buildAseguradoraSiniestroNodes() {
    return {
        ...sinDatosChain('sin_col', 'reporte_colision'),
        siniestro_colision: {
            jelou: 'Siniestro - Colisión - Empezar',
            say: ['Reporte de colisión. Empezamos con los datos del vehículo.'],
            actions: [{ id: 'go', label: 'Continuar', next: 'sin_col_placa' }],
        },
        ...sinDatosChain('sin_rt', 'reporte_robo_total'),
        siniestro_robo_total: {
            jelou: 'Siniestro - Robo Total - Empezar',
            say: ['Reporte de robo total.'],
            actions: [{ id: 'go', label: 'Continuar', next: 'sin_rt_placa' }],
        },
        ...sinDatosChain('sin_rp', 'reporte_robo_parcial'),
        siniestro_robo_parcial: {
            jelou: 'Siniestro - Robo Parcial - Empezar',
            say: ['Reporte de robo parcial.'],
            actions: [{ id: 'go', label: 'Continuar', next: 'sin_rp_placa' }],
        },
        siniestro_postergar: {
            jelou: 'Siniestro - Postergar',
            say: [
                'Para postergar un siniestro, un asesor debe completar el registro en el canal oficial.',
                'En WhatsApp continúa el flujo con Lucy; aquí puedes volver al menú de aseguradora.',
            ],
            actions: standardExitActions('menu_aseguradora'),
        },
        inspeccion: {
            jelou: 'Inspección',
            say: ['Ingresa el **código de riesgo** o identificador de inspección.'],
            input: { next: 'inspeccion_load', echoUser: true, asegField: 'codigo_riesgo' },
        },
        inspeccion_load: {
            jelou: 'Inspección Riesgo Buscar Aseguradora',
            skipSay: true,
            aseg: { enter: 'inspeccion_buscar' },
        },
        sin_done: {
            say: ['Tu reporte fue enviado. ¿Qué deseas hacer ahora?'],
            actions: standardExitActions('menu_aseguradora'),
        },
    };
}
