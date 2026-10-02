import { formatHora12LabelFrom24, normalizeToOmniaxHora24 } from './omniaxHoraFormat.js';

const URL_RE = /https?:\/\/[^\s)>\]]+/gi;

export function extractUrls(text) {
    if (!text) return [];
    const matches = String(text).match(URL_RE) || [];
    return [...new Set(matches.map((u) => u.replace(/[).,]+$/, '')))];
}

export function stripUrls(text) {
    return String(text || '')
        .replace(/\s*\(?https?:\/\/[^\s)]+\)?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function formatFechaDisplay(isoDate) {
    if (!isoDate) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate).trim());
    if (!m) return String(isoDate);
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.toLocaleDateString('es-EC', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function formatHoraDisplay(hora) {
    const h24 = normalizeToOmniaxHora24(hora) || String(hora || '').trim();
    if (!h24) return '';
    return formatHora12LabelFrom24(h24);
}

/**
 * @param {object} res Respuesta Omniax (noticias + data)
 * @param {object} data res.data
 */
export function buildOmniaxCitaConfirmPayload(res, data = {}, { kind = 'crear' } = {}) {
    const noticias = res?.noticias || {};
    const titulo =
        String(noticias.titulo || '').trim() ||
        (kind === 'reagendar' ? 'Cita reagendada' : '¡Cita confirmada!');
    const mensaje =
        String(noticias.mensaje || '').trim() ||
        (kind === 'reagendar'
            ? 'Tu cita se actualizó correctamente.'
            : 'La asistencia ha sido creada satisfactoriamente.');

    const ubicacionRaw = data.establecimiento_y_url || data.proveedor || '';
    const ubicacionUrls = extractUrls(ubicacionRaw);
    const ubicacionTexto = stripUrls(ubicacionRaw) || stripUrls(mensaje);

    const seguimientoUrl =
        data.url_monitoreo ||
        data.url_seguimiento ||
        ubicacionUrls[0] ||
        extractUrls(mensaje)[0] ||
        null;

    const mapaUrl =
        ubicacionUrls[0] ||
        (seguimientoUrl && seguimientoUrl.includes('/mapa/') ? seguimientoUrl : null);

    const fecha = data.fecha || '';
    const hora = data.hora || '';
    const fechaLabel = formatFechaDisplay(fecha);
    const horaLabel = formatHoraDisplay(hora);

    return {
        kind,
        titulo,
        mensaje: stripUrls(mensaje) || mensaje,
        ubicacionTexto,
        mapaUrl,
        seguimientoUrl,
        fecha,
        fechaLabel,
        hora,
        horaLabel,
        recordatorio: 'Por favor acude 15 minutos antes. No olvides llevar tu cédula.',
        summaryLine: [titulo, fechaLabel && horaLabel ? `${fechaLabel} · ${horaLabel}` : '']
            .filter(Boolean)
            .join(' — '),
    };
}

export function botOmniaxCitaConfirm(res, data = {}, options = {}) {
    const confirm = buildOmniaxCitaConfirmPayload(res, data, options);
    return {
        role: 'bot',
        layout: 'omniax_cita_confirm',
        confirm,
        text: confirm.summaryLine || confirm.mensaje,
        at: new Date(),
    };
}
