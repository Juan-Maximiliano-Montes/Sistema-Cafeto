import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getProductos,
    getProductosStock,
    getUsuarioActual,
    tienePermiso,
} from '../../api/api';
import { formatearPesos, normalizar } from '../../utils/formato';
import {
    IconoBuscar,
    IconoCaja,
    IconoCerrar,
    IconoEtiqueta,
    IconoInicio,
    IconoReportes,
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

function BuscadorRapido({ abierto, onCerrar }) {
    const navigate = useNavigate();
    const usuario = getUsuarioActual();
    const puedeVerStock = tienePermiso(usuario, 'ver_productos');

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
        const espera = setTimeout(() => setConsulta(texto.trim()), 300);
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

    const productosVisibles = abierto && consulta.length >= 2 ? productos : [];
    const buscandoVisible = abierto && consulta.length >= 2 && buscando;

    const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
    const pantallasFiltradas = PANTALLAS.filter((p) => {
        if (palabras.length === 0) return true;
        const fuente = normalizar(`${p.titulo} ${p.detalle}`);
        return palabras.every((palabra) => fuente.includes(palabra));
    });

    const opcionesTotales = [
        ...pantallasFiltradas.map((p) => ({ tipo: 'pantalla', item: p })),
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
                    Buscador rápido del sistema
                </h2>

                <div className={estilos.barraInput}>
                    <span className={estilos.iconoInput} aria-hidden="true">
                        <IconoBuscar size={18} />
                    </span>
                    <input
                        ref={inputRef}
                        type="search"
                        className={estilos.input}
                        placeholder="Ir a una pantalla o buscar un producto..."
                        aria-label="Ir a una pantalla o buscar un producto"
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
                        <IconoCerrar size={18} />
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
                                                    <Icono size={18} />
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
                                        const indiceGlobal = pantallasFiltradas.length + idxProd;
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
                                                        <IconoTaza size={18} />
                                                    </span>
                                                    <span className={estilos.textoOpcion}>
                                                        <strong>{prod.nombre}</strong>
                                                        <small>
                                                            {[prod.rubro?.nombre, prod.marca?.nombre, prod.presentacion]
                                                                .filter(Boolean)
                                                                .join(' · ') || 'Producto'}
                                                        </small>
                                                    </span>
                                                    <span className={estilos.precio}>
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

                    {pantallasFiltradas.length === 0 && consulta.length < 2 && (
                        <p className={estilos.vacio}>
                            Escribí al menos 2 letras para buscar productos por nombre o código.
                        </p>
                    )}
                </div>

                <footer className={estilos.pie}>
                    <span>↑ ↓ moverte · Enter abrir</span>
                    <span>Esc cerrar</span>
                </footer>
            </div>
        </dialog>
    );
}

export default BuscadorRapido;
