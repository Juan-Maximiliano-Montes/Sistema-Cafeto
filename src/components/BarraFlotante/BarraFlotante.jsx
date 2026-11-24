import { useEffect, useState } from 'react';
import Tooltip from '../Tooltip/Tooltip';
import { IconoActualizar, IconoSubir } from '../Iconos/Iconos';
import estilos from './BarraFlotante.module.css';

function BarraFlotante({
    onActualizar,
    actualizando = false,
    etiquetaActualizar = 'Actualizar los datos en pantalla',
}) {
    const [mostrarSubir, setMostrarSubir] = useState(false);

    useEffect(() => {
        const alHacerScroll = () => {
            setMostrarSubir(window.scrollY > 260);
        };

        alHacerScroll();
        window.addEventListener('scroll', alHacerScroll, { passive: true });
        return () => window.removeEventListener('scroll', alHacerScroll);
    }, []);

    if (!onActualizar && !mostrarSubir) {
        return null;
    }

    const subirArriba = () => {
        const sinAnimacion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        window.scrollTo({ top: 0, behavior: sinAnimacion ? 'auto' : 'smooth' });
    };

    return (
        <aside className={estilos.barra} aria-label="Accesos rápidos de navegación">
            {onActualizar && (
                <Tooltip texto={etiquetaActualizar} posicion="arriba">
                    <button
                        type="button"
                        className={estilos.boton}
                        onClick={onActualizar}
                        disabled={actualizando}
                        aria-label={etiquetaActualizar}
                    >
                        <span className={actualizando ? estilos.girando : ''}>
                            <IconoActualizar size={18} />
                        </span>
                        <span className={estilos.textoBoton}>
                            {actualizando ? 'Actualizando...' : 'Actualizar'}
                        </span>
                    </button>
                </Tooltip>
            )}

            {mostrarSubir && (
                <Tooltip texto="Volver al principio de esta página" posicion="arriba">
                    <button
                        type="button"
                        className={`${estilos.boton} ${estilos.botonSubir}`}
                        onClick={subirArriba}
                        aria-label="Subir al inicio de la página"
                    >
                        <IconoSubir size={18} />
                        <span className={estilos.textoBoton}>Subir</span>
                    </button>
                </Tooltip>
            )}
        </aside>
    );
}

export default BarraFlotante;
