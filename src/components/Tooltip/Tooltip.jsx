import { cloneElement, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import estilos from './Tooltip.module.css';

function Tooltip({ texto, children, posicion = 'arriba', esEtiqueta = false }) {
    const [abierto, setAbierto] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, ubicacion: posicion });
    const disparadorRef = useRef(null);
    const globoRef = useRef(null);
    const bloqueadoPorClickRef = useRef(false);
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
        let top = 0;
        let left = 0;

        if (ubicacion === 'derecha') {
            if (rect.right + anchoGlobo + separacion > window.innerWidth - margen) {
                ubicacion = 'arriba';
            } else {
                left = rect.right + separacion;
                const centroY = rect.top + rect.height / 2 - altoGlobo / 2;
                top = Math.min(
                    Math.max(margen, centroY),
                    Math.max(margen, window.innerHeight - altoGlobo - margen)
                );
                setCoords({ top, left, ubicacion });
                return;
            }
        }

        if (ubicacion === 'arriba' && rect.top - altoGlobo - separacion < margen) {
            ubicacion = 'abajo';
        } else if (ubicacion === 'abajo' && rect.bottom + altoGlobo + separacion > window.innerHeight - margen) {
            ubicacion = 'arriba';
        }

        top = ubicacion === 'abajo'
            ? Math.min(window.innerHeight - altoGlobo - margen, rect.bottom + separacion)
            : Math.max(margen, rect.top - altoGlobo - separacion);

        const centroX = rect.left + rect.width / 2 - anchoGlobo / 2;
        left = Math.min(
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

        const cerrarAlHacerScroll = () => {
            setAbierto(false);
        };

        window.addEventListener('keydown', alPresionarTecla);
        window.addEventListener('pointerdown', alTocarAfuera);
        window.addEventListener('scroll', cerrarAlHacerScroll, { capture: true, passive: true });
        window.addEventListener('resize', recalcularPosicion);

        return () => {
            window.removeEventListener('keydown', alPresionarTecla);
            window.removeEventListener('pointerdown', alTocarAfuera);
            window.removeEventListener('scroll', cerrarAlHacerScroll, true);
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

    const alEntrarMouse = () => {
        if (bloqueadoPorClickRef.current) return;
        setAbierto(true);
    };

    const alSalirMouse = () => {
        bloqueadoPorClickRef.current = false;
        setAbierto(false);
    };

    const alEnfocar = (evento) => {
        if (bloqueadoPorClickRef.current) return;
        let esFocoTeclado = true;
        try {
            esFocoTeclado = evento.target?.matches?.(':focus-visible') ?? false;
        } catch {
            esFocoTeclado = false;
        }
        if (esFocoTeclado) {
            setAbierto(true);
        }
    };

    const alPerderFoco = () => {
        setAbierto(false);
    };

    const alPresionarPuntero = () => {
        if (!esEtiqueta) {
            bloqueadoPorClickRef.current = true;
            setAbierto(false);
        }
    };

    const alHacerClick = () => {
        if (esEtiqueta) {
            setAbierto((previo) => !previo);
            return;
        }
        bloqueadoPorClickRef.current = true;
        setAbierto(false);
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
            onMouseEnter={alEntrarMouse}
            onMouseLeave={alSalirMouse}
            onFocus={alEnfocar}
            onBlur={alPerderFoco}
            onPointerDown={alPresionarPuntero}
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
