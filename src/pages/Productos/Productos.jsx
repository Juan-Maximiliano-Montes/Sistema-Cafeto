import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
    getProductos,
    getProductosStock,
    getRubrosCatalogo,
    getUsuarioActual,
    mensajeDeError,
    tienePermiso,
} from '../../api/api';
import { useAtajos } from '../../hooks/useAtajos';
import { useTema } from '../../hooks/useTema';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina';
import AvisoError from '../../components/AvisoError/AvisoError';
import { BarraCarga, EsqueletoCatalogo } from '../../components/BarraCarga/BarraCarga';
import BarraFlotante from '../../components/BarraFlotante/BarraFlotante';
import MenuDesplegable from '../../components/MenuDesplegable/MenuDesplegable';
import Paginacion from '../../components/Paginacion/Paginacion';
import SubTabsIris from '../../components/SubTabsIris/SubTabsIris';
import Tooltip from '../../components/Tooltip/Tooltip';
import { desplazarAlInicioListado } from '../../utils/desplazamiento';
import {
    IconoChevron,
    IconoCodigoBarras,
    IconoEstadoAlerta,
    IconoEstadoError,
    IconoEstadoOk,
    IconoFiltro,
    IconoGrilla,
    IconoLista,
    IconoLote,
} from '../../components/Iconos/Iconos';
import {
    formatearCantidad,
    formatearFecha,
    formatearNumero,
    formatearPesos,
    normalizar,
} from '../../utils/formato';
import isotipoBlanco from '../../assets/cafeto-isotipo-blanco.svg';
import isotipoNegro from '../../assets/cafeto-isotipo-negro.svg';
import estilos from './Productos.module.css';

const CLAVE_VISTA_PRODUCTOS = 'cafeto_productos_vista';

const leerVistaGuardada = () => {
    try {
        const guardada = localStorage.getItem(CLAVE_VISTA_PRODUCTOS);
        return guardada === 'tarjetas' ? 'tarjetas' : 'lista';
    } catch {
        return 'lista';
    }
};

const ORDENES = [
    { id: 'nombre-asc', etiqueta: 'Nombre (A–Z)', descripcion: 'Orden alfabético' },
    { id: 'precio-asc', etiqueta: 'Menor precio', descripcion: 'Del más económico al mayor' },
    { id: 'precio-desc', etiqueta: 'Mayor precio', descripcion: 'Del mayor al más económico' },
];

const BADGES_ALERTA = {
    VENCIDO: { texto: 'Vencido', clase: 'alertaError', icono: IconoEstadoError },
    SIN_STOCK: { texto: 'Sin stock', clase: 'alertaError', icono: IconoEstadoError },
    POR_VENCER: { texto: 'Por vencer', clase: 'alertaAviso', icono: IconoEstadoAlerta },
    STOCK_BAJO: { texto: 'Stock bajo', clase: 'alertaAviso', icono: IconoEstadoAlerta },
};

function FotoProducto({ src, nombre, isotipo, compacto = false }) {
    const [fallo, setFallo] = useState(false);
    const usarFoto = Boolean(src) && !fallo;
    const claseMarco = compacto ? estilos.miniatura : estilos.foto;

    if (usarFoto) {
        return (
            <div className={claseMarco}>
                <img
                    src={src}
                    alt={nombre}
                    loading="lazy"
                    className={estilos.imagen}
                    onError={() => setFallo(true)}
                />
            </div>
        );
    }

    return (
        <div className={`${claseMarco} ${estilos.fotoVacia}`}>
            <img src={isotipo} alt="" className={compacto ? estilos.placeholderMini : estilos.placeholder} />
            {!compacto && <span className={estilos.leyendaSinFoto}>Sin foto</span>}
        </div>
    );
}

function coincide(item, palabras) {
    if (!item) return false;
    if (palabras.length === 0) return true;
    const texto = normalizar(
        `${item?.nombre || ''} ${item?.rubro?.nombre || ''} ${item?.marca?.nombre || ''} ${item?.codigo_barras || ''}`
    );
    return palabras.every((palabra) => texto.includes(palabra));
}

const precioVigente = (item) => Number(item?.precio_oferta ?? item?.precio ?? 0);
const esCodigoBarras = (texto) => /^\d{8,}$/.test(texto.trim());

function Productos() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const usuario = getUsuarioActual();
    const puedeVerStockInterno = tienePermiso(usuario, 'ver_productos');
    const { esClaro } = useTema();
    const isotipo = esClaro ? isotipoNegro : isotipoBlanco;

    const secciones = [
        { valor: 'CAFETERIA', texto: 'Cafetería' },
        { valor: 'MINISUPER', texto: 'Minisúper' },
        ...(puedeVerStockInterno ? [{ valor: 'STOCK', texto: 'Stock interno' }] : []),
    ];

    const seccionParam = searchParams.get('seccion') || 'CAFETERIA';
    const seccion = secciones.some((s) => s.valor === seccionParam) ? seccionParam : 'CAFETERIA';
    const rubroSeleccionado = seccion === 'STOCK' ? '' : (searchParams.get('rubro') || '');
    const consulta = (searchParams.get('q') || '').trim();
    const paginaRaw = Number.parseInt(searchParams.get('pagina') || '1', 10);
    const pagina = Number.isFinite(paginaRaw) && paginaRaw >= 1 ? paginaRaw : 1;

    const [productos, setProductos] = useState([]);
    const [rubros, setRubros] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState(consulta);
    const [orden, setOrden] = useState('nombre-asc');
    const [soloConStock, setSoloConStock] = useState(false);
    const [vista, setVista] = useState(leerVistaGuardada);
    const [intento, setIntento] = useState(0);
    const [hayMas, setHayMas] = useState(false);

    const inicioListadoRef = useRef(null);
    const busquedaRef = useRef(null);
    const busquedaDiferida = useDeferredValue(busqueda);

    useAtajos({
        '/': () => busquedaRef.current?.focus(),
        r: () => {
            if (!cargando) setIntento((n) => n + 1);
        },
    });

    const consultaPorCodigo = puedeVerStockInterno && esCodigoBarras(consulta);
    const modoStock = seccion === 'STOCK' || consultaPorCodigo;

    const cambiarVista = (nuevaVista) => {
        setVista(nuevaVista);
        try {
            localStorage.setItem(CLAVE_VISTA_PRODUCTOS, nuevaVista);
        } catch {
            // Si el navegador bloquea localStorage, la preferencia sigue viva en esta sesión.
        }
    };

    useEffect(() => {
        const limpio = busqueda.trim();
        if (limpio === consulta) return undefined;
        const espera = setTimeout(() => {
            setSearchParams((prev) => {
                const copia = new URLSearchParams(prev);
                if (limpio) copia.set('q', limpio);
                else copia.delete('q');
                copia.delete('pagina');
                return copia;
            }, { replace: true });
        }, 300);
        return () => clearTimeout(espera);
    }, [busqueda, consulta, setSearchParams]);

    useEffect(() => {
        if (seccion === 'STOCK') {
            return undefined;
        }

        const controlador = new AbortController();

        async function cargarRubros() {
            try {
                const datos = await getRubrosCatalogo({ seccion, signal: controlador.signal });
                if (!controlador.signal.aborted) {
                    setRubros(Array.isArray(datos?.resultados) ? datos.resultados.filter(Boolean) : []);
                }
            } catch {
                if (!controlador.signal.aborted) {
                    setRubros([]);
                }
            }
        }

        cargarRubros();
        return () => controlador.abort();
    }, [seccion]);

    useEffect(() => {
        const controlador = new AbortController();

        async function cargarCatalogo() {
            try {
                setCargando(true);
                setError(null);

                let datos;
                if (modoStock) {
                    if (consultaPorCodigo) {
                        datos = await getProductosStock({ codigo: consulta, pagina, signal: controlador.signal });
                        if ((datos?.resultados?.length ?? 0) === 0 && pagina === 1) {
                            datos = await getProductosStock({ q: consulta, pagina, signal: controlador.signal });
                        }
                    } else {
                        datos = await getProductosStock({ q: consulta, pagina, signal: controlador.signal });
                    }
                } else {
                    datos = await getProductos({
                        seccion,
                        rubro: rubroSeleccionado,
                        q: consulta,
                        pagina,
                        signal: controlador.signal,
                    });
                }

                if (!controlador.signal.aborted) {
                    setProductos(Array.isArray(datos?.resultados) ? datos.resultados.filter(Boolean) : []);
                    setHayMas(Boolean(datos?.hayMas));
                }
            } catch (err) {
                const mensaje = mensajeDeError(err, 'No se pudo cargar el catálogo.');
                if (mensaje && !controlador.signal.aborted) setError(mensaje);
            } finally {
                if (!controlador.signal.aborted) setCargando(false);
            }
        }

        cargarCatalogo();
        return () => controlador.abort();
    }, [seccion, rubroSeleccionado, consulta, pagina, modoStock, consultaPorCodigo, intento]);

    const productosSeguros = Array.isArray(productos) ? productos.filter(Boolean) : [];
    const rubrosSeguros = Array.isArray(rubros) ? rubros.filter(Boolean) : [];
    const palabras = normalizar(busquedaDiferida).split(/\s+/).filter(Boolean);
    const productosFiltrados = [
        ...productosSeguros.filter((item) => (!soloConStock || Boolean(item?.disponible)) && coincide(item, palabras)),
    ].sort((a, b) => {
        if (orden === 'precio-asc') return precioVigente(a) - precioVigente(b);
        if (orden === 'precio-desc') return precioVigente(b) - precioVigente(a);
        return String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es-AR');
    });

    const seccionActual = consultaPorCodigo && seccion !== 'STOCK'
        ? 'Búsqueda por código de barras'
        : secciones.find((s) => s.valor === seccion)?.texto;
    const cargaInicial = cargando && productosSeguros.length === 0;
    const ordenActual = ORDENES.find((opcion) => opcion.id === orden);

    const cambiarSeccion = (valor) => {
        if (valor === seccion) return;
        setProductos([]);
        if (valor === 'STOCK') {
            setRubros([]);
        }
        setSearchParams((prev) => {
            const copia = new URLSearchParams(prev);
            if (valor === 'CAFETERIA') copia.delete('seccion');
            else copia.set('seccion', valor);
            copia.delete('rubro');
            copia.delete('pagina');
            return copia;
        }, { replace: true });
    };

    const cambiarRubro = (nuevoRubro) => {
        setSearchParams((prev) => {
            const copia = new URLSearchParams(prev);
            if (nuevoRubro) copia.set('rubro', nuevoRubro);
            else copia.delete('rubro');
            copia.delete('pagina');
            return copia;
        }, { replace: true });
    };

    const limpiarBusqueda = () => {
        setBusqueda('');
        setSearchParams((prev) => {
            const copia = new URLSearchParams(prev);
            copia.delete('q');
            copia.delete('pagina');
            return copia;
        }, { replace: true });
    };

    const limpiarFiltros = () => {
        setBusqueda('');
        setSoloConStock(false);
        setSearchParams((prev) => {
            const copia = new URLSearchParams(prev);
            copia.delete('q');
            copia.delete('rubro');
            copia.delete('pagina');
            return copia;
        }, { replace: true });
    };

    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina < 1 || cargando) return;
        setSearchParams((prev) => {
            const copia = new URLSearchParams(prev);
            if (nuevaPagina <= 1) copia.delete('pagina');
            else copia.set('pagina', String(nuevaPagina));
            return copia;
        });
        desplazarAlInicioListado(inicioListadoRef.current);
    };

    const abrirDetalle = (item) => {
        if (!item?.id) return;
        navigate(`/productos/${item.id}`, {
            state: {
                producto: item,
                seccion: seccionActual,
                volverA: `${location.pathname}${location.search}`,
            },
        });
    };

    const opcionesOrdenYFiltro = [
        ...ORDENES.map((opcion) => ({
            id: opcion.id,
            etiqueta: opcion.etiqueta,
            descripcion: opcion.descripcion,
            activa: orden === opcion.id,
            onClick: () => setOrden(opcion.id),
        })),
        {
            id: 'solo-stock',
            etiqueta: 'Solo con stock',
            descripcion: soloConStock ? 'Mostrando únicamente disponibles' : 'Ocultar productos sin stock',
            activa: soloConStock,
            separadorAntes: true,
            onClick: () => setSoloConStock((previo) => !previo),
        },
    ];

    const renderizarBadgesStock = (item) => {
        if (!modoStock) return null;
        const alertas = Array.isArray(item?.alertas) ? item.alertas : [];
        if (alertas.length === 0 && !item?.proximo_vencimiento) return null;

        return (
            <div className={estilos.filaAlertas}>
                {alertas.map((codigo) => {
                    const meta = BADGES_ALERTA[codigo];
                    if (!meta) return null;
                    const Icono = meta.icono;
                    return (
                        <span key={codigo} className={`${estilos.badgeAlerta} ${estilos[meta.clase]}`}>
                            <Icono size={12} />
                            <span>{meta.texto}</span>
                        </span>
                    );
                })}
            </div>
        );
    };

    const renderizarMetaStock = (item) => {
        if (!modoStock) return null;
        const mostrarMinimo = item?.stock_minimo != null && Number(item.stock_minimo) > 0;

        return (
            <div className={estilos.metaStock}>
                {item?.codigo_barras && (
                    <span className={estilos.datoStock}>
                        <IconoCodigoBarras size={14} />
                        <span>{item.codigo_barras}</span>
                    </span>
                )}
                {item?.stock_actual != null && (
                    <span className={estilos.datoStock}>
                        Stock: <strong>{formatearCantidad(item.stock_actual, item.unidad)}</strong>
                        {mostrarMinimo ? ` (mín. ${formatearNumero(item.stock_minimo)})` : ''}
                    </span>
                )}
                {item?.proximo_vencimiento?.fecha && (
                    <span className={estilos.datoStock}>
                        <IconoLote size={14} />
                        <span>
                            Vence {formatearFecha(item.proximo_vencimiento.fecha)}
                            {item.proximo_vencimiento.lote ? ` · Lote ${item.proximo_vencimiento.lote}` : ''}
                        </span>
                    </span>
                )}
            </div>
        );
    };

    const textoDetalle = (item) =>
        item?.controla_vencimiento ? 'Ver detalle y vencimientos' : 'Ver detalle';

    return (
        <section>
            <BarraCarga activa={cargando} etiqueta="Cargando catálogo de productos" />

            <EncabezadoPagina
                compacto
                etiqueta="Catálogo y stock"
                titulo="Productos"
                subtitulo={
                    puedeVerStockInterno
                        ? 'Precios de Cafetería y Minisúper, filtro por rubro, stock interno y búsqueda por código de barras.'
                        : 'Carta de Cafetería y góndola de Minisúper con precios y disponibilidad al día.'
                }
            />

            <div ref={inicioListadoRef}>
                <SubTabsIris
                    ariaLabel="Sección del catálogo"
                    activa={seccion}
                    onCambiar={cambiarSeccion}
                    pestanas={secciones.map(({ valor, texto }) => ({
                        id: valor,
                        etiqueta: texto,
                    }))}
                >
                <div className={estilos.cabeceraListado}>
                <div className={estilos.barraAcciones}>

                    {seccion !== 'STOCK' && rubrosSeguros.length > 0 && (
                        <div className={estilos.selectorRubro}>
                            <label htmlFor="filtro-rubro" className={estilos.oculto}>
                                Filtrar por rubro
                            </label>
                            <select
                                id="filtro-rubro"
                                className={estilos.selectRubro}
                                value={rubroSeleccionado}
                                onChange={(e) => cambiarRubro(e.target.value)}
                                aria-label="Filtrar por rubro"
                            >
                                <option value="">Todos los rubros</option>
                                {rubrosSeguros.map((rubro) => (
                                    <option key={rubro.id} value={rubro.id}>
                                        {rubro.nombre}
                                    </option>
                                ))}
                            </select>
                            <span className={estilos.iconoSelect} aria-hidden="true">
                                <IconoChevron size={16} />
                            </span>
                        </div>
                    )}

                    <div className={estilos.barraBusqueda}>
                        <input
                            ref={busquedaRef}
                            type="search"
                            className={estilos.inputBusqueda}
                            placeholder={
                                puedeVerStockInterno
                                    ? 'Buscar por nombre, rubro, marca o código (tecla /)...'
                                    : 'Buscar por nombre, rubro o marca (tecla /)...'
                            }
                            aria-label="Buscar productos"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                        {busqueda && (
                            <span className={estilos.contenedorLimpiar}>
                                <Tooltip texto="Borrar el texto buscado" posicion="abajo">
                                    <button
                                        type="button"
                                        className={estilos.limpiar}
                                        onClick={limpiarBusqueda}
                                        aria-label="Limpiar búsqueda"
                                    >
                                        ×
                                    </button>
                                </Tooltip>
                            </span>
                        )}
                    </div>
                </div>

                <div className={estilos.barraSecundaria}>
                    <div className={estilos.controlesDerecha}>
                        <Tooltip texto="Ordenar por nombre o precio, o ver solo productos con stock" posicion="abajo">
                            <MenuDesplegable
                                etiquetaAria="Ordenar y filtrar catálogo"
                                alineacion="izquierda"
                                disparador={
                                    <>
                                        <IconoFiltro size={17} />
                                        <span>
                                            {ordenActual?.etiqueta}
                                            {soloConStock ? ' · Con stock' : ''}
                                        </span>
                                    </>
                                }
                                encabezado={<span className={estilos.tituloMenu}>Ordenar y filtrar vista</span>}
                                opciones={opcionesOrdenYFiltro}
                            />
                        </Tooltip>

                        <div className={estilos.selectorVista} role="group" aria-label="Formato de visualización">
                            <Tooltip texto="Vista en lista" posicion="abajo">
                                <button
                                    type="button"
                                    className={`${estilos.botonVista} ${vista === 'lista' ? estilos.botonVistaActiva : ''}`}
                                    aria-pressed={vista === 'lista'}
                                    aria-label="Vista en lista"
                                    onClick={() => cambiarVista('lista')}
                                >
                                    <IconoLista size={18} />
                                </button>
                            </Tooltip>
                            <Tooltip texto="Vista en tarjetas" posicion="abajo">
                                <button
                                    type="button"
                                    className={`${estilos.botonVista} ${vista === 'tarjetas' ? estilos.botonVistaActiva : ''}`}
                                    aria-pressed={vista === 'tarjetas'}
                                    aria-label="Vista en tarjetas"
                                    onClick={() => cambiarVista('tarjetas')}
                                >
                                    <IconoGrilla size={18} />
                                </button>
                            </Tooltip>
                        </div>
                    </div>

                    {!error && (
                        <p className={estilos.resumen} aria-live="polite">
                            {cargaInicial
                                ? 'Cargando catálogo...'
                                : (
                                    <>
                                        {cargando && 'Actualizando... · '}
                                        {consultaPorCodigo && 'Código de barras · '}
                                        {`Mostrando ${formatearNumero(productosFiltrados.length)} ${
                                            productosFiltrados.length === 1 ? 'producto' : 'productos'
                                        }`}
                                        {soloConStock ? ' con stock' : ''}
                                        {` · Página ${formatearNumero(pagina)}`}
                                    </>
                                )}
                        </p>
                    )}
                </div>
            </div>

            {cargaInicial && <EsqueletoCatalogo cantidad={6} />}

            {!cargando && error && (
                <AvisoError
                    titulo="No pudimos traer el catálogo"
                    mensaje={error}
                    onReintentar={() => setIntento((n) => n + 1)}
                />
            )}

            {!cargaInicial && !error && (
                <>

                    {productosFiltrados.length > 0 ? (
                        vista === 'tarjetas' ? (
                            <div className={`${estilos.gridProductos} ${cargando ? estilos.actualizando : ''}`}>
                                {productosFiltrados.map((item) => (
                                    <article key={item.id} className={estilos.tarjeta}>
                                        <button
                                            type="button"
                                            className={estilos.tarjetaBoton}
                                            onClick={() => abrirDetalle(item)}
                                        >
                                            <FotoProducto src={item.imagen} nombre={item.nombre} isotipo={isotipo} />

                                            {item.precio_oferta != null && (
                                                <span className={estilos.badgeOferta}>
                                                    {item.porcentaje_oferta ? `-${item.porcentaje_oferta}%` : 'Oferta'}
                                                </span>
                                            )}

                                            <div className={estilos.cuerpo}>
                                                <span className={estilos.categoria}>
                                                    {item.rubro?.nombre || 'Cafeto'}
                                                </span>
                                                <h2 className={estilos.nombreProducto}>{item.nombre}</h2>
                                                <p className={estilos.descripcion}>
                                                    {item.descripcion || [item.presentacion, item.marca?.nombre].filter(Boolean).join(' · ')}
                                                </p>
                                                {renderizarMetaStock(item)}
                                                {renderizarBadgesStock(item)}
                                            </div>

                                            <div className={estilos.pieTarjeta}>
                                                <div className={estilos.precios}>
                                                    {item.precio_oferta != null ? (
                                                        <>
                                                            <span className={estilos.precioAnterior}>{formatearPesos(item.precio)}</span>
                                                            <span className={estilos.precio}>{formatearPesos(item.precio_oferta)}</span>
                                                        </>
                                                    ) : (
                                                        <span className={estilos.precio}>{formatearPesos(item.precio)}</span>
                                                    )}
                                                </div>

                                                <span className={`${estilos.badge} ${item.disponible ? estilos.disponible : estilos.agotado}`}>
                                                    {item.disponible ? <IconoEstadoOk size={13} /> : <IconoEstadoError size={13} />}
                                                    <span>{item.disponible ? 'Disponible' : 'Sin stock'}</span>
                                                </span>
                                            </div>

                                            <div className={estilos.barraDetalle}>
                                                <span className={estilos.botonDetalle}>
                                                    {textoDetalle(item)} <span aria-hidden="true">→</span>
                                                </span>
                                            </div>
                                        </button>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <ul className={`${estilos.listaProductos} ${cargando ? estilos.actualizando : ''}`}>
                                {productosFiltrados.map((item) => (
                                    <li key={item.id} className={estilos.itemLista}>
                                        <button
                                            type="button"
                                            className={estilos.filaLista}
                                            onClick={() => abrirDetalle(item)}
                                        >
                                            <FotoProducto src={item.imagen} nombre={item.nombre} isotipo={isotipo} compacto />

                                            <div className={estilos.filaInfo}>
                                                <div className={estilos.filaTitular}>
                                                    <h2 className={estilos.nombreLista}>{item.nombre}</h2>
                                                    {item.precio_oferta != null && (
                                                        <span className={estilos.badgeOfertaInline}>
                                                            {item.porcentaje_oferta ? `-${item.porcentaje_oferta}%` : 'Oferta'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={estilos.subDatosLista}>
                                                    {[
                                                        item.rubro?.nombre || 'Cafeto',
                                                        item.marca?.nombre,
                                                        item.presentacion,
                                                    ].filter(Boolean).join(' · ')}
                                                </p>
                                                {renderizarMetaStock(item)}
                                                {renderizarBadgesStock(item)}
                                            </div>

                                            <div className={estilos.filaPrecio}>
                                                {item.precio_oferta != null ? (
                                                    <>
                                                        <span className={estilos.precioAnterior}>{formatearPesos(item.precio)}</span>
                                                        <strong className={estilos.precio}>{formatearPesos(item.precio_oferta)}</strong>
                                                    </>
                                                ) : (
                                                    <strong className={estilos.precio}>{formatearPesos(item.precio)}</strong>
                                                )}
                                            </div>

                                            <span className={`${estilos.badge} ${item.disponible ? estilos.disponible : estilos.agotado}`}>
                                                {item.disponible ? <IconoEstadoOk size={13} /> : <IconoEstadoError size={13} />}
                                                <span>{item.disponible ? 'Disponible' : 'Sin stock'}</span>
                                            </span>

                                            <span className={estilos.botonDetalleLista}>
                                                {textoDetalle(item)}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )
                    ) : (
                        <div className={estilos.vacio}>
                            <img src={isotipo} alt="" className={estilos.vacioIcono} />
                            {busqueda.trim() || soloConStock || rubroSeleccionado ? (
                                <>
                                    <p>
                                        No encontramos productos
                                        {busqueda.trim() ? ` que coincidan con "${busqueda.trim()}"` : ''}
                                        {soloConStock ? ' con stock disponible' : ''} en {seccionActual}.
                                    </p>
                                    <button
                                        type="button"
                                        className={estilos.botonLimpiarVacio}
                                        onClick={limpiarFiltros}
                                    >
                                        Limpiar búsqueda
                                    </button>
                                </>
                            ) : pagina > 1 ? (
                                <>
                                    <p>No encontramos productos en la página {formatearNumero(pagina)}.</p>
                                    <button
                                        type="button"
                                        className={estilos.botonLimpiarVacio}
                                        onClick={() => cambiarPagina(1)}
                                    >
                                        Volver a la página 1
                                    </button>
                                </>
                            ) : (
                                <p>Todavía no hay productos publicados en {seccionActual}.</p>
                            )}
                        </div>
                    )}

                    <Paginacion
                        pagina={pagina}
                        hayMas={hayMas}
                        cargando={cargando}
                        cantidad={productosFiltrados.length}
                        etiquetaSingular="producto"
                        etiquetaPlural="productos"
                        ariaLabel="Paginación de productos"
                        onCambiarPagina={cambiarPagina}
                    />
                </>
            )}
                </SubTabsIris>
            </div>

            <BarraFlotante />
        </section>
    );
}

export default Productos;
