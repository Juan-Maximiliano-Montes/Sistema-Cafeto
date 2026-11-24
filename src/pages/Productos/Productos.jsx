import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductos, mensajeDeError } from '../../api/api';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina';
import AvisoError from '../../components/AvisoError/AvisoError';
import { BarraCarga, EsqueletoCatalogo } from '../../components/BarraCarga/BarraCarga';
import BarraFlotante from '../../components/BarraFlotante/BarraFlotante';
import MenuDesplegable from '../../components/MenuDesplegable/MenuDesplegable';
import Tooltip from '../../components/Tooltip/Tooltip';
import {
    IconoEstadoError,
    IconoEstadoOk,
    IconoFiltro,
} from '../../components/Iconos/Iconos';
import { formatearPesos, normalizar } from '../../utils/formato';
import iconoCafeto from '../../assets/cafeto-icono-ambar.svg';
import estilos from './Productos.module.css';

const SECCIONES = [
    { valor: 'CAFETERIA', texto: 'Cafetería' },
    { valor: 'MINISUPER', texto: 'Minisúper' },
];

const ORDENES = [
    { id: 'nombre-asc', etiqueta: 'Nombre (A–Z)', descripcion: 'Orden alfabético' },
    { id: 'precio-asc', etiqueta: 'Menor precio', descripcion: 'Del más económico al mayor' },
    { id: 'precio-desc', etiqueta: 'Mayor precio', descripcion: 'Del mayor al más económico' },
];

function FotoProducto({ src, nombre }) {
    const [fallo, setFallo] = useState(false);
    const usarFoto = Boolean(src) && !fallo;

    return (
        <div className={estilos.foto}>
            <img
                src={usarFoto ? src : iconoCafeto}
                alt={usarFoto ? nombre : ''}
                loading="lazy"
                className={usarFoto ? estilos.imagen : estilos.placeholder}
                onError={() => setFallo(true)}
            />
        </div>
    );
}

function coincide(item, palabras) {
    const texto = normalizar(`${item.nombre} ${item.rubro?.nombre || ''} ${item.marca?.nombre || ''}`);
    return palabras.every((palabra) => texto.includes(palabra));
}

const precioVigente = (item) => Number(item.precio_oferta ?? item.precio ?? 0);

function Productos() {
    const navigate = useNavigate();

    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const [seccion, setSeccion] = useState('CAFETERIA');
    const [busqueda, setBusqueda] = useState('');
    const [consulta, setConsulta] = useState('');
    const [orden, setOrden] = useState('nombre-asc');
    const [soloConStock, setSoloConStock] = useState(false);
    const [intento, setIntento] = useState(0);

    const [pagina, setPagina] = useState(1);
    const [hayMas, setHayMas] = useState(false);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [errorMas, setErrorMas] = useState(null);

    useEffect(() => {
        const espera = setTimeout(() => setConsulta(busqueda.trim()), 400);
        return () => clearTimeout(espera);
    }, [busqueda]);

    useEffect(() => {
        const controlador = new AbortController();

        async function cargarCatalogo() {
            try {
                setCargando(true);
                setError(null);
                setErrorMas(null);
                const datos = await getProductos({ seccion, q: consulta, signal: controlador.signal });
                setProductos(datos.resultados);
                setHayMas(datos.hayMas);
                setPagina(1);
            } catch (err) {
                const mensaje = mensajeDeError(err, 'No se pudo cargar el catálogo.');
                if (mensaje) setError(mensaje);
            } finally {
                if (!controlador.signal.aborted) setCargando(false);
            }
        }

        cargarCatalogo();
        return () => controlador.abort();
    }, [seccion, consulta, intento]);

    const cargarMas = async () => {
        try {
            setCargandoMas(true);
            setErrorMas(null);
            const datos = await getProductos({ seccion, q: consulta, pagina: pagina + 1 });
            setProductos((anteriores) => [...anteriores, ...datos.resultados]);
            setHayMas(datos.hayMas);
            setPagina((actual) => actual + 1);
        } catch (err) {
            setErrorMas(mensajeDeError(err, 'No se pudieron traer más productos.'));
        } finally {
            setCargandoMas(false);
        }
    };

    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    const productosFiltrados = productos
        .filter((item) => (!soloConStock || Boolean(item.disponible)) && coincide(item, palabras))
        .toSorted((a, b) => {
            if (orden === 'precio-asc') return precioVigente(a) - precioVigente(b);
            if (orden === 'precio-desc') return precioVigente(b) - precioVigente(a);
            return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es-AR');
        });

    const seccionActual = SECCIONES.find((s) => s.valor === seccion)?.texto;
    const cargaInicial = cargando && productos.length === 0;
    const ordenActual = ORDENES.find((opcion) => opcion.id === orden);

    const cambiarSeccion = (valor) => {
        if (valor === seccion) return;
        setProductos([]);
        setSeccion(valor);
    };

    const abrirDetalle = (item) => {
        navigate(`/productos/${item.id}`, {
            state: { producto: item, seccion: seccionActual },
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

    return (
        <section>
            <BarraCarga activa={cargando || cargandoMas} etiqueta="Cargando catálogo de productos" />

            <EncabezadoPagina
                volverA="/inicio"
                textoVolver="Volver al inicio"
                etiqueta="Catálogo"
                titulo="Productos"
                subtitulo="Carta y góndola con precios y disponibilidad en tiempo real desde el sistema."
            />

            <div className={estilos.barraAcciones}>
                <div className={estilos.selectorSeccion} role="group" aria-label="Sección del catálogo">
                    {SECCIONES.map(({ valor, texto }) => (
                        <button
                            key={valor}
                            type="button"
                            className={`${estilos.botonSeccion} ${seccion === valor ? estilos.botonSeccionActivo : ''}`}
                            aria-pressed={seccion === valor}
                            disabled={cargandoMas}
                            onClick={() => cambiarSeccion(valor)}
                        >
                            {texto}
                        </button>
                    ))}
                </div>

                <div className={estilos.barraBusqueda}>
                    <input
                        type="search"
                        className={estilos.inputBusqueda}
                        placeholder="Buscar por nombre, rubro o marca..."
                        aria-label="Buscar productos"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                        <Tooltip texto="Borrar el texto buscado" posicion="abajo">
                            <button
                                type="button"
                                className={estilos.limpiar}
                                onClick={() => setBusqueda('')}
                                aria-label="Limpiar búsqueda"
                            >
                                ×
                            </button>
                        </Tooltip>
                    )}
                </div>

                <Tooltip texto="Ordenar por nombre o precio, o ver solo productos con stock" posicion="abajo">
                    <MenuDesplegable
                        etiquetaAria="Ordenar y filtrar catálogo"
                        alineacion="derecha"
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
                    <p className={estilos.resumen} aria-live="polite">
                        {cargando && 'Buscando en Django... · '}
                        {productosFiltrados.length === 1
                            ? '1 producto'
                            : `${productosFiltrados.length} productos`}
                        {soloConStock ? ' con stock' : ''}
                        {orden !== 'nombre-asc' ? ` · Orden: ${ordenActual?.etiqueta}` : ''}
                        {hayMas ? ' (hay más para ver)' : ''}
                    </p>

                    {productosFiltrados.length > 0 ? (
                        <div className={`${estilos.gridProductos} ${cargando ? estilos.actualizando : ''}`}>
                            {productosFiltrados.map((item) => (
                                <article key={item.id} className={estilos.tarjeta}>
                                    <button
                                        type="button"
                                        className={estilos.zonaNavegable}
                                        onClick={() => abrirDetalle(item)}
                                    >
                                        <FotoProducto src={item.imagen} nombre={item.nombre} />

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
                                        </div>
                                    </button>

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

                                        <Tooltip
                                            esEtiqueta
                                            texto={
                                                item.disponible
                                                    ? 'Producto disponible para vender hoy'
                                                    : 'Sin unidades disponibles por ahora'
                                            }
                                        >
                                            <span className={`${estilos.badge} ${item.disponible ? estilos.disponible : estilos.agotado}`}>
                                                {item.disponible ? <IconoEstadoOk size={13} /> : <IconoEstadoError size={13} />}
                                                <span>{item.disponible ? 'Disponible' : 'Sin stock'}</span>
                                            </span>
                                        </Tooltip>
                                    </div>

                                    <div className={estilos.barraDetalle}>
                                        <button
                                            type="button"
                                            className={estilos.botonDetalle}
                                            onClick={() => abrirDetalle(item)}
                                        >
                                            Ver detalle <span aria-hidden="true">→</span>
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className={estilos.vacio}>
                            <img src={iconoCafeto} alt="" className={estilos.vacioIcono} />
                            {busqueda || soloConStock ? (
                                <p>
                                    No encontramos productos
                                    {busqueda ? ` que coincidan con "${busqueda}"` : ''}
                                    {soloConStock ? ' con stock disponible' : ''} en {seccionActual}.
                                </p>
                            ) : (
                                <p>Todavía no hay productos publicados en {seccionActual}.</p>
                            )}
                        </div>
                    )}

                    {errorMas && <p className={estilos.errorMas} role="alert">{errorMas}</p>}

                    {hayMas && (
                        <div className={estilos.cargarMas}>
                            <button type="button" className={estilos.botonMas} onClick={cargarMas} disabled={cargandoMas}>
                                {cargandoMas ? 'Trayendo más...' : 'Ver más productos'}
                            </button>
                        </div>
                    )}
                </>
            )}

            <BarraFlotante
                onActualizar={() => setIntento((n) => n + 1)}
                actualizando={cargando}
                etiquetaActualizar="Actualizar el catálogo desde Django"
            />
        </section>
    );
}

export default Productos;
