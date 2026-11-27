import { useEffect, useRef } from 'react';

const esElementoEditable = (elemento) => {
    if (!elemento || !(elemento instanceof Element)) return false;
    if (elemento.isContentEditable) return true;
    const etiqueta = elemento.tagName;
    return etiqueta === 'INPUT' || etiqueta === 'TEXTAREA' || etiqueta === 'SELECT';
};

const normalizarCombo = (combo) =>
    String(combo || '')
        .toLowerCase()
        .split('+')
        .map((parte) => parte.trim())
        .filter(Boolean);

const coincideEvento = (evento, combo) => {
    const partes = normalizarCombo(combo);
    if (partes.length === 0) return false;

    const requiereCtrl = partes.includes('ctrl') || partes.includes('mod');
    const requiereAlt = partes.includes('alt');
    const requiereShift = partes.includes('shift');
    const teclaObjetivo = partes.find(
        (p) => p !== 'ctrl' && p !== 'meta' && p !== 'mod' && p !== 'alt' && p !== 'shift'
    );
    if (!teclaObjetivo) return false;

    const teclaEvento = String(evento.key || '').toLowerCase();
    const ctrlOMeta = evento.ctrlKey || evento.metaKey;

    if (requiereCtrl !== ctrlOMeta) return false;
    if (requiereAlt !== evento.altKey) return false;
    if (requiereShift && !evento.shiftKey) return false;

    return teclaEvento === teclaObjetivo;
};

/**
 * Registra atajos de teclado declarativos con protección automática cuando el
 * usuario está escribiendo en inputs/textareas/selects.
 *
 * Ejemplo:
 *   useAtajos({ 'ctrl+k': abrirBuscador, f1: abrirAyuda, '/': enfocarFiltro });
 */
export function useAtajos(mapaAtajos, { activo = true, permitirEnInputs = false } = {}) {
    const mapaRef = useRef(mapaAtajos);

    useEffect(() => {
        mapaRef.current = mapaAtajos;
    }, [mapaAtajos]);

    useEffect(() => {
        if (!activo || typeof window === 'undefined') return undefined;

        const alPresionarTecla = (evento) => {
            if (evento.defaultPrevented) return;
            const mapa = mapaRef.current;
            if (!mapa) return;

            const enInput = esElementoEditable(evento.target);

            for (const [combo, manejador] of Object.entries(mapa)) {
                if (typeof manejador !== 'function') continue;
                if (!coincideEvento(evento, combo)) continue;

                const partes = normalizarCombo(combo);
                const esGlobal =
                    partes.includes('ctrl') ||
                    partes.includes('mod') ||
                    partes.includes('escape') ||
                    partes.includes('f1');

                if (enInput && !permitirEnInputs && !esGlobal) {
                    continue;
                }

                evento.preventDefault();
                manejador(evento);
                return;
            }
        };

        window.addEventListener('keydown', alPresionarTecla);
        return () => window.removeEventListener('keydown', alPresionarTecla);
    }, [activo, permitirEnInputs]);
}
