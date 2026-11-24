import { useCallback, useEffect, useState } from 'react';
import Tooltip from '../Tooltip/Tooltip';
import {
    IconoFlechaDerecha,
    IconoFlechaIzquierda,
    IconoPausa,
    IconoReproducir,
} from '../Iconos/Iconos';
import estilos from './Carrusel.module.css';

const detectarMovimientoReducido = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

function Carrusel({
    diapositivas = [],
    intervaloMs = 6000,
    etiquetaAria = 'Galería visual de Cafeto',
}) {
    const [indice, setIndice] = useState(0);
    const [prefiereMenosMovimiento, setPrefiereMenosMovimiento] = useState(detectarMovimientoReducido);
    const [pausado, setPausado] = useState(detectarMovimientoReducido);
    const [enHoverOFoco, setEnHoverOFoco] = useState(false);

    const total = diapositivas.length;
    const indiceSeguro = total > 0 ? indice % total : 0;

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return undefined;
        const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
        const alCambiar = (evento) => {
            setPrefiereMenosMovimiento(evento.matches);
            if (evento.matches) setPausado(true);
        };
        consulta.addEventListener('change', alCambiar);
        return () => consulta.removeEventListener('change', alCambiar);
    }, []);

    const irA = useCallback((nuevoIndice) => {
        if (total === 0) return;
        setIndice(((nuevoIndice % total) + total) % total);
    }, [total]);

    const irAnterior = useCallback(() => {
        irA(indiceSeguro - 1);
    }, [indiceSeguro, irA]);

    const irSiguiente = useCallback(() => {
        irA(indiceSeguro + 1);
    }, [indiceSeguro, irA]);

    useEffect(() => {
        if (pausado || enHoverOFoco || prefiereMenosMovimiento || total <= 1) {
            return undefined;
        }
        const temporizador = setInterval(() => {
            setIndice((actual) => (actual + 1) % total);
        }, intervaloMs);
        return () => clearInterval(temporizador);
    }, [pausado, enHoverOFoco, prefiereMenosMovimiento, total, intervaloMs]);

    if (total === 0) {
        return null;
    }

    const manejarTeclado = (evento) => {
        if (evento.key === 'ArrowLeft') {
            evento.preventDefault();
            irAnterior();
        } else if (evento.key === 'ArrowRight') {
            evento.preventDefault();
            irSiguiente();
        }
    };

    const alternarPausa = () => {
        setPausado((previo) => !previo);
    };

    return (
        <section
            className={estilos.carrusel}
            aria-roledescription="carrusel"
            aria-label={etiquetaAria}
            tabIndex={0}
            onKeyDown={manejarTeclado}
            onMouseEnter={() => setEnHoverOFoco(true)}
            onMouseLeave={() => setEnHoverOFoco(false)}
            onFocus={() => setEnHoverOFoco(true)}
            onBlur={(evento) => {
                if (!evento.currentTarget.contains(evento.relatedTarget)) {
                    setEnHoverOFoco(false);
                }
            }}
        >
            <div className={estilos.visor}>
                <div
                    className={estilos.pista}
                    style={{ transform: `translateX(-${indiceSeguro * 100}%)` }}
                    aria-live={pausado ? 'polite' : 'off'}
                >
                    {diapositivas.map((slide, i) => (
                        <figure
                            key={slide.id || i}
                            className={estilos.diapositiva}
                            aria-hidden={i !== indiceSeguro}
                        >
                            <div className={estilos.marcoImagen}>
                                <img
                                    src={slide.imagen}
                                    alt={slide.alt}
                                    className={estilos.imagen}
                                    loading={i === 0 ? 'eager' : 'lazy'}
                                />
                            </div>
                            <figcaption className={estilos.pie}>
                                {slide.etiqueta && <span className={estilos.etiqueta}>{slide.etiqueta}</span>}
                                <strong className={estilos.titulo}>{slide.titulo}</strong>
                                {slide.descripcion && <p className={estilos.descripcion}>{slide.descripcion}</p>}
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>

            {total > 1 && (
                <div className={estilos.controles}>
                    <div className={estilos.navegacion}>
                        <Tooltip texto="Imagen anterior (flecha izquierda)" posicion="arriba">
                            <button
                                type="button"
                                className={estilos.botonFlecha}
                                onClick={irAnterior}
                                aria-label="Diapositiva anterior"
                            >
                                <IconoFlechaIzquierda size={20} />
                                <span className={estilos.textoFlecha}>Anterior</span>
                            </button>
                        </Tooltip>

                        <Tooltip texto="Imagen siguiente (flecha derecha)" posicion="arriba">
                            <button
                                type="button"
                                className={estilos.botonFlecha}
                                onClick={irSiguiente}
                                aria-label="Siguiente diapositiva"
                            >
                                <span className={estilos.textoFlecha}>Siguiente</span>
                                <IconoFlechaDerecha size={20} />
                            </button>
                        </Tooltip>
                    </div>

                    <div className={estilos.indicadores} role="group" aria-label="Elegir imagen">
                        {diapositivas.map((slide, i) => {
                            const esActual = i === indiceSeguro;
                            return (
                                <button
                                    key={slide.id || i}
                                    type="button"
                                    className={`${estilos.indicador} ${esActual ? estilos.indicadorActivo : ''}`}
                                    aria-label={`Ir a imagen ${i + 1}: ${slide.titulo}`}
                                    aria-current={esActual ? 'true' : undefined}
                                    onClick={() => irA(i)}
                                >
                                    <span className={estilos.punto} aria-hidden="true" />
                                </button>
                            );
                        })}
                        <span className={estilos.contador} aria-hidden="true">
                            {indiceSeguro + 1} / {total}
                        </span>
                    </div>

                    <button
                        type="button"
                        className={estilos.botonPausa}
                        onClick={alternarPausa}
                        aria-pressed={pausado}
                        aria-label={pausado ? 'Reanudar cambio automático de imágenes' : 'Pausar cambio automático de imágenes'}
                    >
                        {pausado ? <IconoReproducir size={16} /> : <IconoPausa size={16} />}
                        <span>{pausado ? 'Reanudar' : 'Pausar'}</span>
                    </button>
                </div>
            )}
        </section>
    );
}

export default Carrusel;
