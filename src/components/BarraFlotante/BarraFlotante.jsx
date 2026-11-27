import { useEffect, useState } from 'react';
import Tooltip from '../Tooltip/Tooltip';
import { IconoSubir } from '../Iconos/Iconos';
import estilos from './BarraFlotante.module.css';

const obtenerContenedorScroll = () => {
    if (typeof document === 'undefined') return null;
    return document.querySelector('[data-iris-lienzo="true"]');
};

function BarraFlotante() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const lienzo = obtenerContenedorScroll();
        const objetivo = lienzo || window;

        const alHacerScroll = () => {
            const scrollActual = lienzo ? lienzo.scrollTop : window.scrollY;
            setVisible(scrollActual > 240);
        };

        alHacerScroll();
        objetivo.addEventListener('scroll', alHacerScroll, { passive: true });
        return () => objetivo.removeEventListener('scroll', alHacerScroll);
    }, []);

    if (!visible) {
        return null;
    }

    const subirArriba = () => {
        const sinAnimacion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        const behavior = sinAnimacion ? 'auto' : 'smooth';
        const lienzo = obtenerContenedorScroll();
        if (lienzo) {
            lienzo.scrollTo({ top: 0, behavior });
        } else {
            window.scrollTo({ top: 0, behavior });
        }
    };

    return (
        <div className={estilos.contenedor}>
            <Tooltip texto="Volver arriba" posicion="arriba">
                <button
                    type="button"
                    className={estilos.botonSubir}
                    onClick={subirArriba}
                    aria-label="Volver arriba"
                >
                    <IconoSubir size={18} />
                </button>
            </Tooltip>
        </div>
    );
}

export default BarraFlotante;
