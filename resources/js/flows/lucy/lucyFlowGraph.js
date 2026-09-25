import { HSM_CATEGORIES } from './hsmCatalog.js';
import {
    crearAsistenciaChain,
    slugify,
    standardExitActions,
    stubRegistered,
    wizardTextSteps,
} from './flowHelpers.js';
import { buildAseguradoraSiniestroNodes } from './aseguradora/aseguradoraNodes.js';
import { buildIaNodes } from './ia/iaNodes.js';
import { buildGeaNodes } from './gea/geaNodes.js';
import { geaChainOptions } from './gea/geaServiceIds.js';
import { buildOmniaxDentalNodes } from './omniax/omniaxDentalNodes.js';
import { buildOmniaxMedicoNodes } from './omniax/omniaxMedicoNodes.js';

function menuNode(id, jelou, say, actions) {
    return { [id]: { jelou, say: Array.isArray(say) ? say : [say], actions } };
}

function merge(...parts) {
    return Object.assign({}, ...parts);
}

function buildServiceChains(labels, jelouRef, returnNode, chainExtra = {}) {
    let nodes = {};
    const actions = [];
    for (const label of labels) {
        const chain = crearAsistenciaChain(
            label,
            jelouRef,
            returnNode,
            geaChainOptions(label, jelouRef, chainExtra),
        );
        nodes = merge(nodes, chain.nodes);
        actions.push({ id: slugify(label), label, next: chain.entry });
    }
    return { nodes, actions };
}

function buildCore() {
    return merge(
        {
            auth_telefono: {
                jelou: 'Telefono prueba webview',
                say: [
                    'Antes de continuar, ingresa tu **número de celular** (solo para pruebas en web; en WhatsApp se usa tu número automáticamente).',
                ],
                input: { field: 'telefono', next: 'auth_cedula' },
            },
            auth_cedula: {
                jelou: 'Proteccion datos cedula',
                say: ['Hola, soy Lucy. Para ayudarte, ingresa tu número de cédula.'],
                input: { field: 'cedula', next: 'auth_nombre' },
            },
            auth_nombre: {
                jelou: 'Proteccion datos nombre',
                say: ['Gracias. Ahora confirma tu nombre completo.'],
                input: { field: 'nombre', next: 'auth_lopdp' },
            },
            auth_lopdp: {
                jelou: 'Aceptacion LOPDP',
                say: ['Registrando aceptación de protección de datos…'],
                skipSay: true,
                gea: { enter: 'lopdp', afterLopdpNext: 'truncal_en_curso' },
            },
        },
        menuNode(
            'truncal_en_curso',
            'Truncal-inicio',
            '¿Tienes una asistencia en curso en este momento?',
            [
                { id: 'si', label: 'Sí', next: 'asistencias_en_curso' },
                { id: 'no', label: 'No', next: 'choose_plan' },
            ],
        ),
        menuNode(
            'choose_plan',
            '0. Inicio del bot',
            'Bienvenido. ¿Qué tipo de atención necesitas hoy?',
            [
                { id: 'plan_asist', label: 'Solución 24/7 (Asistencias)', next: 'menu_solucion_24_7' },
                { id: 'plan_aseg', label: 'Aseguradora ASAP', next: 'menu_aseguradora' },
                { id: 'plan_vip', label: 'Asistencias VIP', next: 'asistencias_vip' },
                { id: 'plan_prot', label: 'Servicios Protección', next: 'servicios_proteccion' },
                { id: 'plan_ia', label: 'IA Router (registro)', next: 'ia_router' },
                { id: 'plan_hsm', label: 'Simulador HSM (QA)', next: 'hsm_root' },
                { id: 'plan_utils', label: 'Utilidades / sistema', next: 'menu_utilidades' },
            ],
        ),
        menuNode(
            'menu_principal',
            'Truncal-inicio',
            'Menú principal. ¿Qué deseas hacer?',
            [
                { id: 'p_asist', label: 'Solución 24/7', next: 'menu_solucion_24_7' },
                { id: 'p_aseg', label: 'Aseguradora', next: 'menu_aseguradora' },
                { id: 'p_vip', label: 'VIP', next: 'asistencias_vip' },
                { id: 'p_prot', label: 'Protección', next: 'servicios_proteccion' },
                { id: 'p_hsm', label: 'HSM (QA)', next: 'hsm_root' },
            ],
        ),
        buildGeaNodes(),
    );
}

function buildSolucion247() {
    const hogar = buildServiceChains(
        ['Plomero', 'Electricista', 'Cerrajero', 'Vidriería', 'Limpieza y mantenimiento', 'Spa y peluquería', 'Handyman'],
        '2.3 Hogar',
    );
    const vial = buildServiceChains(
        ['Grúa', 'Cambio de llanta', 'Suministro de gasolina', 'Paso de corriente', 'Cerrajería de puertas', 'Inspector in situ'],
        '2.4 Vial',
    );
    const medicoAsist = buildServiceChains(['Ambulancia', 'Médico a domicilio'], '2.2 Médico');

    const dentalWiz = wizardTextSteps(
        [
            { prompt: '¿Para qué fecha deseas la cita dental? (ej: 25/09/2026)' },
            { prompt: '¿En qué ciudad?' },
        ],
        '2.1.1 Agendar cita',
    );

    return merge(
        menuNode(
            'menu_solucion_24_7',
            '2. Servicios Solución 24/7',
            'Solución 24/7. ¿Cuál de estos servicios necesitas?',
            [
                { id: 'dental', label: 'Dental', next: 'menu_dental' },
                { id: 'medico', label: 'Médico', next: 'menu_medico' },
                { id: 'hogar', label: 'Hogar', next: 'menu_hogar' },
                { id: 'vial', label: 'Vial', next: 'menu_vial' },
                { id: 'otras', label: 'Otras soluciones', next: 'otras_soluciones' },
                { id: 'reportar', label: 'Reportar un problema', next: 'reportar_problema' },
                { id: 'vermas', label: 'Ver más opciones', next: 'ver_mas_opciones' },
                { id: 'main', label: 'Menú principal', next: 'menu_principal' },
            ],
        ),
        menuNode(
            'reagendar_asistencia',
            'reagendar asistencia',
            '¿Qué tipo de cita deseas reagendar?',
            [
                { id: 'den', label: 'Dental', next: 'omx_den_reag_start' },
                { id: 'med', label: 'Médico', next: 'omx_med_reag_start' },
                { id: 'back', label: '0. Salir del menú', next: 'menu_solucion_24_7' },
            ],
        ),
        menuNode(
            'menu_dental',
            '2.1 Dental',
            'Dental 🦷 ¿Qué deseas?',
            [
                { id: 'ag', label: 'Agendar cita', next: 'omx_den_cabina' },
                { id: 're', label: 'Reagendar cita', next: 'omx_den_reag_cabina' },
                { id: 'ia', label: 'Dental IA', next: 'dental_ia' },
                { id: 'back', label: '0. Salir del menú', next: 'menu_solucion_24_7' },
            ],
        ),
        menuNode(
            'agendar_cita_tipo',
            '2.1.1 Agendar cita',
            '¿Qué tipo de cita deseas agendar?',
            [
                { id: 'cd', label: '🦷 Cita dental', next: 'omx_den_cabina' },
                { id: 'cm', label: '👨🏻‍⚕️ Cita médica', next: 'omx_med_cabina' },
                { id: 'ia', label: 'Agendar cita IA', next: 'agendar_cita_ia' },
            ],
        ),
        dentalWiz,
        menuNode(
            'menu_medico',
            '2.2 Médico',
            'Médico 🏥 ¿Qué necesitas?',
            [
                { id: 'amb', label: 'Ambulancia', next: medicoAsist.actions[0].next },
                { id: 'ori', label: 'Orientación Médica Telf.', next: 'leaf_orientacion_medica' },
                { id: 'ag', label: 'Agendar cita médica', next: 'omx_med_cabina' },
                { id: 're', label: 'Reagendar cita médica', next: 'omx_med_reag_cabina' },
                { id: 'dom', label: 'Médico a domicilio', next: medicoAsist.actions[1].next },
                { id: 'nut', label: 'Bienestar y nutrición', next: 'bienestar_nutricion' },
                { id: 'edo', label: 'E-doctor', next: 'activar_edoctor_inicio' },
                { id: 'back', label: '0. Salir del menú', next: 'menu_solucion_24_7' },
            ],
        ),
        {
            leaf_orientacion_medica: stubRegistered('Orientación médica telefónica', '2.2 Médico'),
            bienestar_nutricion: stubRegistered('Bienestar y nutrición', '2.2.6 Bienestar y nutrición'),
        },
        menuNode(
            'menu_hogar',
            '2.3 Hogar',
            'Hogar 🏡 Elige el servicio:',
            [
                ...hogar.actions,
                { id: 'ia', label: 'Hogar IA', next: 'hogar_ia' },
                { id: 'back', label: '0. Salir del menú', next: 'menu_solucion_24_7' },
            ],
        ),
        hogar.nodes,
        medicoAsist.nodes,
        menuNode(
            'menu_vial',
            '2.4 Vial',
            'Vial 🚗 ¿Cuál servicio necesitas?',
            [
                ...vial.actions,
                { id: 'leg', label: 'Asistencia Legal Telf.', next: 'leaf_asistencia_legal_vial' },
                { id: 'ia', label: 'Vial IA', next: 'vial_ia' },
                { id: 'back', label: '0. Salir del menú', next: 'menu_solucion_24_7' },
            ],
        ),
        vial.nodes,
        { leaf_asistencia_legal_vial: stubRegistered('Asistencia legal telefónica', '2.4 Vial') },
        menuNode('otras_soluciones', '2.5 Otras Soluciones', 'Otras soluciones para ti:', [
            { id: 'go', label: 'Continuar', next: 'otras_soluciones_2' },
            { id: 'no', label: 'No', next: 'menu_solucion_24_7' },
        ]),
        { otras_soluciones_2: stubRegistered('Otras soluciones', 'Otras soluciones 2') },
        {
            reportar_problema: {
                jelou: '2.6 Reportar un problema',
                say: ['Cuéntanos el problema que tuviste:'],
                input: { next: 'reportar_problema_done', echoUser: true },
            },
            reportar_problema_done: stubRegistered('Reporte de problema', '2.6 Reportar un problema'),
        },
        menuNode('ver_mas_opciones', '2.7 Ver más opciones', 'Aquí te presentamos más opciones.', [
            { id: 'info', label: 'Info de asistencia', next: 'info_asistencia' },
            { id: 'comp', label: 'Comprar asistencia', next: 'comprar_asistencia' },
            { id: 'blog', label: 'Blog Solución 24/7', next: 'blog_solucion' },
            { id: 'back', label: '0. Salir del menú', next: 'menu_solucion_24_7' },
        ]),
        menuNode('info_asistencia', '2.7.1 Info de asistencia', 'Selecciona una opción:', [
            { id: 'sc', label: 'Servicio contratado', next: 'info_servicio_contratado' },
            { id: 'fac', label: 'Solicitar Factura', next: 'solicitar_factura' },
        ]),
        menuNode(
            'info_servicio_contratado',
            '2.7.1.1 Información de servicio contratado',
            '¿Qué línea de servicio consultas?',
            [
                { id: 'h', label: '🏡 Hogar', next: 'leaf_info_hogar' },
                { id: 'v', label: '🚙 Vial', next: 'leaf_info_vial' },
                { id: 'm', label: '👨🏻‍⚕️ Médico', next: 'leaf_info_medico' },
                { id: 'd', label: '🦷 Dental', next: 'leaf_info_dental' },
                { id: 'o', label: '📄 Otras asistencias', next: 'leaf_info_otras' },
            ],
        ),
        {
            leaf_info_hogar: stubRegistered('Info servicio Hogar', 'Información de servicio contratado'),
            leaf_info_vial: stubRegistered('Info servicio Vial', 'Información de servicio contratado'),
            leaf_info_medico: stubRegistered('Info servicio Médico', 'Información de servicio contratado'),
            leaf_info_dental: stubRegistered('Info servicio Dental', 'Información de servicio contratado'),
            leaf_info_otras: stubRegistered('Info otras asistencias', 'Información de servicio contratado'),
            solicitar_factura: stubRegistered('Solicitud de factura', '2.7.1.2 Solicitar factura'),
            blog_solucion: {
                jelou: '2.7.3 Blog Solución 24/7',
                say: ['Te compartimos contenido del blog Solución 24/7 (enlace simulado).'],
                actions: standardExitActions(),
            },
        },
        menuNode('comprar_asistencia', '2.7.2 Comprar un servicio de asistencia', '¿Qué deseas comprar?', [
            { id: 'd', label: '🦷 Dental', next: 'venta_asistencias' },
            { id: 'm', label: '🧑🏻‍⚕️ Médico', next: 'venta_asistencias' },
            { id: 'h', label: '🏠 Hogar', next: 'venta_asistencias' },
            { id: 'v', label: '🚗 Vial', next: 'venta_asistencias' },
            { id: 'o', label: '🛠️ Otras asistencias', next: 'venta_asistencias' },
            { id: 'back', label: 'Salir del menú', next: 'menu_solucion_24_7' },
        ]),
        menuNode('venta_asistencias', 'Venta Asistencias - Inicio', '¿Cómo prefieres continuar?', [
            { id: 'con', label: 'Contratar', next: 'venta_contratar' },
            { id: 'ase', label: 'Chatear con Asesor', next: 'derivacion_asesor' },
            { id: 'lla', label: 'Quiero llamar', next: 'derivacion_asesor' },
        ]),
        {
            venta_contratar: {
                jelou: 'Venta Asistencias - Contratar',
                skipSay: true,
                com: { enter: 'venta_contratar' },
            },
            venta_contratar_ok: {
                say: ['¿Qué deseas hacer ahora?'],
                actions: standardExitActions('menu_solucion_24_7'),
            },
            derivacion_asesor: {
                jelou: 'Derivación a asesor',
                say: ['Te conectamos con un asesor comercial.'],
                actions: [{ id: 'go', label: 'Solicitar contacto', next: 'derivacion_asesor_load' }],
            },
            derivacion_asesor_load: {
                skipSay: true,
                com: { enter: 'derivacion_asesor', afterDerivacion: 'menu_principal' },
            },
        },
    );
}

function buildAseguradora() {
    const asegExtra = {
        planAsistencia: 'ASEGURADORA',
        tipoServicio: 'VIAL',
        requiresPlaca: true,
    };
    const asegChains = buildServiceChains(
        ['Grúa', 'Cambio de llanta', 'Suministro de gasolina', 'Paso de corriente', 'Cerrajería para apertura'],
        'V2 Aseguradora - Inicio',
        'menu_aseguradora',
        asegExtra,
    );
    const plateNodes = {};
    const asegMenu = [];
    for (const action of asegChains.actions) {
        const plateId = `aseg_placa_${action.id}`;
        const cabId = `aseg_cab_${action.id}`;
        const valId = `aseg_val_${action.id}`;
        plateNodes[plateId] = {
            jelou: 'V2 Aseguradora - Inicio',
            say: ['Por favor envíame el número de la placa (ej: GYE1234).'],
            input: { field: 'plate', next: cabId },
        };
        plateNodes[cabId] = {
            skipSay: true,
            aseg: { enter: 'cabina_aseguradora', afterCabinaNext: valId },
        };
        plateNodes[valId] = {
            skipSay: true,
            aseg: { enter: 'consulta_placa_vial', afterOkNext: action.next },
        };
        asegMenu.push({ id: action.id, label: action.label, next: plateId });
    }

    return merge(
        menuNode(
            'menu_aseguradora',
            'V2 Aseguradora - Inicio',
            'Bienvenid@ a tu Solución Vial (Aseguradora). ¿Qué necesitas?',
            [
                ...asegMenu,
                { id: 'leg', label: 'Asistencia Legal', next: 'aseg_placa_legal' },
                { id: 'ins', label: 'Inspección vehícular', next: 'inspeccion' },
                { id: 'sin', label: 'Reportar un siniestro', next: 'menu_siniestro' },
                { id: 'main', label: 'Menú principal', next: 'menu_principal' },
            ],
        ),
        plateNodes,
        asegChains.nodes,
        {
            aseg_placa_legal: {
                jelou: 'V2 Aseguradora - Inicio',
                say: ['Por favor envíame el número de la placa (ej: GYE1234).'],
                input: { field: 'plate', next: 'aseg_legal_load' },
            },
            aseg_legal_load: {
                skipSay: true,
                aseg: {
                    enter: 'consulta_placa_vial',
                    afterOkNext: 'leaf_aseg_legal',
                },
            },
            leaf_aseg_legal: {
                jelou: 'V2 Aseguradora - Inicio',
                say: [
                    'Placa validada. Para asistencia legal un asesor continuará el caso por el canal oficial.',
                ],
                actions: standardExitActions('menu_aseguradora'),
            },
        },
        menuNode('menu_siniestro', 'Siniestro', 'Reporte de siniestro. Selecciona el tipo:', [
            { id: 'col', label: 'Colisión', next: 'siniestro_colision' },
            { id: 'rt', label: 'Robo Total', next: 'siniestro_robo_total' },
            { id: 'rp', label: 'Robo Parcial', next: 'siniestro_robo_parcial' },
            { id: 'post', label: 'Postergar', next: 'siniestro_postergar' },
            { id: 'back', label: 'Volver', next: 'menu_aseguradora' },
        ]),
        buildAseguradoraSiniestroNodes(),
    );
}

function buildComercial() {
    return merge(
        menuNode('asistencias_vip', '3 - Asistencias VIP - Inicio', 'Asistencias VIP:', [
            { id: 'si', label: 'Sí', next: 'vip_intro_load' },
            { id: 'no', label: 'No', next: 'menu_principal' },
        ]),
        {
            vip_intro_load: {
                jelou: '3 - Asistencias VIP - Inicio',
                skipSay: true,
                com: { enter: 'vip_info', afterVipInfo: 'vip_codigo' },
            },
            vip_codigo: {
                jelou: '3 - Asistencias VIP - Inicio',
                say: ['Ingresa el **código exclusivo** que recibiste (ej: VCX893).'],
                input: { next: 'vip_codigo_load', echoUser: true, comField: 'codigo_vip' },
            },
            vip_codigo_load: {
                skipSay: true,
                com: { enter: 'vip_codigo_stub', afterVipInfo: 'vip_registro_empresa' },
            },
            vip_registro_empresa: {
                say: ['Escribe el nombre de tu **empresa**.'],
                input: { next: 'vip_registro_cargo', echoUser: true, comField: 'empresa' },
            },
            vip_registro_cargo: {
                say: ['Escribe tu **cargo** en la empresa.'],
                input: { next: 'vip_registro_done', echoUser: true, comField: 'cargo' },
            },
            vip_registro_done: {
                say: [
                    '✅ Datos de registro VIP guardados en esta sesión.',
                    'La activación final (afiliación Omniax) se completa en WhatsApp con el mismo código.',
                ],
                actions: standardExitActions('menu_principal'),
            },
        },
        menuNode('servicios_proteccion', '4 - Servicios Protección - Inicio', 'Servicios de protección:', [
            { id: 'si', label: 'Sí', next: 'leaf_proteccion' },
            { id: 'no', label: 'No', next: 'menu_principal' },
        ]),
        { leaf_proteccion: stubRegistered('Servicios Protección', '4 - Servicios Protección - Inicio') },
        menuNode('activar_edoctor_inicio', 'Activar e-doctor - Inicio', 'E-Doctor:', [
            { id: 'plan', label: 'Adquirir plan', next: 'edoctor_registro' },
            { id: 'info', label: 'Quiero más info.', next: 'edoctor_info' },
        ]),
        {
            edoctor_info: stubRegistered('Más información E-Doctor', 'Activar e-doctor - Quiero Más Información'),
            edoctor_registro: {
                jelou: 'Activar e-doctor - Registrar Datos',
                say: ['Ingresa tu **correo electrónico**:'],
                input: { next: 'edoctor_pago_load', echoUser: true, comField: 'email_edoctor' },
            },
            edoctor_pago_load: {
                jelou: 'Activar e-doctor -  Solicitud de Pago',
                skipSay: true,
                com: {
                    enter: 'pay_checkout',
                    payProduct: 'edoctor',
                    afterPayOk: 'edoctor_confirm',
                    afterPayFail: 'activar_edoctor_inicio',
                },
            },
            edoctor_confirm: {
                jelou: 'Activar e-doctor - Confirmacion',
                say: [
                    'Cuando el pago se confirme, recibirás instrucciones para usar e-doctor.',
                    'App: bit.ly/app-e-doctor — Web: https://www.e-doctorgea.com/',
                ],
                actions: standardExitActions('menu_solucion_24_7'),
            },
        },
        menuNode('compra_viaja', 'Asis. Compra y Viaja Seguro - Inicio', 'Compra y viaja seguro:', [
            { id: 'go', label: 'Empezar', next: 'compra_viaja_pago_load' },
        ]),
        {
            compra_viaja_pago_load: {
                jelou: 'Asis. Compra y Viaja Seguro - Solicitud de Pago',
                skipSay: true,
                com: {
                    enter: 'pay_checkout',
                    payProduct: 'viaja',
                    afterPayOk: 'compra_viaja_ok',
                    afterPayFail: 'compra_viaja',
                },
            },
            compra_viaja_ok: {
                jelou: 'Asis. Compra y Viaja Seguro - Confirmación',
                say: ['Gracias. Tras el pago, tu activación se procesará como en WhatsApp.'],
                actions: standardExitActions('menu_solucion_24_7'),
            },
        },
        menuNode('asistencia_inmediata', 'Asistencia Inmediata - Inicio', 'Asistencia inmediata:', [
            { id: 'go', label: 'Continuar', next: 'inmediata_pago_load' },
        ]),
        {
            inmediata_pago_load: {
                jelou: 'Asistencia Inmediata - Solicitud de Pago',
                skipSay: true,
                com: {
                    enter: 'pay_checkout',
                    payProduct: 'inmediata',
                    afterPayOk: 'inmediata_ok',
                    afterPayFail: 'asistencia_inmediata',
                },
            },
            inmediata_ok: {
                jelou: 'Asistencia Inmediata - Confirmación',
                say: ['Tu solicitud de asistencia inmediata continúa tras confirmar el pago.'],
                actions: standardExitActions('menu_solucion_24_7'),
            },
        },
        menuNode('pycca', 'Asistencia Cuidado Familiar Pycca - Inicio', 'Cuidado familiar Pycca:', [
            { id: 'con', label: 'Contratar', next: 'leaf_pycca' },
            { id: 'lla', label: 'Quiero que me llamen', next: 'derivacion_asesor' },
        ]),
        { leaf_pycca: stubRegistered('Pycca', 'Asistencia Cuidado Familiar Pycca - Inicio') },
        menuNode('banco_bolivariano', 'Bco Bolivariano - Venta Asistencia - Inicio', 'Banco Bolivariano — venta:', [
            { id: 'on', label: 'Comprar online', next: 'leaf_banco' },
            { id: 'llam', label: 'Agendar una llamada', next: 'leaf_banco_llamada' },
        ]),
        {
            leaf_banco: stubRegistered('Venta Banco Bolivariano', 'Bco Bolivariano - Venta Asistencia - Inicio'),
            leaf_banco_llamada: stubRegistered('Llamada agendada', 'Bco Bolivariano - Venta Asistencia - Inicio'),
        },
        menuNode('jaher', 'Jaher - Inicio', 'Jaher:', [
            { id: 'go', label: 'Empezar', next: 'leaf_jaher' },
        ]),
        { leaf_jaher: stubRegistered('Jaher', 'Jaher - Inicio') },
    );
}

function buildUtils() {
    return merge(
        menuNode('menu_utilidades', 'Error General', 'Utilidades del sistema:', [
            { id: 'enc', label: 'Encuesta de satisfacción', next: 'gea_encuesta_id' },
            { id: 'ree', label: 'Reenviar evaluación (HSM)', next: 'gea_reeval_id' },
            { id: 'ecf', label: 'Confirmar evaluación', next: 'gea_eval_conf_id' },
            { id: 'ubi', label: 'Actualizar ubicación asistencia', next: 'gea_ubicacion_id' },
            { id: 'mant', label: 'Mantenimiento', next: 'mantenimiento' },
            { id: 'err', label: 'Error general', next: 'error_general' },
            { id: 'exp', label: 'Expiración sesión', next: 'expiracion' },
            { id: 'adios', label: 'Adiós', next: 'adios' },
            { id: 'des', label: 'Desvincular', next: 'desvincular' },
            { id: 'pma', label: 'PMA', next: 'pma' },
            { id: 'pma_r', label: 'PMA Retención', next: 'pma_retencion' },
            { id: 'prov', label: 'Menú oculto proveedores', next: 'menu_proveedores' },
            { id: 'dev', label: 'Dev / pruebas', next: 'menu_dev' },
            { id: 'com', label: 'Comercial (viaja / inmediata / pycca / banco)', next: 'menu_comercial_extra' },
        ]),
        {
            mantenimiento: {
                jelou: 'Mantenimiento',
                say: ['🔧 Lucy está en mantenimiento. Intenta más tarde.'],
                actions: [{ id: 'back', label: 'Volver', next: 'menu_utilidades' }],
            },
            error_general: {
                jelou: 'Error General',
                say: ['Ocurrió un error inesperado (simulado).'],
                actions: standardExitActions(),
            },
            expiracion: {
                jelou: 'Expiracion',
                say: ['Tu sesión expiró. Escribe "Empezar" para reiniciar.'],
                actions: [{ id: 'start', label: 'Empezar', next: 'auth_telefono' }],
            },
            adios: {
                jelou: 'Adios',
                say: ['Gracias por usar Lucy. ¡Hasta pronto!'],
                actions: [{ id: 'start', label: 'Empezar', next: 'auth_telefono' }],
            },
            desvincular: stubRegistered('Desvinculación', 'Desvincular', 'menu_utilidades'),
            pma: stubRegistered('PMA', 'PMA', 'menu_utilidades'),
            pma_retencion: stubRegistered('PMA Retención', 'PMA - Retención', 'menu_utilidades'),
        },
        menuNode('menu_proveedores', 'Menú oculto proveedores', 'Proveedor:', [
            { id: 'c', label: 'Marcación de contacto', next: 'gea_prov_contacto_id' },
            { id: 't', label: 'Marcación de término', next: 'gea_prov_termino_id' },
            { id: 'f', label: 'Ingreso de fotografías', next: 'leaf_prov_fotos' },
        ]),
        {
            leaf_prov_fotos: stubRegistered('Fotos proveedor', 'Menú oculto proveedores'),
        },
        menuNode('menu_dev', 'Dev Gea', 'Entorno de desarrollo:', [
            { id: 'd1', label: 'Dev Gea', next: 'leaf_dev_gea' },
            { id: 'd2', label: 'pruebas Lucy', next: 'leaf_pruebas' },
            { id: 'd3', label: 'PMA equipo Lucy', next: 'leaf_pma_equipo' },
        ]),
        {
            leaf_dev_gea: stubRegistered('Dev Gea', 'Dev Gea'),
            leaf_pruebas: stubRegistered('Pruebas Lucy', 'pruebas Lucy'),
            leaf_pma_equipo: stubRegistered('PMA equipo', 'PMA - equipo lucy'),
        },
        menuNode('menu_comercial_extra', 'Información', 'Productos adicionales:', [
            { id: 'cv', label: 'Compra y viaja seguro', next: 'compra_viaja' },
            { id: 'ai', label: 'Asistencia inmediata', next: 'asistencia_inmediata' },
            { id: 'py', label: 'Pycca', next: 'pycca' },
            { id: 'bb', label: 'Banco Bolivariano', next: 'banco_bolivariano' },
            { id: 'jh', label: 'Jaher', next: 'jaher' },
            { id: 'inf', label: 'Información productos', next: 'info_productos' },
        ]),
        {
            info_productos: stubRegistered('Información productos', 'Informacion productos'),
        },
        menuNode('ia_router', 'IA Router', 'IA Router — ¿Cómo deseas continuar?', [
            { id: 'reg', label: 'Registro', next: 'auth_telefono' },
            { id: 'terms', label: 'Aceptar términos IA', next: 'ia_router_terms_load' },
            { id: 'sin', label: 'Sin registro', next: 'choose_plan' },
        ]),
    );
}

function buildHsm() {
    const nodes = {
        hsm_root: {
            jelou: 'HSM (plantillas)',
            say: [
                'Simulador de entradas HSM (mensajes que en WhatsApp llegan por plantilla).',
                'Elige una categoría:',
            ],
            actions: HSM_CATEGORIES.map((c) => ({
                id: c.id,
                label: c.label,
                next: c.id,
            })),
        },
    };

    for (const cat of HSM_CATEGORIES) {
        nodes[cat.id] = {
            jelou: cat.label,
            say: [`Categoría: ${cat.label}`],
            actions: [
                ...cat.items.map((name) => ({
                    id: `hsm_${slugify(name)}`,
                    label: name.length > 36 ? `${name.slice(0, 33)}…` : name,
                    next: `hsm_item_${slugify(name)}`,
                })),
                { id: 'back', label: '← Categorías HSM', next: 'hsm_root' },
            ],
        };
        for (const name of cat.items) {
            const id = `hsm_item_${slugify(name)}`;
            const actions = [
                { id: 'si', label: 'Sí', next: 'hsm_leaf_ok' },
                { id: 'no', label: 'No', next: 'hsm_leaf_ok' },
                { id: 'emp', label: 'Empezar', next: 'hsm_leaf_ok' },
                { id: 'back', label: '← Volver', next: cat.id },
            ];
            nodes[id] = {
                jelou: name,
                say: [
                    `📩 **[Simulación HSM]**`,
                    `Flujo Jelou: ${name}`,
                    'En WhatsApp este mensaje abriría la webview o continuaría en chat.',
                    'Responde como lo haría el usuario en la plantilla:',
                ],
                actions,
            };
        }
    }
    nodes.hsm_leaf_ok = {
        jelou: 'HSM',
        say: ['✅ Respuesta registrada (simulación).'],
        actions: [
            { id: 'hsm', label: 'Más HSM', next: 'hsm_root' },
            { id: 'menu', label: 'Menú principal', next: 'menu_principal' },
        ],
    };
    return nodes;
}

/** Grafo completo navegable (sin APIs) */
export const LUCY_FLOW_NODES = merge(
    buildCore(),
    buildSolucion247(),
    buildAseguradora(),
    buildComercial(),
    buildUtils(),
    buildHsm(),
    buildIaNodes(),
    buildOmniaxMedicoNodes(),
    buildOmniaxDentalNodes(),
);

export const LUCY_ENTRY_NODE = 'auth_telefono';

export const JELOU_SKILL_INDEX = Object.values(LUCY_FLOW_NODES)
    .map((n) => n.jelou)
    .filter(Boolean);
