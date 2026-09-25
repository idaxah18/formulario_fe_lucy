/** Devuelve nombre de icono lógico para una opción de menú */
export function resolveMenuIcon(action) {
    const blob = `${action.id || ''} ${action.label || ''}`.toLowerCase();

    if (action.type === 'location' || blob.includes('ubicación') || blob.includes('ubicacion')) return 'map-pin';
    if (blob.includes('menú principal') || blob.includes('menu principal') || blob.includes('volver')) return 'home';
    if (blob.includes('salir') || blob.includes('0.')) return 'arrow-left';
    if (blob.includes('dental') || blob.includes('médic') || blob.includes('medic') || blob.includes('salud')) return 'heart';
    if (blob.includes('grúa') || blob.includes('grua') || blob.includes('vehícul') || blob.includes('placa')) return 'truck';
    if (blob.includes('legal') || blob.includes('siniestro') || blob.includes('asegur')) return 'shield';
    if (blob.includes('vip')) return 'star';
    if (blob.includes('protección') || blob.includes('proteccion')) return 'lock-closed';
    if (blob.includes('hsm') || blob.includes('qa')) return 'beaker';
    if (blob.includes('asesor') || blob.includes('hablar')) return 'headset';
    if (blob.includes('24/7') || blob.includes('solución') || blob.includes('solucion') || blob.includes('asist')) return 'lifebuoy';
    if (blob.includes('sí') || blob === 'si') return 'check';
    if (blob.includes('no')) return 'x-mark';
    if (blob.includes('correo') || blob.includes('email')) return 'envelope';
    if (blob.includes('pago') || blob.includes('plan')) return 'credit-card';
    if (blob.includes('agendar') || blob.includes('cita')) return 'calendar';
    if (blob.includes('ia') || blob.includes('router')) return 'sparkles';
    if (/^\d+$/.test(String(action.label).trim())) return 'hashtag';

    return 'chevron-right';
}

const MENU_ICON_TONES = ['tone-blue', 'tone-gold', 'tone-green', 'tone-warm', 'tone-olive'];

export function menuIconTone(index) {
    return MENU_ICON_TONES[index % MENU_ICON_TONES.length];
}
