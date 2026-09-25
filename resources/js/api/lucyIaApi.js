import axios from 'axios';

const http = axios.create({
    baseURL: '/api/v1/lucy/ia',
    headers: { Accept: 'application/json' },
});

export function bootstrapIa(profile) {
    return http.post('/bootstrap', { profile }).then((r) => r.data);
}

export function sendIaMessage(payload) {
    return http.post('/message', payload).then((r) => r.data);
}

export function registerIaRouterTerms(payload) {
    return axios
        .post('/api/v1/jelou/datum/ia-router/terms', payload, { headers: { Accept: 'application/json' } })
        .then((r) => r.data);
}
