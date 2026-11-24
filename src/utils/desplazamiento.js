export function desplazarAlInicioListado(elemento) {
    if (typeof window === 'undefined') return;
    const sinAnimacion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const behavior = sinAnimacion ? 'auto' : 'smooth';
    if (elemento?.scrollIntoView) {
        elemento.scrollIntoView({ behavior, block: 'start' });
    } else {
        window.scrollTo({ top: 0, left: 0, behavior });
    }
}
