/** Ajusta --keyboard-offset para que el dock no quede tapado por el teclado virtual. */
export function bindMobileKeyboardInset() {
    if (typeof window === 'undefined') return () => {};

    const root = document.documentElement;

    function apply() {
        const vv = window.visualViewport;
        if (!vv) {
            root.style.setProperty('--keyboard-offset', '0px');
            return;
        }
        const gap = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
        root.style.setProperty('--keyboard-offset', gap > 40 ? `${gap}px` : '0px');
    }

    apply();
    window.visualViewport?.addEventListener('resize', apply);
    window.visualViewport?.addEventListener('scroll', apply);

    return () => {
        window.visualViewport?.removeEventListener('resize', apply);
        window.visualViewport?.removeEventListener('scroll', apply);
        root.style.setProperty('--keyboard-offset', '0px');
    };
}

export function scrollFieldIntoView(el) {
    if (!el || typeof el.scrollIntoView !== 'function') return;
    requestAnimationFrame(() => {
        window.setTimeout(() => {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 320);
    });
}
