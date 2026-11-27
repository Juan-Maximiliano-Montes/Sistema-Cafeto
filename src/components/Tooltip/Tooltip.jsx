import { cloneElement, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import estilos from './Tooltip.module.css';

const CLASES_ALINEACION = {
    inicio: estilos.alineacionInicio,
    centro: estilos.alineacionCentro,
    fin: estilos.alineacionFin,
};

function Tooltip({
    texto,
    atajo = '',
    children,
    posicion = 'arriba',
    alineacion = 'centro',
    esEtiqueta = false,
    retrasoMs = 160,
}) {
    const [abierto, setAbierto] = useState(false);
    const [ubicacionLocal, setUbicacionLocal] = useState(posicion);
    const [ajusteX, setAjusteX] = useState(0);
    const [coordsDerecha, setCoordsDerecha] = useState({ top: 0, left: 0 });
    const disparadorRef = useRef(null);
    const globoRef = useRef(null);
    const timerRef = useRef(null);
    const bloqueadoPorClickRef = useRef(false);
    const idTooltip = useId();

    const limpiarTimer = useCallback(() => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => () => limpiarTimer(), [limpiarTimer]);

    const recalcularPosicion = useCallback(() => {
        const disparador = disparadorRef.current;
        const globo = globoRef.current;
        if (!disparador || !globo) return;

        const rect = disparador.getBoundingClientRect();
        const anchoGlobo = globo.offsetWidth || 200;
        const altoGlobo = globo.offsetHeight || 40;
        const margen = 12;

        if (posicion === 'derecha') {
            const separacion = 10;
            if (rect.right + anchoGlobo + separacion <= window.innerWidth - margen) {
                const centroY = rect.top + rect.height / 2 - altoGlobo / 2;
                const top = Math.min(
                    Math.max(margen, centroY),
                    Math.max(margen, window.innerHeight - altoGlobo - margen)
                );
                setUbicacionLocal('derecha');
                setCoordsDerecha({ top, left: rect.right + separacion });
                return;
            }

            const ubicacionFallback = rect.top - altoGlobo - separacion < margen ? 'abajo' : 'arriba';
            const topFallback =
                ubicacionFallback === 'abajo'
                    ? Math.min(window.innerHeight - altoGlobo - margen, rect.bottom + separacion)
                    : Math.max(margen, rect.top - altoGlobo - separacion);
            const centroX = rect.left + rect.width / 2 - anchoGlobo / 2;
            const leftFallback = Math.min(
                Math.max(margen, centroX),
                Math.max(margen, window.innerWidth - anchoGlobo - margen)
            );
            setUbicacionLocal(ubicacionFallback);
            setCoordsDerecha({ top: topFallback, left: leftFallback });
            return;
        }

        const separacion = 8;
        let nuevaUbicacion = posicion === 'abajo' ? 'abajo' : 'arriba';
        if (nuevaUbicacion === 'arriba' && rect.top - altoGlobo - separacion < margen) {
            nuevaUbicacion = 'abajo';
        } else if (nuevaUbicacion === 'abajo' && rect.bottom + altoGlobo + separacion > window.innerHeight - margen) {
            nuevaUbicacion = 'arriba';
        }

        let leftEsperado = rect.left + rect.width / 2 - anchoGlobo / 2;
        if (alineacion === 'inicio') {
            leftEsperado = rect.left;
        } else if (alineacion === 'fin') {
            leftEsperado = rect.right - anchoGlobo;
        }

        const maxLeft = Math.max(margen, window.innerWidth - anchoGlobo - margen);
        const leftSeguro = Math.min(Math.max(margen, leftEsperado), maxLeft);

        setUbicacionLocal(nuevaUbicacion);
        setAjusteX(Math.round(leftSeguro - leftEsperado));
    }, [posicion, alineacion]);

    useLayoutEffect(() => {
        if (!abierto) return;
        recalcularPosicion();
    }, [abierto, texto, atajo, recalcularPosicion]);

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

    const contenidoHijo =
        !esEtiqueta && isValidElement(children)
            ? cloneElement(children, {
                  'aria-describedby': children.props['aria-describedby']
                      ? `${children.props['aria-describedby']} ${idTooltip}`
                      : idTooltip,
              })
            : children;

    const alEntrarMouse = () => {
        if (bloqueadoPorClickRef.current) return;
        limpiarTimer();
        if (retrasoMs <= 0) {
            setAbierto(true);
            return;
        }
        timerRef.current = window.setTimeout(() => {
            setAbierto(true);
        }, retrasoMs);
    };

    const alSalirMouse = () => {
        limpiarTimer();
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
            limpiarTimer();
            setAbierto(true);
        }
    };

    const alPerderFoco = () => {
        limpiarTimer();
        setAbierto(false);
    };

    const alPresionarPuntero = () => {
        limpiarTimer();
        if (!esEtiqueta) {
            bloqueadoPorClickRef.current = true;
            setAbierto(false);
        }
    };

    const alHacerClick = () => {
        limpiarTimer();
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

    const claseAlineacion = CLASES_ALINEACION[alineacion] || estilos.alineacionCentro;
    const contenidoGlobo = (
        <span className={estilos.contenidoGlobo}>
            <span>{texto}</span>
            {atajo && <kbd className="iris-keycap">{atajo}</kbd>}
        </span>
    );

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
            {!abierto ? (
                <span id={idTooltip} role="tooltip" className={estilos.ocultoAccesible}>
                    {atajo ? `${texto} (${atajo})` : texto}
                </span>
            ) : posicion === 'derecha' && typeof document !== 'undefined' ? (
                createPortal(
                    <span
                        ref={globoRef}
                        id={idTooltip}
                        role="tooltip"
                        className={`${estilos.globo} ${estilos.globoDerecha}`}
                        style={{
                            top: `${coordsDerecha.top}px`,
                            left: `${coordsDerecha.left}px`,
                        }}
                    >
                        {contenidoGlobo}
                    </span>,
                    document.body
                )
            ) : (
                <span
                    ref={globoRef}
                    id={idTooltip}
                    role="tooltip"
                    className={`${estilos.globo} ${
                        ubicacionLocal === 'abajo' ? estilos.abajo : estilos.arriba
                    } ${claseAlineacion}`}
                    style={{ '--ajuste-x': `${ajusteX}px` }}
                >
                    {contenidoGlobo}
                </span>
            )}
        </span>
    );
}

export default Tooltip;
