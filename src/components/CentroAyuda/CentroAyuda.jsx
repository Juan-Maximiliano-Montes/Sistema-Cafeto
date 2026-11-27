import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useNotificacion } from '../../hooks/useNotificacion';
import estilos from './CentroAyuda.module.css';

const GUIAS_POR_RUTA = {
    '/inicio': {
        titulo: 'Inicio del turno',
        resumen: 'Vista rápida del estado de Cafeto hoy: cajas activas, avisos operativos y accesos directos a cada área.',
        pasos: [
            'Revisá los indicadores principales y si hay alertas de vencimiento o ajustes pendientes.',
            'Usá las tarjetas de módulos o presioná Ctrl+K para saltar directo a cualquier pantalla o producto.',
            'El Notch superior te muestra en vivo cuántas cajas están abiertas y si tenés autorizaciones esperando.',
        ],
        consejo: 'Podés cambiar entre tema oscuro y claro o agrandar el texto (A+) desde el pie del menú lateral.',
    },
    '/productos': {
        titulo: 'Productos y precios',
        resumen: 'Consultá la carta de Cafetería y la góndola de Minisúper, filtrá por rubro o buscá por código de barras.',
        pasos: [
            'Elegí la sección (Cafetería o Minisúper) y filtrá por rubro o escribí nombre/código.',
            'Tocá cualquier producto para abrir su ficha detallada con lotes y fechas de vencimiento.',
            'Usá el botón de actualizar si se cargó mercadería reciente desde el panel central.',
        ],
        consejo: 'Si escaneás o pegás un código de barras en Ctrl+K también vas directo al producto.',
    },
    '/stock': {
        titulo: 'Stock operativo y autorizaciones',
        resumen: 'Controlá productos vencidos, próximos a vencer o con stock bajo, y aprobá o rechazá ajustes pendientes.',
        pasos: [
            'En Alertas, priorizá primero los vencidos y los próximos a vencer (orden FEFO).',
            'En Autorizaciones (si tu perfil tiene permiso), revisá el motivo y confirmá o rechazá con observación.',
            'Al aprobar o rechazar, el contador del Notch superior se actualiza automáticamente.',
        ],
        consejo: 'Las mermas, traspasos y conteos completos siguen auditándose en el panel web de Django.',
    },
    '/catalogo': {
        titulo: 'Marcas y rubros',
        resumen: 'Creá, editá, pausá o da de baja marcas y rubros del catálogo según los permisos de tu perfil.',
        pasos: [
            'Alterná entre las pestañas Marcas y Rubros desde la barra superior.',
            'En Rubros podés activar o pausar con un clic usando el interruptor de la fila.',
            'Al crear o editar, los campos validan automáticamente al salir de cada casilla.',
        ],
        consejo: 'Si buscás una marca o rubro que no existe, el botón del estado vacío te permite crearla con ese mismo nombre.',
    },
    '/cajas': {
        titulo: 'Cajas del local',
        resumen: 'Resumen en vivo de cajas abiertas y avisos del día, respetando el arqueo ciego.',
        pasos: [
            'Verificá el estado de las cajas abiertas y las alertas operativas de la jornada.',
            'Para abrir turno, arquear o cerrar caja, usá el enlace directo al panel completo de Cafeto.',
        ],
        consejo: 'Por política de arqueo ciego, esta vista nunca expone montos de caja en el encabezado.',
    },
    '/reportes': {
        titulo: 'Reportes e indicadores',
        resumen: 'Radiografía rápida del catálogo por sección y acceso a los tableros completos de análisis.',
        pasos: [
            'Filtrá entre Todo el catálogo, Cafetería o Minisúper para comparar distribución por rubros.',
            'Abrí el panel de reportes completos en Django para exportar PDF o Excel.',
        ],
        consejo: 'Los números usan tipografía tabular para que puedas comparar columnas de un vistazo.',
    },
    '/perfil': {
        titulo: 'Mi perfil y permisos',
        resumen: 'Consultá tu identidad activa, tu rol efectivo y qué acciones están habilitadas para tu cuenta.',
        pasos: [
            'Verificá si tu sesión sigue vigente contra el sistema central.',
            'Revisá qué permisos están activos en esta app y cuáles se operan en el panel web.',
        ],
        consejo: 'Si necesitás cambiar tu contraseña, hacelo desde el panel completo de Cafeto.',
    },
};

const PRIMEROS_PASOS = [
    {
        titulo: '1. Verificá tu turno y cajas',
        detalle: 'Chequeá en el Notch superior si hay cajas abiertas y revisá los avisos del día en Inicio.',
        to: '/inicio',
        etiqueta: 'Ir a Inicio',
    },
    {
        titulo: '2. Controlá alertas de stock',
        detalle: 'Revisá vencimientos próximos y stock bajo antes de empezar el pico de atención.',
        to: '/stock',
        etiqueta: 'Ver Stock',
    },
    {
        titulo: '3. Consultá precios y lotes',
        detalle: 'Buscá cualquier producto de Cafetería o Minisúper por nombre o código de barras.',
        to: '/productos',
        etiqueta: 'Ver Productos',
    },
    {
        titulo: '4. Mantené el catálogo ordenado',
        detalle: 'Creá o actualizá marcas y rubros cuando ingresan nuevos artículos.',
        to: '/catalogo',
        etiqueta: 'Marcas y rubros',
    },
];

const PESTANAS = [
    { id: 'pantalla', etiqueta: 'En esta pantalla' },
    { id: 'pasos', etiqueta: 'Primeros pasos' },
    { id: 'atajos', etiqueta: 'Atajos' },
    { id: 'avisos', etiqueta: 'Probar avisos' },
];

const obtenerGuia = (pathname) => {
    const limpia = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
    if (limpia === '/usuarios') return GUIAS_POR_RUTA['/perfil'];
    if (limpia.startsWith('/productos/')) return GUIAS_POR_RUTA['/productos'];
    return GUIAS_POR_RUTA[limpia] || GUIAS_POR_RUTA['/inicio'];
};

function CentroAyuda({ abierto, onCerrar, onIniciarGuia }) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { notificar } = useNotificacion();
    const dialogoRef = useRef(null);
    const idTitulo = useId();
    const [pestana, setPestana] = useState('pantalla');

    const dispararDemo = (fn) => {
        onCerrar();
        window.setTimeout(fn, 80);
    };

    const guia = obtenerGuia(pathname);

    useEffect(() => {
        const dialogo = dialogoRef.current;
        if (!dialogo) return;
        if (abierto && !dialogo.open) {
            dialogo.showModal();
        } else if (!abierto && dialogo.open) {
            dialogo.close();
        }
    }, [abierto]);

    const alTeclaPestanas = (evento) => {
        const indiceActual = PESTANAS.findIndex((p) => p.id === pestana);
        if (evento.key === 'ArrowRight') {
            evento.preventDefault();
            setPestana(PESTANAS[(indiceActual + 1) % PESTANAS.length].id);
        } else if (evento.key === 'ArrowLeft') {
            evento.preventDefault();
            setPestana(PESTANAS[(indiceActual - 1 + PESTANAS.length) % PESTANAS.length].id);
        }
    };

    return (
        <dialog
            ref={dialogoRef}
            className={estilos.dialogo}
            aria-labelledby={idTitulo}
            onCancel={(e) => {
                e.preventDefault();
                onCerrar();
            }}
            onClick={(e) => {
                if (e.target === dialogoRef.current) onCerrar();
            }}
        >
            <div className={estilos.cabecera}>
                <div>
                    <div className={estilos.eyebrow}>Centro de ayuda · Cafeto × iRiS</div>
                    <h2 id={idTitulo} className={estilos.titulo}>
                        {pestana === 'pantalla'
                            ? guia.titulo
                            : pestana === 'pasos'
                                ? 'Primeros pasos del turno'
                                : pestana === 'atajos'
                                    ? 'Atajos de teclado'
                                    : 'Probador de notificaciones en el Notch'}
                    </h2>
                </div>
                <button
                    type="button"
                    className={estilos.botonCerrar}
                    onClick={onCerrar}
                    aria-label="Cerrar centro de ayuda"
                >
                    <span>Cerrar</span>
                    <kbd className="iris-keycap">Esc</kbd>
                </button>
            </div>

            <div
                className={estilos.pestanas}
                role="tablist"
                aria-label="Secciones de ayuda"
                onKeyDown={alTeclaPestanas}
            >
                {PESTANAS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={pestana === item.id}
                        tabIndex={pestana === item.id ? 0 : -1}
                        className={`${estilos.pestana} ${pestana === item.id ? estilos.pestanaActiva : ''}`}
                        onClick={() => setPestana(item.id)}
                    >
                        {item.etiqueta}
                    </button>
                ))}
            </div>

            <div className={estilos.cuerpo}>
                {pestana === 'pantalla' && (
                    <div className={estilos.panel}>
                        <p className={estilos.resumen}>{guia.resumen}</p>
                        <ol className={estilos.listaPasos}>
                            {guia.pasos.map((paso) => (
                                <li key={paso}>{paso}</li>
                            ))}
                        </ol>
                        <div className={estilos.consejo}>
                            <strong>Tip operativo:</strong> {guia.consejo}
                        </div>
                        {onIniciarGuia && (
                            <div className={estilos.accionesGuia}>
                                <button
                                    type="button"
                                    className={estilos.botonGuia}
                                    onClick={() => {
                                        onCerrar();
                                        onIniciarGuia();
                                    }}
                                >
                                    Iniciar guía interactiva paso a paso
                                </button>
                                <span className={estilos.notaGuia}>
                                    Modo seguro: recorre el menú, el Notch y los atajos sin modificar datos.
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {pestana === 'pasos' && (
                    <div className={estilos.panel}>
                        <p className={estilos.resumen}>
                            Orden recomendado para revisar el local al comenzar o retomar un turno.
                        </p>
                        <ol className={estilos.roadmap}>
                            {PRIMEROS_PASOS.map((item) => (
                                <li key={item.to} className={estilos.roadmapItem}>
                                    <div>
                                        <strong>{item.titulo}</strong>
                                        <p>{item.detalle}</p>
                                    </div>
                                    <Link
                                        to={item.to}
                                        className={estilos.enlacePaso}
                                        onClick={onCerrar}
                                    >
                                        {item.etiqueta}
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {pestana === 'atajos' && (
                    <div className={estilos.panel}>
                        <div className={estilos.grillaAtajos}>
                            <section className={estilos.grupoAtajos}>
                                <h3>Navegación global</h3>
                                <ul className={estilos.listaAtajos}>
                                    <li>
                                        <span>Buscador rápido y comandos</span>
                                        <span className={estilos.teclas}>
                                            <kbd className="iris-keycap">Ctrl</kbd>
                                            <kbd className="iris-keycap">K</kbd>
                                        </span>
                                    </li>
                                    <li>
                                        <span>Abrir centro de ayuda</span>
                                        <span className={estilos.teclas}>
                                            <kbd className="iris-keycap">F1</kbd>
                                        </span>
                                    </li>
                                    <li>
                                        <span>Cerrar modal o panel activo</span>
                                        <span className={estilos.teclas}>
                                            <kbd className="iris-keycap">Esc</kbd>
                                        </span>
                                    </li>
                                </ul>
                            </section>

                            <section className={estilos.grupoAtajos}>
                                <h3>Dentro de listas y paletas</h3>
                                <ul className={estilos.listaAtajos}>
                                    <li>
                                        <span>Recargar datos (botón Actualizar)</span>
                                        <span className={estilos.teclas}>
                                            <kbd className="iris-keycap">R</kbd>
                                        </span>
                                    </li>
                                    <li>
                                        <span>Enfocar buscador de la vista</span>
                                        <span className={estilos.teclas}>
                                            <kbd className="iris-keycap">/</kbd>
                                        </span>
                                    </li>
                                    <li>
                                        <span>Moverse entre resultados</span>
                                        <span className={estilos.teclas}>
                                            <kbd className="iris-keycap">↑</kbd>
                                            <kbd className="iris-keycap">↓</kbd>
                                        </span>
                                    </li>
                                    <li>
                                        <span>Abrir opción seleccionada</span>
                                        <span className={estilos.teclas}>
                                            <kbd className="iris-keycap">Enter</kbd>
                                        </span>
                                    </li>
                                    <li>
                                        <span>Cambiar pestañas de ayuda</span>
                                        <span className={estilos.teclas}>
                                            <kbd className="iris-keycap">←</kbd>
                                            <kbd className="iris-keycap">→</kbd>
                                        </span>
                                    </li>
                                </ul>
                            </section>
                        </div>
                    </div>
                )}
                {pestana === 'avisos' && (
                    <div className={estilos.panel}>
                        <p className={estilos.resumen}>
                            Tocá cualquier variante para cerrar esta ventana y ver cómo reacciona el Notch central en vivo (recordá que los errores críticos siempre se muestran inline en pantalla, nunca en el Notch).
                        </p>
                        <div className={estilos.grillaDemos}>
                            <button
                                type="button"
                                className={estilos.botonDemo}
                                onClick={() =>
                                    dispararDemo(() =>
                                        notificar({
                                            texto: 'Cambios guardados correctamente.',
                                            tono: 'exito',
                                        })
                                    )
                                }
                            >
                                <strong>Éxito corto</strong>
                                <span>Notch compacto con barra verde de progreso</span>
                            </button>

                            <button
                                type="button"
                                className={estilos.botonDemo}
                                onClick={() =>
                                    dispararDemo(() =>
                                        notificar({
                                            texto: 'Resumen del turno sincronizado con Django.',
                                            tono: 'info',
                                        })
                                    )
                                }
                            >
                                <strong>Info corta</strong>
                                <span>Notch compacto con acento informativo azul</span>
                            </button>

                            <button
                                type="button"
                                className={estilos.botonDemo}
                                onClick={() =>
                                    dispararDemo(() =>
                                        notificar({
                                            texto: 'Atención: hay lotes próximos a vencer esta semana en Minisúper. Revisá el orden FEFO antes de reponer la góndola.',
                                            tono: 'aviso',
                                        })
                                    )
                                }
                            >
                                <strong>Aviso largo expandible</strong>
                                <span>Expande el Notch + pausa al hover + Entendido</span>
                            </button>

                            <button
                                type="button"
                                className={estilos.botonDemo}
                                onClick={() =>
                                    dispararDemo(() =>
                                        notificar({
                                            texto: 'Tenés un ajuste de stock pendiente de doble control esperando tu revisión.',
                                            tono: 'aviso',
                                            fijo: true,
                                            accion: {
                                                etiqueta: 'Revisar ahora',
                                                onClick: () => navigate('/stock', { state: { pestana: 'AUTORIZACIONES' } }),
                                            },
                                        })
                                    )
                                }
                            >
                                <strong>Aviso fijo con acción</strong>
                                <span>No se cierra solo hasta confirmar o ir a Stock</span>
                            </button>

                            <button
                                type="button"
                                className={estilos.botonDemo}
                                onClick={() =>
                                    dispararDemo(() => {
                                        notificar({ texto: '1/3 · Marca "La Virginia" actualizada.', tono: 'exito', duracionMs: 3200 });
                                        notificar({ texto: '2/3 · Rubro "Panificados" activado.', tono: 'info', duracionMs: 3200 });
                                        notificar({ texto: '3/3 · Stock sincronizado sin alertas nuevas.', tono: 'aviso', duracionMs: 3500 });
                                    })
                                }
                            >
                                <strong>Cola de 3 avisos (+2)</strong>
                                <span>Muestra el indicador de espera y los reproduce en orden</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </dialog>
    );
}

export default CentroAyuda;
