/**
 * Valida continuidad del grafo Lucy (next / input.next / actions.next).
 */
import { LUCY_FLOW_NODES, LUCY_ENTRY_NODE } from '../resources/js/flows/lucy/lucyFlowGraph.js';
import {
    isProcesoAutomaticoOnlyId,
    resolveGeaIdServicio,
    resolveIdServicioCrearGea,
} from '../resources/js/flows/lucy/gea/geaServiceIds.js';

const missing = [];
const visited = new Set();

function checkRef(from, ref) {
    if (!ref) return;
    if (!LUCY_FLOW_NODES[ref]) {
        missing.push(`${from} → ${ref}`);
    }
}

for (const [id, node] of Object.entries(LUCY_FLOW_NODES)) {
    if (node.input?.next) checkRef(id, node.input.next);
    for (const a of node.actions || []) {
        if (a.next) checkRef(id, a.next);
    }
}

const queue = [LUCY_ENTRY_NODE];
while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const node = LUCY_FLOW_NODES[id];
    if (!node) continue;
    const nexts = new Set();
    if (node.input?.next) nexts.add(node.input.next);
    for (const a of node.actions || []) {
        if (a.next) nexts.add(a.next);
    }
    for (const n of nexts) queue.push(n);
}

console.log(`Nodos: ${Object.keys(LUCY_FLOW_NODES).length}`);
console.log(`Alcanzables desde ${LUCY_ENTRY_NODE}: ${visited.size}`);
if (missing.length) {
    console.error('Referencias rotas:');
    for (const m of missing) console.error('  ', m);
    process.exit(1);
}
const geaCrearIssues = [];
for (const [id, node] of Object.entries(LUCY_FLOW_NODES)) {
    if (node.gea?.enter !== 'cabina_gate') continue;
    const label = node.gea.serviceLabel;
    const crearId = resolveIdServicioCrearGea(label, node.gea.idServicio);
    if (!crearId) {
        geaCrearIssues.push(`${id}: sin id GEA para «${label || '?'}»`);
    } else if (isProcesoAutomaticoOnlyId(crearId)) {
        geaCrearIssues.push(`${id}: id proceso automático ${crearId} (label «${label}»)`);
    }
}

const autoLabels = [
    'Grúa por avería',
    'Cambio de llanta',
    'Suministro de gasolina',
    'Paso de corriente',
    'Cerrajería de puertas',
    'Plomero',
    'Electricista',
];
for (const label of autoLabels) {
    if (!resolveGeaIdServicio(label)) {
        geaCrearIssues.push(`automático+cabina: falta mapa GEA para «${label}»`);
    }
}

if (geaCrearIssues.length) {
    console.error('Crear GEA / cabina:');
    for (const m of geaCrearIssues) console.error('  ', m);
    process.exit(1);
}

console.log('OK: sin referencias rotas.');
console.log('OK: todos los nodos cabina_gate tienen id_servicio GEA válido.');
