/**
 * Flujo conversacional demo — Lucy Ecuador Aseguradora (ASAP).
 * Replica el hilo del PDF: placa → ubicación → confirmación → encuesta NPS.
 */

const PLATE_RE = /^(?:[A-Z]{3}\d{3,4}|[A-Z]{2}\d{3}[A-Z])$/i;

export function createAseguradoraChatState() {
    return {
        step: 'welcome',
        plate: '',
        location: null,
        npsScore: null,
        awaitingText: false,
        inputHint: '',
    };
}

export function getComposerPlaceholder(state) {
    if (!state.awaitingText) return 'Selecciona una opción o espera…';
    if (state.step === 'plate') {
        return 'Ej: GYE1234';
    }
    if (state.step === 'nps_comment') {
        return 'Escribe tu comentario…';
    }
    return 'Escribe un mensaje';
}

export function isComposerEnabled(state) {
    return state.awaitingText && !['nps_pick', 'done'].includes(state.step);
}

export function getQuickActions(state) {
    if (state.step === 'welcome') {
        return [{ id: 'start', label: 'Empezar' }];
    }
    if (state.step === 'location') {
        return [{ id: 'share_location', label: '📍 Compartir ubicación' }];
    }
    if (state.step === 'nps_pick') {
        return Array.from({ length: 11 }, (_, i) => ({
            id: `nps_${i}`,
            label: String(i),
        }));
    }
    return [];
}

function bot(text) {
    return { role: 'bot', text, at: new Date() };
}

function user(text) {
    return { role: 'user', text, at: new Date() };
}

/**
 * @returns {{ messages: object[], state: object, scroll: boolean }}
 */
export function reduceChat(state, messages, event) {
    const next = { ...state };
    let newMessages = [];

    if (event.type === 'init') {
        newMessages = [
            bot('Hola, soy ASAP, tu asistente virtual de Lucy Ecuador Aseguradora.'),
            bot('Te ayudaré a coordinar tu asistencia. Cuando estés listo, pulsa Empezar.'),
        ];
        next.awaitingText = false;
        return { state: next, messages: [...messages, ...newMessages], scroll: true };
    }

    if (event.type === 'quick' && event.action?.id === 'start' && next.step === 'welcome') {
        newMessages.push(user('Empezar'));
        newMessages.push(
            bot(
                'Por favor envíame el número de la placa de tu vehículo o moto.\n\nPor ejemplo: GYE1234 para vehículos / GA001A para motos',
            ),
        );
        next.step = 'plate';
        next.awaitingText = true;
        next.inputHint = 'plate';
        return { state: next, messages: [...messages, ...newMessages], scroll: true };
    }

    if (event.type === 'text' && next.step === 'plate') {
        const value = String(event.text || '').trim().toUpperCase();
        newMessages.push(user(value));
        if (!PLATE_RE.test(value)) {
            newMessages.push(
                bot(
                    'No he podido ingresar tu solicitud. Por favor ayúdame con la información solicitada.',
                ),
            );
            next.awaitingText = true;
            return { state: next, messages: [...messages, ...newMessages], scroll: true };
        }
        next.plate = value;
        newMessages.push(
            bot(
                `Hola, soy ASAP. Ya registramos tu solicitud de asistencia para la placa ${value}. En breve te compartiremos los siguientes pasos.`,
            ),
        );
        newMessages.push(
            bot(
                'Por favor compártenos tu ubicación actual para que podamos enviarte nuestra ayuda al punto exacto donde te encuentras.',
            ),
        );
        next.step = 'location';
        next.awaitingText = false;
        return { state: next, messages: [...messages, ...newMessages], scroll: true };
    }

    if (event.type === 'quick' && event.action?.id === 'share_location' && next.step === 'location') {
        return { state: next, messages, scroll: false, requestLocation: true };
    }

    if (event.type === 'location' && next.step === 'location') {
        next.location = event.coords;
        newMessages.push(user('📍 Ubicación compartida'));
        newMessages.push(
            bot(
                'Listo, tu ubicación para tu asistencia ha sido registrada. Soy ASAP y en breve te enviaré más detalles de tu servicio.',
            ),
        );
        newMessages.push(
            bot(
                'Antes de terminar, por favor ayúdanos a conocer tu experiencia con nuestros servicios.\n\n¿Qué tan probable es que recomiendes nuestra asistencia a un amigo o familiar? Califique del 0 al 10.',
            ),
        );
        next.step = 'nps_pick';
        next.awaitingText = false;
        return { state: next, messages: [...messages, ...newMessages], scroll: true };
    }

    if (event.type === 'quick' && next.step === 'nps_pick' && event.action?.id?.startsWith('nps_')) {
        const score = Number(event.action.id.replace('nps_', ''));
        next.npsScore = score;
        newMessages.push(user(String(score)));
        newMessages.push(bot('Por favor envíeme un comentario sobre su elección.'));
        next.step = 'nps_comment';
        next.awaitingText = true;
        return { state: next, messages: [...messages, ...newMessages], scroll: true };
    }

    if (event.type === 'text' && next.step === 'nps_comment') {
        newMessages.push(user(event.text));
        newMessages.push(
            bot(
                'En una escala del 1 al 5, donde 1 es malo y 5 excelente, ¿cómo calificarías la atención? (Responde con un número del 1 al 5)',
            ),
        );
        next.step = 'operator_rate';
        next.awaitingText = true;
        return { state: next, messages: [...messages, ...newMessages], scroll: true };
    }

    if (event.type === 'text' && next.step === 'operator_rate') {
        const n = Number(String(event.text).trim());
        if (n < 1 || n > 5 || Number.isNaN(n)) {
            newMessages.push(user(event.text));
            newMessages.push(bot('Por favor ingresa un número del 1 al 5.'));
            return { state: next, messages: [...messages, ...newMessages], scroll: true };
        }
        newMessages.push(user(String(n)));
        newMessages.push(bot('¡Gracias por tu tiempo! Si necesitas retomar el servicio, escribe Empezar nuevamente.'));
        next.step = 'done';
        next.awaitingText = false;
        return { state: next, messages: [...messages, ...newMessages], scroll: true };
    }

    return { state: next, messages, scroll: false };
}
