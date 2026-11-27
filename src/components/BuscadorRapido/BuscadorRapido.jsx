import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getProductos,
    getProductosStock,
    getUsuarioActual,
    tienePermiso,
} from '../../api/api';
import { useNotificacion } from '../../hooks/useNotificacion';
import { useTamanoTexto } from '../../hooks/useTamanoTexto';
import { useTema } from '../../hooks/useTema';
import { formatearPesos, normalizar } from '../../utils/formato';
import { puedeVerModulo } from '../../utils/permisos';
import {
    IconoBuscar,
    IconoCaja,
    IconoCampana,
    IconoEstadoInfo,
    IconoEtiqueta,
    IconoInicio,
    IconoLuna,
    IconoMas,
    IconoReportes,
    IconoSol,
    IconoStock,
    IconoTaza,
    IconoUsuarios,
} from '../Iconos/Iconos';
import estilos from './BuscadorRapido.module.css';

const PANTALLAS = [
    { to: '/inicio', titulo: 'Inicio', detalle: 'Panel principal del turno', icono: IconoInicio },
    { to: '/productos', titulo: 'Productos', detalle: 'Precios, stock y vencimientos', icono: IconoTaza },
    { to: '/stock', titulo: 'Stock', detalle: 'Alertas y autorizaciones pendientes', icono: IconoStock },
    { to: '/catalogo', titulo: 'Marcas y rubros', detalle: 'Organización del catálogo', icono: IconoEtiqueta },
    { to: '/cajas', titulo: 'Cajas', detalle: 'Estado de cajas y avisos del día', icono: IconoCaja },
    { to: '/reportes', titulo: 'Reportes', detalle: 'Indicadores y radiografía por rubro', icono: IconoReportes },
    { to: '/perfil', titulo: 'Mi perfil', detalle: 'Datos de tu cuenta y permisos', icono: IconoUsuarios },
];

const esCodigoBarras = (texto) => /^\d{8,}$/.test(texto.trim());

function BuscadorRapido({ abierto, onCerrar, onAbrirAyuda }) {
    const navigate = useNavigate();
    const { esClaro, alternarTema } = useTema();
    const { esGrande, alternarTamano } = useTamanoTexto();
    const { sonidoActivo, alternarSonido, notificar } = useNotificacion();

    const usuario = getUsuarioActual();
    const puedeVerStock = tienePermiso(usuario, 'ver_productos');
    const puedeCrearCatalogo =
        tienePermiso(usuario, 'crear_marca') || tienePermiso(usuario, 'crear_rubro');

    const dialogoRef = useRef(null);
    const inputRef = useRef(null);
    const idTitulo = useId();

    const [texto, setTexto] = useState('');
    const [consulta, setConsulta] = useState('');
    const [productos, setProductos] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [indiceActivo, setIndiceActivo] = useState(0);

    useEffect(() => {
        const dialogo = dialogoRef.current;
        if (!dialogo) return;
        if (abierto && !dialogo.open) {
            dialogo.showModal();
            requestAnimationFrame(() => inputRef.current?.focus());
        } else if (!abierto && dialogo.open) {
            dialogo.close();
        }
    }, [abierto]);

    useEffect(() => {
        if (!abierto) return undefined;
        const espera = setTimeout(() => setConsulta(texto.trim()), 280);
        return () => clearTimeout(espera);
    }, [texto, abierto]);

    useEffect(() => {
        if (!abierto || consulta.length < 2) {
            return undefined;
        }

        const controlador = new AbortController();

        async function buscarProductos() {
            try {
                setBuscando(true);
                let lista = [];

                if (puedeVerStock) {
                    if (esCodigoBarras(consulta)) {
                        const porCodigo = await getProductosStock({ codigo: consulta, signal: controlador.signal });
                        lista = Array.isArray(porCodigo?.resultados) ? porCodigo.resultados : [];
                        if (lista.length === 0) {
                            const porTexto = await getProductosStock({ q: consulta, signal: controlador.signal });
                            lista = Array.isArray(porTexto?.resultados) ? porTexto.resultados : [];
                        }
                    } else {
                        const res = await getProductosStock({ q: consulta, signal: controlador.signal });
                        lista = Array.isArray(res?.resultados) ? res.resultados : [];
                    }
                } else {
                    const [resCaf, resMini] = await Promise.allSettled([
                        getProductos({ seccion: 'CAFETERIA', q: consulta, signal: controlador.signal }),
                        getProductos({ seccion: 'MINISUPER', q: consulta, signal: controlador.signal }),
                    ]);
                    const mapa = new Map();
                    for (const r of [resCaf, resMini]) {
                        if (r.status === 'fulfilled') {
                            const resultados = Array.isArray(r.value?.resultados) ? r.value.resultados : [];
                            for (const item of resultados) {
                                if (item?.id != null && !mapa.has(item.id)) mapa.set(item.id, item);
                            }
                        }
                    }
                    lista = Array.from(mapa.values());
                }

                if (!controlador.signal.aborted) {
                    setProductos(lista.slice(0, 8));
                }
            } catch {
                if (!controlador.signal.aborted) {
                    setProductos([]);
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setBuscando(false);
                }
            }
        }

        buscarProductos();
        return () => controlador.abort();
    }, [abierto, consulta, puedeVerStock]);

    const accionesRapidas = [
        ...(puedeCrearCatalogo
            ? [
                  {
                      id: 'catalogo-abm',
                      titulo: 'Gestionar marcas y rubros',
                      detalle: 'Crear o editar marcas y rubros del catálogo',
                      icono: IconoMas,
                      ejecutar: () => navigate('/catalogo'),
                  },
              ]
            : []),
        {
            id: 'tema',
            titulo: esClaro ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro',
            detalle: 'Alternar apariencia visual de Cafeto × iRiS',
            icono: esClaro ? IconoLuna : IconoSol,
            ejecutar: () => {
                alternarTema();
                notificar({
                    texto: esClaro ? 'Tema oscuro activado.' : 'Tema claro activado.',
                    tono: 'info',
                });
            },
        },
        {
            id: 'tamano',
            titulo: esGrande ? 'Volver al tamaño de texto normal' : 'Agrandar tamaño de texto (A+)',
            detalle: 'Ajustar lectura cómoda para el turno',
            icono: IconoEstadoInfo,
            ejecutar: () => {
                alternarTamano();
                notificar({
                    texto: esGrande ? 'Tamaño de texto normal.' : 'Texto ampliado activado.',
                    tono: 'info',
                });
            },
        },
        {
            id: 'sonido',
            titulo: sonidoActivo ? 'Silenciar sonido de avisos' : 'Activar sonido de avisos',
            detalle: 'Tono suave offline en el Notch central',
            icono: IconoCampana,
            ejecutar: () => {
                alternarSonido();
                notificar({
                    texto: sonidoActivo ? 'Avisos silenciados.' : 'Sonido de avisos activado.',
                    tono: 'info',
                    silencioso: sonidoActivo,
                });
            },
        },
        {
            id: 'ayuda',
            titulo: 'Abrir centro de ayuda y atajos',
            detalle: 'Guía de esta pantalla, primeros pasos y teclas (F1)',
            icono: IconoEstadoInfo,
            ejecutar: () => onAbrirAyuda?.(),
        },
    ];

    const productosVisibles = abierto && consulta.length >= 2 ? productos : [];
    const buscandoVisible = abierto && consulta.length >= 2 && buscando;

    const palabras = normalizar(texto).split(/\s+/).filter(Boolean);

    const pantallasFiltradas = PANTALLAS.filter((p) => {
        if (!puedeVerModulo(usuario, p.to)) return false;
        if (palabras.length === 0) return true;
        const fuente = normalizar(`${p.titulo} ${p.detalle}`);
        return palabras.every((palabra) => fuente.includes(palabra));
    });

    const accionesFiltradas = accionesRapidas.filter((a) => {
        if (palabras.length === 0) return true;
        const fuente = normalizar(`${a.titulo} ${a.detalle}`);
        return palabras.every((palabra) => fuente.includes(palabra));
    });

    const opcionesTotales = [
        ...pantallasFiltradas.map((p) => ({ tipo: 'pantalla', item: p })),
        ...accionesFiltradas.map((a) => ({ tipo: 'accion', item: a })),
        ...productosVisibles.map((prod) => ({ tipo: 'producto', item: prod })),
    ];

    const cerrarYLimpio = () => {
        setTexto('');
        setConsulta('');
        setProductos([]);
        setIndiceActivo(0);
        onCerrar();
    };

    const elegirOpcion = (opcion) => {
        cerrarYLimpio();
        if (opcion.tipo === 'pantalla') {
            navigate(opcion.item.to);
            return;
        }
        if (opcion.tipo === 'accion') {
            opcion.item.ejecutar();
            return;
        }
        navigate(`/productos/${opcion.item.id}`, {
            state: { producto: opcion.item },
        });
    };

    const alPresionarTecla = (evento) => {
        if (opcionesTotales.length === 0) return;

        if (evento.key === 'ArrowDown') {
            evento.preventDefault();
            setIndiceActivo((i) => (i + 1) % opcionesTotales.length);
        } else if (evento.key === 'ArrowUp') {
            evento.preventDefault();
            setIndiceActivo((i) => (i - 1 + opcionesTotales.length) % opcionesTotales.length);
        } else if (evento.key === 'Enter') {
            const elegida = opcionesTotales[indiceActivo];
            if (elegida) {
                evento.preventDefault();
                elegirOpcion(elegida);
            }
        }
    };

    const offsetAcciones = pantallasFiltradas.length;
    const offsetProductos = pantallasFiltradas.length + accionesFiltradas.length;

    return (
        <dialog
            ref={dialogoRef}
            className={estilos.dialogo}
            aria-labelledby={idTitulo}
            onCancel={(e) => {
                e.preventDefault();
                cerrarYLimpio();
            }}
            onClick={(e) => {
                if (e.target === dialogoRef.current) cerrarYLimpio();
            }}
        >
            <div className={estilos.caja} onKeyDown={alPresionarTecla}>
                <h2 id={idTitulo} className={estilos.oculto}>
                    Paleta de comandos y búsqueda rápida
                </h2>

                <div className={estilos.barraInput}>
                    <span className={estilos.iconoInput} aria-hidden="true">
                        <IconoBuscar size={18} />
                    </span>
                    <input
                        ref={inputRef}
                        type="search"
                        className={estilos.input}
                        placeholder="Buscar pantalla, producto, código o acción..."
                        aria-label="Buscar pantalla, producto, código o acción"
                        value={texto}
                        onChange={(e) => {
                            const valor = e.target.value;
                            setTexto(valor);
                            if (valor.trim().length < 2) {
                                setProductos([]);
                                setBuscando(false);
                            }
                            setIndiceActivo(0);
                        }}
                    />
                    <button
                        type="button"
                        className={estilos.botonCerrar}
                        onClick={cerrarYLimpio}
                        aria-label="Cerrar buscador rápido"
                    >
                        <kbd className="iris-keycap">Esc</kbd>
                    </button>
                </div>

                <div className={estilos.resultados}>
                    {pantallasFiltradas.length > 0 && (
                        <div className={estilos.grupo}>
                            <span className={estilos.etiquetaGrupo}>Pantallas</span>
                            <ul className={estilos.lista}>
                                {pantallasFiltradas.map((pantalla, idx) => {
                                    const Icono = pantalla.icono;
                                    const activo = idx === indiceActivo;
                                    return (
                                        <li key={pantalla.to}>
                                            <button
                                                type="button"
                                                className={`${estilos.opcion} ${activo ? estilos.opcionActiva : ''}`}
                                                onMouseEnter={() => setIndiceActivo(idx)}
                                                onClick={() => elegirOpcion({ tipo: 'pantalla', item: pantalla })}
                                            >
                                                <span className={estilos.iconoOpcion}>
                                                    <Icono size={17} />
                                                </span>
                                                <span className={estilos.textoOpcion}>
                                                    <strong>{pantalla.titulo}</strong>
                                                    <small>{pantalla.detalle}</small>
                                                </span>
                                                <span className={estilos.irA}>Ir →</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {accionesFiltradas.length > 0 && (
                        <div className={estilos.grupo}>
                            <span className={estilos.etiquetaGrupo}>Acciones rápidas</span>
                            <ul className={estilos.lista}>
                                {accionesFiltradas.map((accion, idxAccion) => {
                                    const indiceGlobal = offsetAcciones + idxAccion;
                                    const Icono = accion.icono;
                                    const activo = indiceGlobal === indiceActivo;
                                    return (
                                        <li key={accion.id}>
                                            <button
                                                type="button"
                                                className={`${estilos.opcion} ${activo ? estilos.opcionActiva : ''}`}
                                                onMouseEnter={() => setIndiceActivo(indiceGlobal)}
                                                onClick={() => elegirOpcion({ tipo: 'accion', item: accion })}
                                            >
                                                <span className={estilos.iconoOpcion}>
                                                    <Icono size={17} />
                                                </span>
                                                <span className={estilos.textoOpcion}>
                                                    <strong>{accion.titulo}</strong>
                                                    <small>{accion.detalle}</small>
                                                </span>
                                                <span className={estilos.irA}>Ejecutar</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {consulta.length >= 2 && (
                        <div className={estilos.grupo}>
                            <span className={estilos.etiquetaGrupo}>
                                {buscandoVisible ? 'Buscando productos...' : 'Productos'}
                            </span>

                            {!buscandoVisible && productosVisibles.length === 0 && (
                                <p className={estilos.vacio}>
                                    No encontramos productos para &quot;{consulta}&quot;.
                                </p>
                            )}

                            {productosVisibles.length > 0 && (
                                <ul className={estilos.lista}>
                                    {productosVisibles.map((prod, idxProd) => {
                                        const indiceGlobal = offsetProductos + idxProd;
                                        const activo = indiceGlobal === indiceActivo;
                                        const precio = prod.precio_oferta ?? prod.precio;
                                        return (
                                            <li key={prod.id}>
                                                <button
                                                    type="button"
                                                    className={`${estilos.opcion} ${activo ? estilos.opcionActiva : ''}`}
                                                    onMouseEnter={() => setIndiceActivo(indiceGlobal)}
                                                    onClick={() => elegirOpcion({ tipo: 'producto', item: prod })}
                                                >
                                                    <span className={estilos.iconoOpcion}>
                                                        <IconoTaza size={17} />
                                                    </span>
                                                    <span className={estilos.textoOpcion}>
                                                        <strong>{prod.nombre}</strong>
                                                        <small>
                                                            {[prod.rubro?.nombre, prod.marca?.nombre, prod.presentacion]
                                                                .filter(Boolean)
                                                                .join(' · ') || 'Producto'}
                                                        </small>
                                                    </span>
                                                    <span className={`${estilos.precio} iris-num`}>
                                                        {precio != null ? formatearPesos(precio) : 'Ver'}
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    )}

                    {opcionesTotales.length === 0 && consulta.length < 2 && (
                        <p className={estilos.vacio}>
                            Escribí al menos 2 letras para buscar productos por nombre o código de barras.
                        </p>
                    )}
                </div>

                <footer className={estilos.pie}>
                    <span className={estilos.pieGrupo}>
                        <kbd className="iris-keycap">↑</kbd>
                        <kbd className="iris-keycap">↓</kbd>
                        <span>moverte</span>
                        <kbd className="iris-keycap">Enter</kbd>
                        <span>abrir</span>
                    </span>
                    <span className={estilos.pieGrupo}>
                        <kbd className="iris-keycap">Esc</kbd>
                        <span>cerrar</span>
                    </span>
                </footer>
            </div>
        </dialog>
    );
}

export default BuscadorRapido;
