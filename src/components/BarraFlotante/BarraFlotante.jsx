import { useEffect, useState } from 'react';
import Tooltip from '../Tooltip/Tooltip';
import { IconoSubir } from '../Iconos/Iconos';
import estilos from './BarraFlotante.module.css';

function BarraFlotante() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const alHacerScroll = () => {
            setVisible(window.scrollY > 240);
        };

        alHacerScroll();
        window.addEventListener('scroll', alHacerScroll, { passive: true });
        return () => window.removeEventListener('scroll', alHacerScroll);
    }, []);

    if (!visible) {
        return null;
    }

    const subirArriba = () => {
        const sinAnimacion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        window.scrollTo({ top: 0, behavior: sinAnimacion ? 'auto' : 'smooth' });
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
