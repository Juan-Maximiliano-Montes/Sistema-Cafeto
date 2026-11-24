import { useEffect, useId, useRef, useState } from 'react';
import { IconoChevron, IconoEstadoOk } from '../Iconos/Iconos';
import estilos from './MenuDesplegable.module.css';

function MenuDesplegable({
    disparador,
    etiquetaAria,
    alineacion = 'derecha',
    encabezado,
    opciones = [],
    claseBoton = '',
}) {
    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef(null);
    const botonRef = useRef(null);
    const listaRef = useRef(null);
    const idMenu = useId();

    useEffect(() => {
        if (!abierto) return;

        const alHacerClickAfuera = (evento) => {
            if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
                setAbierto(false);
            }
        };

        const alPresionarTecla = (evento) => {
            if (evento.key === 'Escape') {
                setAbierto(false);
                botonRef.current?.focus();
            }
        };

        document.addEventListener('pointerdown', alHacerClickAfuera);
        document.addEventListener('keydown', alPresionarTecla);

        return () => {
            document.removeEventListener('pointerdown', alHacerClickAfuera);
            document.removeEventListener('keydown', alPresionarTecla);
        };
    }, [abierto]);

    const manejarTeclasPanel = (evento) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(evento.key)) return;
        const elementos = Array.from(listaRef.current?.querySelectorAll('[role="menuitem"]') || []);
        if (elementos.length === 0) return;

        evento.preventDefault();
        const indiceActual = elementos.indexOf(document.activeElement);

        if (evento.key === 'Home') {
            elementos[0].focus();
            return;
        }
        if (evento.key === 'End') {
            elementos[elementos.length - 1].focus();
            return;
        }
        const direccion = evento.key === 'ArrowDown' ? 1 : -1;
        const siguiente = indiceActual === -1
            ? (direccion === 1 ? 0 : elementos.length - 1)
            : (indiceActual + direccion + elementos.length) % elementos.length;
        elementos[siguiente].focus();
    };

    const ejecutarOpcion = (opcion) => {
        setAbierto(false);
        opcion.onClick?.();
    };

    return (
        <div ref={contenedorRef} className={estilos.contenedor}>
            <button
                ref={botonRef}
                type="button"
                className={`${estilos.disparador} ${claseBoton}`}
                aria-expanded={abierto}
                aria-haspopup="menu"
                aria-controls={idMenu}
                aria-label={etiquetaAria}
                onClick={() => setAbierto((previo) => !previo)}
            >
                <span className={estilos.disparadorContenido}>{disparador}</span>
                <span className={`${estilos.flecha} ${abierto ? estilos.flechaAbierta : ''}`}>
                    <IconoChevron size={16} />
                </span>
            </button>

            <div
                ref={listaRef}
                id={idMenu}
                role="menu"
                aria-label={etiquetaAria}
                className={`${estilos.panel} ${alineacion === 'izquierda' ? estilos.izquierda : estilos.derecha}`}
                style={{
                    display: abierto ? 'block' : 'none',
                    opacity: abierto ? 1 : 0,
                }}
                onKeyDown={manejarTeclasPanel}
            >
                {encabezado && <div className={estilos.encabezado}>{encabezado}</div>}

                <ul className={estilos.lista}>
                    {opciones.map((opcion) => (
                        <li key={opcion.id} role="none" className={opcion.separadorAntes ? estilos.conSeparador : ''}>
                            {opcion.href ? (
                                <a
                                    href={opcion.href}
                                    target={opcion.externo ? '_blank' : undefined}
                                    rel={opcion.externo ? 'noreferrer' : undefined}
                                    role="menuitem"
                                    className={`${estilos.item} ${opcion.peligro ? estilos.peligro : ''}`}
                                    onClick={() => setAbierto(false)}
                                >
                                    {opcion.icono && <span className={estilos.icono}>{opcion.icono}</span>}
                                    <span className={estilos.textos}>
                                        <span className={estilos.etiqueta}>{opcion.etiqueta}</span>
                                        {opcion.descripcion && <span className={estilos.descripcion}>{opcion.descripcion}</span>}
                                    </span>
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    role="menuitem"
                                    className={`${estilos.item} ${opcion.activa ? estilos.activa : ''} ${opcion.peligro ? estilos.peligro : ''}`}
                                    onClick={() => ejecutarOpcion(opcion)}
                                >
                                    {opcion.icono && <span className={estilos.icono}>{opcion.icono}</span>}
                                    <span className={estilos.textos}>
                                        <span className={estilos.etiqueta}>{opcion.etiqueta}</span>
                                        {opcion.descripcion && <span className={estilos.descripcion}>{opcion.descripcion}</span>}
                                    </span>
                                    {opcion.activa && (
                                        <span className={estilos.marcaActiva} aria-label="Seleccionado">
                                            <IconoEstadoOk size={15} />
                                        </span>
                                    )}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default MenuDesplegable;
