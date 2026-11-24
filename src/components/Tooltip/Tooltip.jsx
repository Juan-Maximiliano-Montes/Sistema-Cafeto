import { cloneElement, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import estilos from './Tooltip.module.css';

function Tooltip({ texto, children, posicion = 'arriba', esEtiqueta = false }) {
    const [abierto, setAbierto] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, ubicacion: posicion });
    const disparadorRef = useRef(null);
    const globoRef = useRef(null);
    const idTooltip = useId();

    const recalcularPosicion = useCallback(() => {
        const disparador = disparadorRef.current;
        const globo = globoRef.current;
        if (!disparador || !globo) return;

        const rect = disparador.getBoundingClientRect();
        const anchoGlobo = globo.offsetWidth || 200;
        const altoGlobo = globo.offsetHeight || 40;
        const margen = 12;
        const separacion = 10;

        let ubicacion = posicion;
        if (ubicacion === 'arriba' && rect.top - altoGlobo - separacion < margen) {
            ubicacion = 'abajo';
        } else if (ubicacion === 'abajo' && rect.bottom + altoGlobo + separacion > window.innerHeight - margen) {
            ubicacion = 'arriba';
        }

        const top = ubicacion === 'abajo'
            ? Math.min(window.innerHeight - altoGlobo - margen, rect.bottom + separacion)
            : Math.max(margen, rect.top - altoGlobo - separacion);

        const centroX = rect.left + rect.width / 2 - anchoGlobo / 2;
        const left = Math.min(
            Math.max(margen, centroX),
            Math.max(margen, window.innerWidth - anchoGlobo - margen)
        );

        setCoords({ top, left, ubicacion });
    }, [posicion]);

    useLayoutEffect(() => {
        if (!abierto) return;
        recalcularPosicion();
    }, [abierto, texto, recalcularPosicion]);

    useEffect(() => {
        if (!abierto) return;

        const alPresionarTecla = (evento) => {
            if (evento.key === 'Escape') {
                setAbierto(false);
            }
        };

        const alTocarAfuera = (evento) => {
            if (disparadorRef.current && !disparadorRef.current.contains(evento.target)) {
                setAbierto(false);
            }
        };

        window.addEventListener('keydown', alPresionarTecla);
        window.addEventListener('pointerdown', alTocarAfuera);
        window.addEventListener('scroll', recalcularPosicion, true);
        window.addEventListener('resize', recalcularPosicion);

        return () => {
            window.removeEventListener('keydown', alPresionarTecla);
            window.removeEventListener('pointerdown', alTocarAfuera);
            window.removeEventListener('scroll', recalcularPosicion, true);
            window.removeEventListener('resize', recalcularPosicion);
        };
    }, [abierto, recalcularPosicion]);

    if (!texto) {
        return children;
    }

    const contenidoHijo = !esEtiqueta && isValidElement(children)
        ? cloneElement(children, {
            'aria-describedby': children.props['aria-describedby']
                ? `${children.props['aria-describedby']} ${idTooltip}`
                : idTooltip,
        })
        : children;

    const alHacerClick = () => {
        if (esEtiqueta) {
            setAbierto((previo) => !previo);
        }
    };

    const alPresionarEnEtiqueta = (evento) => {
        if (!esEtiqueta) return;
        if (evento.key === 'Enter' || evento.key === ' ') {
            evento.preventDefault();
            setAbierto((previo) => !previo);
        }
    };

    return (
        <span
            ref={disparadorRef}
            className={`${estilos.envoltura} ${esEtiqueta ? estilos.interactiva : ''}`}
            tabIndex={esEtiqueta ? 0 : undefined}
            aria-describedby={esEtiqueta ? idTooltip : undefined}
            onMouseEnter={() => setAbierto(true)}
            onMouseLeave={() => setAbierto(false)}
            onFocus={() => setAbierto(true)}
            onBlur={() => setAbierto(false)}
            onClick={alHacerClick}
            onKeyDown={alPresionarEnEtiqueta}
        >
            {contenidoHijo}
            <span
                ref={globoRef}
                id={idTooltip}
                role="tooltip"
                aria-hidden={!abierto}
                className={`${estilos.globo} ${coords.ubicacion === 'abajo' ? estilos.abajo : estilos.arriba}`}
                style={{
                    top: `${coords.top}px`,
                    left: `${coords.left}px`,
                    opacity: abierto ? 1 : 0,
                    visibility: abierto ? 'visible' : 'hidden',
                }}
            >
                {texto}
            </span>
        </span>
    );
}

export default Tooltip;
