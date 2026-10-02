/**
 * Matriz estática: servicios GEA, cabina automático, nodos cabina_gate, gaps id_servicio.
 */
import { LUCY_FLOW_NODES, LUCY_ENTRY_NODE } from '../resources/js/flows/lucy/lucyFlowGraph.js';
import { resolveGeaIdServicio } from '../resources/js/flows/lucy/gea/geaServiceIds.js';
import { usesProcesoAutomatico } from '../resources/js/flows/lucy/gea/automaticoCatalog.js';

const AUTOMATIC_LABELS = [
    'Grúa por avería',
    'Cambio de llanta',
    'Suministro de gasolina',
    'Paso de corriente',
    'Cerrajería de puertas',
    'Plomero',
    'Electricista',
];
import {
    getAutomaticoEarlyQuestionPlan,
    getAutomaticoLateQuestionPlan,
} from '../resources/js/flows/lucy/gea/automaticoQuestions.js';

const GEA_MENU_LABELS = {
    vial: [
        'Grúa por avería',
        'Grúa (otro motivo)',
        'Cambio de llanta',
        'Suministro de gasolina',
        'Paso de corriente',
        'Cerrajería de puertas',
        'Inspector in situ',
        'Asistencia Legal telefónica',
    ],
    hogar: [
        'Plomero',
        'Electricista',
        'Cerrajero',
        'Vidriería',
        'Limpieza y mantenimiento',
        'Spa y peluquería',
        'Handyman',
    ],
    medico: [
        'Ambulancia',
        'Orientación médica telefónica',
        'Médico a domicilio',
        'Bienestar y nutrición',
    ],
    otras: ['Otras soluciones'],
};

function cabinaBranches(serviceLabel) {
    const early = getAutomaticoEarlyQuestionPlan(serviceLabel);
    const late = getAutomaticoLateQuestionPlan(serviceLabel);
    const out = [];
    for (const block of [...early, ...late]) {
        for (const a of block.actions || []) {
            if (a.cabina) {
                out.push({ step: block.id, answer: a.label });
            }
        }
    }
    return out;
}

const cabinaGateNodes = [];
const missingIdServicio = [];
for (const [id, node] of Object.entries(LUCY_FLOW_NODES)) {
    if (node.gea?.enter === 'cabina_gate') {
        const idS = node.gea.idServicio || resolveGeaIdServicio(node.gea.serviceLabel);
        cabinaGateNodes.push({
            node: id,
            serviceLabel: node.gea.serviceLabel,
            idServicio: idS,
            tipoServicio: node.gea.tipoServicio,
        });
        if (!idS) missingIdServicio.push({ node: id, serviceLabel: node.gea.serviceLabel });
    }
    if (id.startsWith('auto_cabina_crear_')) {
        const idS = node.gea?.idServicio;
        if (!idS) missingIdServicio.push({ node: id, serviceLabel: node.gea?.serviceLabel });
    }
}

const omniaxPrefixes = ['omx_den_', 'omx_med_'];
const omniaxNodes = Object.keys(LUCY_FLOW_NODES).filter((k) =>
    omniaxPrefixes.some((p) => k.startsWith(p)),
);

const report = {
    graphEntry: LUCY_ENTRY_NODE,
    nodeCount: Object.keys(LUCY_FLOW_NODES).length,
    cabinaGateCount: cabinaGateNodes.length,
    missingIdServicio,
    geaServices: {},
    automaticoCabinaBranches: {},
    omniaxNodeCount: omniaxNodes.length,
    omniaxMenuAnchors: omniaxNodes.filter((k) =>
        /_(start|elegibilidad_load|cabina|reag_|en_proceso)/.test(k),
    ),
};

for (const [segment, labels] of Object.entries(GEA_MENU_LABELS)) {
    const jelou = segment === 'vial' ? '2.4 Vial' : segment === 'hogar' ? '2.3 Hogar' : segment === 'medico' ? '2.2 Médico' : 'Otras soluciones 2';
    report.geaServices[segment] = labels.map((label) => ({
        label,
        automatico: usesProcesoAutomatico(label, jelou),
        idServicioGea: resolveGeaIdServicio(label),
        legacyCabinaChain: !usesProcesoAutomatico(label, jelou),
    }));
}

for (const label of AUTOMATIC_LABELS) {
    report.automaticoCabinaBranches[label] = {
        idServicioGea: resolveGeaIdServicio(label),
        cabinaAnswers: cabinaBranches(label),
    };
}

console.log(JSON.stringify(report, null, 2));
if (missingIdServicio.length) {
    console.error('\n⚠ Sin id_servicio GEA:', missingIdServicio.length);
    process.exit(1);
}
console.log('\nOK: todos los nodos cabina_gate tienen id_servicio (mapa o nodo).');
