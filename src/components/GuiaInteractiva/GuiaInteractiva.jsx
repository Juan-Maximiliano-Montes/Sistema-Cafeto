import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotificacion } from '../../hooks/useNotificacion';
import { IconoCerrar, IconoEstadoInfo } from '../Iconos/Iconos';
import estilos from './GuiaInteractiva.module.css';

const PASOS_POR_RUTA = {
    '/inicio': [
        {
            selector: 'aside[aria-label="Resumen rápido del turno"]',
            titulo: 'Resumen en vivo del turno',
            texto: 'Acá ves al instante cuántas cajas están abiertas, lo vendido hoy y si hay avisos pendientes. Tocá "Actualizar" cuando quieras refrescar los números.',
        },
        {
            selector: '[data-iris-tour="actualizar"]',
            titulo: 'Botón Actualizar en vivo',
            texto: 'Usá el botón "Actualizar" en esta vista (o la tecla R en listados) siempre que quieras traer los datos más recientes desde Django sin recargar el navegador.',
        },
        {
            selector: '[data-iris-tour="buscador"]',
            titulo: 'Paleta rápida (Ctrl+K)',
            texto: 'Presioná Ctrl+K desde cualquier vista para buscar pantallas, productos por código de barras o ejecutar acciones como cambiar el tema.',
        },
        {
            selector: '[data-iris-tour="notch"]',
            titulo: 'Notch central y notificaciones',
            texto: 'En el techo del lienzo viven el estado de cajas, las autorizaciones pendientes y los avisos del sistema. Si un mensaje es largo, el Notch se expande solo.',
            demostrarNotch: true,
        },
        {
            selector: '[data-iris-tour="rail"]',
            titulo: 'Menú lateral y accesibilidad',
            texto: 'Navegá entre módulos desde este rail soldado al marco. Abajo podés agrandar el texto (A+), cambiar a tema claro/oscuro y abrir tu menú de perfil.',
        },
    ],
    '/productos': [
        {
            selector: '[role="tablist"]',
            titulo: 'Secciones del catálogo',
            texto: 'Alterná entre la carta de Cafetería, la góndola de Minisúper y Stock interno (si tu perfil tiene permiso) usando estas pestañas soldadas.',
        },
        {
            selector: 'input[type="search"]',
            titulo: 'Búsqueda y código de barras (tecla /)',
            texto: 'Escribí nombre, rubro, marca o escaneá un código de barras. Presioná la tecla "/" en cualquier momento para enfocar este buscador sin usar el mouse.',
        },
        {
            selector: '[aria-label="Formato de visualización"]',
            titulo: 'Orden, stock y vista lista/tarjetas',
            texto: 'Cambiá entre vista compacta en lista o tarjetas visuales, ordená por precio o nombre y filtrá solo productos con stock disponible.',
        },
        {
            selector: '#contenido-principal',
            titulo: 'Ficha detallada y lotes FEFO',
            texto: 'Hacé clic en cualquier producto para abrir su ficha completa, copiar su código de barras con un clic y revisar qué lotes vencen primero.',
        },
    ],
    '/stock': [
        {
            selector: '[role="tablist"]',
            titulo: 'Alertas y Autorizaciones',
            texto: 'Usá estas pestañas para pasar de las alertas de vencimiento/faltante a los ajustes de stock pendientes de aprobación por doble control.',
        },
        {
            selector: 'input[type="search"]',
            titulo: 'Filtrado rápido de alertas (tecla /)',
            texto: 'Filtrá por Todas, Stock o Vencimientos y buscá por producto o número de lote. Con la tecla "R" podés refrescar la lista al instante.',
        },
        {
            selector: '[data-iris-tour="actualizar"]',
            titulo: 'Botón Actualizar (tecla R)',
            texto: 'Si otro compañero cargó mercadería o registró un ajuste desde otro equipo, tocá "Actualizar" (o presioná R) para refrescar alertas y autorizaciones al instante.',
        },
        {
            selector: '[data-iris-tour="notch"]',
            titulo: 'Confirmación en vivo en el Notch',
            texto: 'Cuando aprobás o rechazás un ajuste (dejando observación obligatoria al rechazar), el Notch te confirma la operación y actualiza el contador al instante.',
            demostrarNotch: true,
        },
    ],
    '/catalogo': [
        {
            selector: '[role="tablist"]',
            titulo: 'Marcas y Rubros',
            texto: 'Alterná entre el listado de Marcas y el de Rubros. Cada pestaña muestra el conteo actual sin recargar la página.',
        },
        {
            selector: 'input[type="search"]',
            titulo: 'Buscador instantáneo (tecla /)',
            texto: 'Buscá por nombre con "/" y, si el registro no existe, el estado vacío te ofrece crearlo directamente con ese mismo texto.',
        },
        {
            selector: '[data-iris-tour="actualizar"]',
            titulo: 'Botón Actualizar (tecla R)',
            texto: 'Tocá "Actualizar" o presioná la tecla R para traer al instante marcas o rubros recién cargados desde otro puesto.',
        },
        {
            selector: '#contenido-principal',
            titulo: 'Crear (N), editar y pausar rubros',
            texto: 'Presioná "N" para abrir el panel de alta (con validación onBlur, contador de caracteres y alerta de duplicados). En Rubros podés activar o pausar con un clic.',
        },
    ],
    '/cajas': [
        {
            selector: '#contenido-principal',
            titulo: 'Estado de cajas y avisos del día',
            texto: 'Revisá las cajas abiertas y las alertas operativas de la jornada. La apertura, el arqueo ciego y el cierre se auditan desde el panel completo de Django.',
        },
        {
            selector: '[data-iris-tour="notch"]',
            titulo: 'Monitoreo continuo desde el Notch',
            texto: 'Incluso cuando estés en otra pantalla, el chip del Notch superior te indica con un punto verde si hay cajas abiertas en el local.',
        },
    ],
    '/reportes': [
        {
            selector: '#contenido-principal',
            titulo: 'Radiografía del catálogo por sección',
            texto: 'Filtrá entre Todo el catálogo, Cafetería y Minisúper para analizar la distribución por rubros e indicadores clave en formato tabular.',
        },
        {
            selector: '[data-iris-tour="rail"]',
            titulo: 'Navegación y reportes exportables',
            texto: 'Desde esta vista también podés saltar al panel de Django si necesitás descargar gráficos en PDF o planillas Excel.',
        },
    ],
    '/perfil': [
        {
            selector: '#contenido-principal',
            titulo: 'Tu cuenta y estado de sesión',
            texto: 'Verificá tu rol efectivo y confirmá en vivo que tu sesión sigue activa contra el sistema central de Cafeto.',
        },
        {
            selector: 'input[type="search"]',
            titulo: 'Buscador de permisos (tecla /)',
            texto: 'Filtrá al instante qué permisos tenés habilitados directamente en esta app y cuáles se operan en el panel web completo.',
        },
    ],
};

const obtenerPasosRuta = (pathname) => {
    const limpia = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
    if (limpia === '/usuarios') return PASOS_POR_RUTA['/perfil'];
    if (limpia.startsWith('/productos/')) return PASOS_POR_RUTA['/productos'];
    return PASOS_POR_RUTA[limpia] || PASOS_POR_RUTA['/inicio'];
};

function GuiaInteractiva({ activo, onCerrar }) {
    const { pathname } = useLocation();
    const { notificar, cerrarAviso } = useNotificacion();
    const [indiceEstado, setIndiceEstado] = useState({ ruta: pathname, valor: 0 });
    const [rect, setRect] = useState(null);

    const pasos = obtenerPasosRuta(pathname);
    const indice = indiceEstado.ruta === pathname ? Math.min(indiceEstado.valor, pasos.length - 1) : 0;
    const setIndice = useCallback(
        (updater) => {
            setIndiceEstado((prev) => {
                const actual = prev.ruta === pathname ? prev.valor : 0;
                const nuevo = typeof updater === 'function' ? updater(actual) : updater;
                return { ruta: pathname, valor: nuevo };
            });
        },
        [pathname]
    );

    const paso = pasos[indice] || pasos[0];

    useEffect(() => {
        if (!activo) return undefined;

        const actualizarRect = () => {
            const el = document.querySelector(paso.selector);
            if (!el) {
                setRect(null);
                return;
            }
            const box = el.getBoundingClientRect();
            if (box.width === 0 || box.height === 0) {
                setRect(null);
                return;
            }
            setRect({
                top: Math.max(4, box.top - 4),
                left: Math.max(4, box.left - 4),
                width: Math.min(window.innerWidth - 8, box.width + 8),
                height: Math.min(window.innerHeight - 8, box.height + 8),
            });
        };

        const elObservado = document.querySelector(paso.selector);
        if (elObservado?.scrollIntoView) {
            elObservado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        actualizarRect();

        let observador = null;
        if (elObservado && typeof ResizeObserver !== 'undefined') {
            observador = new ResizeObserver(actualizarRect);
            observador.observe(elObservado);
        }
        window.addEventListener('resize', actualizarRect);
        window.addEventListener('scroll', actualizarRect, true);

        const alTecla = (evento) => {
            if (evento.key === 'Escape') {
                evento.preventDefault();
                onCerrar();
            } else if (evento.key === 'ArrowRight') {
                evento.preventDefault();
                setIndice((i) => Math.min(pasos.length - 1, i + 1));
            } else if (evento.key === 'ArrowLeft') {
                evento.preventDefault();
                setIndice((i) => Math.max(0, i - 1));
            }
        };

        window.addEventListener('keydown', alTecla);
        return () => {
            observador?.disconnect();
            window.removeEventListener('resize', actualizarRect);
            window.removeEventListener('scroll', actualizarRect, true);
            window.removeEventListener('keydown', alTecla);
        };
    }, [activo, paso.selector, pasos.length, onCerrar, setIndice]);

    useEffect(() => {
        if (!activo || !paso.demostrarNotch) return undefined;
        notificar({
            texto: 'Ejemplo en vivo: así se expanden las notificaciones largas dentro del Notch central. Pasá el mouse encima para pausar el temporizador.',
            tono: 'info',
            duracionMs: 8000,
        });
        return () => cerrarAviso();
    }, [activo, paso.demostrarNotch, notificar, cerrarAviso]);

    if (!activo) return null;

    const esPrimero = indice === 0;
    const esUltimo = indice === pasos.length - 1;

    const cerrarYLimpio = () => {
        setIndice(0);
        onCerrar();
    };

    return (
        <>
            {rect && (
                <div
                    className={estilos.foco}
                    style={{
                        top: `${rect.top}px`,
                        left: `${rect.left}px`,
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                    }}
                    aria-hidden="true"
                />
            )}

            <aside
                className={estilos.tarjeta}
                role="dialog"
                aria-modal="false"
                aria-label="Guía interactiva de Cafeto"
            >
                <div className={estilos.cabecera}>
                    <div className={estilos.meta}>
                        <span className={`${estilos.pasoBadge} iris-num`}>
                            Paso {indice + 1} de {pasos.length}
                        </span>
                        <span className={estilos.seguro}>
                            <IconoEstadoInfo size={13} />
                            <span>Guía de esta vista</span>
                        </span>
                    </div>
                    <button
                        type="button"
                        className={estilos.cerrar}
                        onClick={cerrarYLimpio}
                        aria-label="Salir de la guía interactiva"
                    >
                        <IconoCerrar size={16} />
                    </button>
                </div>

                <h2 className={estilos.titulo}>{paso.titulo}</h2>
                <p className={estilos.texto}>{paso.texto}</p>

                <div className={estilos.pie}>
                    <button
                        type="button"
                        className={estilos.botonSecundario}
                        disabled={esPrimero}
                        onClick={() => setIndice((i) => Math.max(0, i - 1))}
                    >
                        Anterior
                    </button>

                    <div className={estilos.puntos} aria-hidden="true">
                        {pasos.map((p, i) => (
                            <span
                                key={p.titulo}
                                className={`${estilos.punto} ${i === indice ? estilos.puntoActivo : ''}`}
                            />
                        ))}
                    </div>

                    {esUltimo ? (
                        <button type="button" className={estilos.botonPrincipal} onClick={cerrarYLimpio}>
                            Finalizar
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={estilos.botonPrincipal}
                            onClick={() => setIndice((i) => Math.min(pasos.length - 1, i + 1))}
                        >
                            Siguiente →
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}

export default GuiaInteractiva;
