import { flushSync } from 'react-dom';

/**
 * Ejecuta la navegación dentro de la View Transitions API nativa cuando el
 * navegador la soporta y el usuario no pidió movimiento reducido.
 * Funciona con BrowserRouter sin requerir migración a Data Router.
 */
export function navegarConTransicion(navigate, destino, opciones) {
    if (
        typeof document !== 'undefined' &&
        typeof document.startViewTransition === 'function' &&
        !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    ) {
        document.startViewTransition(() => {
            flushSync(() => {
                navigate(destino, opciones);
            });
        });
        return;
    }
    navigate(destino, opciones);
}
