import axios from 'axios';

const datum = axios.create({
    baseURL: '/api/v1/jelou/datum',
    headers: { Accept: 'application/json' },
});

const pay = axios.create({
    baseURL: '/api/v1/jelou/pay',
    headers: { Accept: 'application/json' },
});

function unwrap(response) {
    const body = response.data;
    if (body?.ok === false && !body?.simulated) {
        const err = new Error(body.message || 'Error comercial');
        err.response = response;
        throw err;
    }
    return body;
}

export function fetchVentaLead(identificacion) {
    return datum.get('/venta/lead', { params: { identificacion } }).then(unwrap);
}

export function marcarVentaContrato(rowId, userId = '') {
    return datum.post('/venta/contrato', { row_id: rowId, user_id: userId }).then(unwrap);
}

export function crearDerivacionLead(payload) {
    return datum.post('/derivacion', payload).then(unwrap);
}

export function createPayCheckoutLink(payload) {
    return pay.post('/checkout-link', payload).then(unwrap);
}
