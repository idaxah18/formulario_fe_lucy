/**
 * Valida continuidad del grafo Lucy (next / input.next / actions.next).
 */
import { LUCY_FLOW_NODES, LUCY_ENTRY_NODE } from '../resources/js/flows/lucy/lucyFlowGraph.js';

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
console.log('OK: sin referencias rotas.');
