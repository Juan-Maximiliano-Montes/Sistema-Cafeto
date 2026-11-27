import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    getLotesProducto,
    getProductos,
    getProductosStock,
    getUsuarioActual,
    mensajeDeError,
    tienePermiso,
    URL_WEB_DJANGO,
} from '../../api/api';
import { useNotificacion } from '../../hooks/useNotificacion';
import { useTema } from '../../hooks/useTema';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina';
import AvisoError from '../../components/AvisoError/AvisoError';
import { BarraCarga } from '../../components/BarraCarga/BarraCarga';
import Tooltip from '../../components/Tooltip/Tooltip';
import {
    IconoEstadoAlerta,
    IconoEstadoError,
    IconoEstadoInfo,
    IconoEstadoOk,
    IconoExterno,
    IconoLote,
    IconoVolver,
} from '../../components/Iconos/Iconos';
import { formatearCantidad, formatearFecha, formatearNumero, formatearPesos } from '../../utils/formato';
import isotipoBlanco from '../../assets/cafeto-isotipo-blanco.svg';
import isotipoNegro from '../../assets/cafeto-isotipo-negro.svg';
import estilos from './DetalleProducto.module.css';

const SECCIONES_BUSQUEDA = [
    { valor: 'CAFETERIA', nombre: 'Cafetería' },
    { valor: 'MINISUPER', nombre: 'Minisúper' },
];

const URL_PRODUCTOS_WEB = `${URL_WEB_DJANGO}/stock/productos/`;
const MAX_PAGINAS_POR_SECCION = 25;

function estadoVencimientoLote(dias) {
    if (dias == null) {
        return { texto: 'Sin fecha', clase: estilos.loteNeutro, icono: IconoEstadoInfo };
    }
    if (dias < 0) {
        return { texto: `Vencido (${Math.abs(dias)} d)`, clase: estilos.loteError, icono: IconoEstadoError };
    }
    if (dias === 0) {
        return { texto: 'Vence hoy', clase: estilos.loteError, icono: IconoEstadoError };
    }
    if (dias <= 15) {
        return { texto: `Por vencer (${dias} d)`, clase: estilos.loteAviso, icono: IconoEstadoAlerta };
    }
    return { texto: `${dias} días`, clase: estilos.loteOk, icono: IconoEstadoOk };
}

function DetalleProducto() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const usuario = getUsuarioActual();
    const puedeVerStock = tienePermiso(usuario, 'ver_productos');
    const { esClaro } = useTema();
    const { notificar } = useNotificacion();
    const isotipo = esClaro ? isotipoNegro : isotipoBlanco;

    const copiarCodigoBarras = async (codigo) => {
        if (!codigo) return;
        try {
            await navigator.clipboard.writeText(String(codigo));
            notificar({
                texto: `Código de barras copiado: ${codigo}`,
                tono: 'exito',
            });
        } catch {
            notificar({
                texto: 'No pudimos acceder al portapapeles en este navegador.',
                tono: 'aviso',
            });
        }
    };

    const productoInicial =
        location.state?.producto && String(location.state.producto.id) === String(id)
            ? location.state.producto
            : null;

    const [productoRemoto, setProductoRemoto] = useState(null);
    const [seccionRemota, setSeccionRemota] = useState(null);
    const [cargandoRemoto, setCargandoRemoto] = useState(!productoInicial);
    const [error, setError] = useState(null);
    const [noEncontrado, setNoEncontrado] = useState(false);
    const [falloFoto, setFalloFoto] = useState(false);
    const [intento, setIntento] = useState(0);

    const [lotes, setLotes] = useState([]);
    const [cargandoLotes, setCargandoLotes] = useState(true);
    const [errorLotes, setErrorLotes] = useState(null);

    const producto = productoInicial || productoRemoto;
    const seccionEncontrada = productoInicial ? (location.state?.seccion || null) : seccionRemota;
    const cargando = !productoInicial && cargandoRemoto;

    useEffect(() => {
        if (productoInicial) {
            return undefined;
        }

        const controlador = new AbortController();

        async function buscarProducto() {
            try {
                setCargandoRemoto(true);
                setError(null);
                setNoEncontrado(false);
                setFalloFoto(false);

                if (puedeVerStock) {
                    let pagina = 1;
                    let seguir = true;
                    while (seguir && pagina <= MAX_PAGINAS_POR_SECCION) {
                        const datosStock = await getProductosStock({ pagina, signal: controlador.signal });
                        const listaStock = Array.isArray(datosStock?.resultados) ? datosStock.resultados : [];
                        const halladoStock = listaStock.find((item) => String(item?.id) === String(id));
                        if (halladoStock) {
                            setProductoRemoto(halladoStock);
                            setSeccionRemota('Stock interno');
                            return;
                        }
                        seguir = Boolean(datosStock?.hayMas);
                        pagina += 1;
                    }
                }

                for (const seccion of SECCIONES_BUSQUEDA) {
                    let pagina = 1;
                    let seguir = true;

                    while (seguir && pagina <= MAX_PAGINAS_POR_SECCION) {
                        const datos = await getProductos({
                            seccion: seccion.valor,
                            pagina,
                            signal: controlador.signal,
                        });
                        const lista = Array.isArray(datos?.resultados) ? datos.resultados : [];
                        const hallado = lista.find((item) => String(item?.id) === String(id));
                        if (hallado) {
                            setProductoRemoto(hallado);
                            setSeccionRemota(seccion.nombre);
                            return;
                        }
                        seguir = Boolean(datos?.hayMas);
                        pagina += 1;
                    }
                }

                setProductoRemoto(null);
                setNoEncontrado(true);
            } catch (err) {
                const mensaje = mensajeDeError(err, 'No pudimos cargar el detalle de este producto.');
                if (mensaje) setError(mensaje);
            } finally {
                if (!controlador.signal.aborted) setCargandoRemoto(false);
            }
        }

        buscarProducto();
        return () => controlador.abort();
    }, [id, intento, productoInicial, puedeVerStock]);

    useEffect(() => {
        const controlador = new AbortController();

        async function cargarLotes() {
            try {
                setCargandoLotes(true);
                setErrorLotes(null);
                const datos = await getLotesProducto(id, { signal: controlador.signal });
                if (!controlador.signal.aborted) {
                    setLotes(Array.isArray(datos?.resultados) ? datos.resultados.filter(Boolean) : []);
                }
            } catch (err) {
                if (!controlador.signal.aborted) {
                    const mensaje = mensajeDeError(err, 'No pudimos consultar los lotes por orden de salida.');
                    if (mensaje) setErrorLotes(mensaje);
                }
            } finally {
                if (!controlador.signal.aborted) setCargandoLotes(false);
            }
        }

        cargarLotes();
        return () => controlador.abort();
    }, [id, intento]);

    const lotesSeguros = Array.isArray(lotes) ? lotes.filter(Boolean) : [];

    const rutaVolver =
        typeof location.state?.volverA === 'string' && location.state.volverA.startsWith('/productos')
            ? location.state.volverA
            : '/productos';
    const volverAProductos = () => navigate(rutaVolver);
    const usarFoto = Boolean(producto?.imagen) && !falloFoto;
    const tieneOferta = producto?.precio_oferta != null;

    return (
        <section className={estilos.pagina}>
            <BarraCarga activa={cargando || cargandoLotes} etiqueta="Cargando detalle y lotes del producto" />

            <EncabezadoPagina
                volverA={rutaVolver}
                textoVolver="Volver a productos"
                etiqueta={producto?.rubro?.nombre || 'Detalle del catálogo'}
                titulo={producto?.nombre || 'Producto'}
                subtitulo={
                    producto
                        ? 'Información de precio, rubro, marca, disponibilidad y vencimientos por orden de salida.'
                        : 'Consultando los datos del producto en el sistema de Cafeto.'
                }
            />

            {cargando && !producto && (
                <div className={estilos.esqueleto} aria-busy="true" role="status" aria-live="polite">
                    <span className={estilos.oculto}>Cargando detalle del producto...</span>
                    <div className={`${estilos.bloque} ${estilos.esqueletoFoto}`} aria-hidden="true" />
                    <div className={estilos.esqueletoInfo} aria-hidden="true">
                        <div className={`${estilos.bloque} ${estilos.lineaCorta}`} />
                        <div className={`${estilos.bloque} ${estilos.lineaTitulo}`} />
                        <div className={`${estilos.bloque} ${estilos.lineaTexto}`} />
                        <div className={`${estilos.bloque} ${estilos.lineaTexto}`} />
                    </div>
                </div>
            )}

            {!cargando && error && (
                <div className={estilos.bloqueAviso}>
                    <AvisoError
                        titulo="No pudimos mostrar este producto"
                        mensaje={error}
                        onReintentar={() => setIntento((n) => n + 1)}
                    />
                    <button type="button" className={`btn ${estilos.botonVolver}`} onClick={volverAProductos}>
                        <IconoVolver size={17} />
                        <span>Volver a productos</span>
                    </button>
                </div>
            )}

            {!cargando && !error && noEncontrado && (
                <div className={estilos.bloqueAviso}>
                    <AvisoError
                        titulo={`No encontramos el producto #${id}`}
                        mensaje="Puede que ya no esté publicado en Cafetería ni en Minisúper o que el enlace sea incorrecto."
                    />
                    <button type="button" className={`btn ${estilos.botonVolver}`} onClick={volverAProductos}>
                        <IconoVolver size={17} />
                        <span>Volver a productos</span>
                    </button>
                </div>
            )}

            {!cargando && !error && producto && (
                <>
                    <article className={estilos.ficha}>
                        <div className={estilos.columnaFoto}>
                            <div className={`${estilos.marcoFoto} ${!usarFoto ? estilos.marcoVacio : ''}`}>
                                {usarFoto ? (
                                    <img
                                        src={producto.imagen}
                                        alt={producto.nombre}
                                        className={estilos.foto}
                                        onError={() => setFalloFoto(true)}
                                    />
                                ) : (
                                    <div className={estilos.sinFoto}>
                                        <img src={isotipo} alt="" className={estilos.placeholder} />
                                        <span className={estilos.leyendaSinFoto}>Sin foto</span>
                                    </div>
                                )}
                                {tieneOferta && (
                                    <span className={`badge rounded-pill ${estilos.badgeOferta}`}>
                                        {producto.porcentaje_oferta ? `-${producto.porcentaje_oferta}%` : 'Oferta'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className={estilos.columnaDatos}>
                            <div className={estilos.cabeceraDatos}>
                                <span className={estilos.categoria}>
                                    {seccionEncontrada ? `${seccionEncontrada} · ` : ''}
                                    {producto.rubro?.nombre || 'Cafeto'}
                                </span>

                                <Tooltip
                                    esEtiqueta
                                    texto={
                                        producto.disponible
                                            ? 'Este producto tiene stock disponible para la venta.'
                                            : 'Por ahora no quedan unidades disponibles.'
                                    }
                                >
                                    <span
                                        className={`badge rounded-pill ${estilos.badge} ${producto.disponible ? estilos.disponible : estilos.agotado}`}
                                    >
                                        {producto.disponible ? <IconoEstadoOk size={14} /> : <IconoEstadoError size={14} />}
                                        <span>{producto.disponible ? 'Disponible' : 'Sin stock'}</span>
                                    </span>
                                </Tooltip>
                            </div>

                            <div className={estilos.cajaPrecio}>
                                {tieneOferta ? (
                                    <>
                                        <span className={estilos.etiquetaPrecio}>Precio de oferta</span>
                                        <div className={estilos.filaPrecios}>
                                            <span className={estilos.precioActual}>
                                                {formatearPesos(producto.precio_oferta)}
                                            </span>
                                            <span className={estilos.precioAnterior}>
                                                {formatearPesos(producto.precio)}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className={estilos.etiquetaPrecio}>Precio de lista</span>
                                        <span className={estilos.precioActual}>{formatearPesos(producto.precio)}</span>
                                    </>
                                )}
                            </div>

                            {producto.descripcion && (
                                <div className={estilos.bloqueDescripcion}>
                                    <h2 className={estilos.subtitulo}>Descripción</h2>
                                    <p className={estilos.descripcion}>{producto.descripcion}</p>
                                </div>
                            )}

                            <dl className={estilos.listaDatos}>
                                <div className={estilos.dato}>
                                    <dt>Rubro</dt>
                                    <dd>{producto.rubro?.nombre || 'Sin rubro asignado'}</dd>
                                </div>
                                <div className={estilos.dato}>
                                    <dt>Marca</dt>
                                    <dd>{producto.marca?.nombre || 'Elaboración propia / Sin marca'}</dd>
                                </div>
                                {producto.presentacion && (
                                    <div className={estilos.dato}>
                                        <dt>Presentación</dt>
                                        <dd>{producto.presentacion}</dd>
                                    </div>
                                )}
                                {producto.codigo_barras && (
                                    <div className={estilos.dato}>
                                        <dt>Código de barras</dt>
                                        <dd>
                                            <Tooltip texto="Clic para copiar el código de barras" posicion="arriba">
                                                <button
                                                    type="button"
                                                    className="iris-keycap"
                                                    onClick={() => copiarCodigoBarras(producto.codigo_barras)}
                                                    style={{ cursor: 'pointer', height: 'auto', padding: '4px 9px' }}
                                                >
                                                    {producto.codigo_barras}
                                                </button>
                                            </Tooltip>
                                        </dd>
                                    </div>
                                )}
                                {producto.stock_actual != null && (
                                    <div className={estilos.dato}>
                                        <dt>Stock actual</dt>
                                        <dd>
                                            {formatearCantidad(producto.stock_actual, producto.unidad)}
                                            {producto.stock_minimo != null && Number(producto.stock_minimo) > 0
                                                ? ` (mín. ${formatearNumero(producto.stock_minimo)})`
                                                : ''}
                                        </dd>
                                    </div>
                                )}
                                <div className={estilos.dato}>
                                    <dt>Código interno</dt>
                                    <dd>#{producto.id}</dd>
                                </div>
                            </dl>

                            <div className={estilos.acciones}>
                                <button type="button" className={`btn ${estilos.botonVolver}`} onClick={volverAProductos}>
                                    <IconoVolver size={17} />
                                    <span>Volver a productos</span>
                                </button>

                                <Tooltip
                                    texto="Abre el panel completo de Cafeto para editar precios o stock"
                                    posicion="arriba"
                                >
                                    <a
                                        href={URL_PRODUCTOS_WEB}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`btn ${estilos.botonPanelWeb}`}
                                    >
                                        <span>Abrir panel completo de Cafeto</span>
                                        <IconoExterno size={17} />
                                    </a>
                                </Tooltip>
                            </div>
                        </div>
                    </article>

                    <section className={estilos.seccionLotes} aria-labelledby="titulo-lotes-vencimientos">
                        <div className={estilos.cabeceraLotes}>
                            <div>
                                <span className={estilos.categoria}>Control de vencimientos</span>
                                <h2 id="titulo-lotes-vencimientos" className={estilos.tituloLotes}>
                                    <IconoLote size={20} />
                                    <span>Lotes y vencimientos por orden de salida</span>
                                </h2>
                            </div>
                            <span className={estilos.aclaracionVencimientos}>
                                Qué vence primero: ordenados del más próximo a vencer al más lejano.
                            </span>
                        </div>

                        {cargandoLotes && (
                            <p className={estilos.estadoLotes} role="status">
                                Consultando lotes disponibles...
                            </p>
                        )}

                        {!cargandoLotes && errorLotes && (
                            <p className={estilos.errorLotes} role="status">
                                <IconoEstadoInfo size={16} />
                                <span>{errorLotes}</span>
                            </p>
                        )}

                        {!cargandoLotes && !errorLotes && lotesSeguros.length === 0 && (
                            <p className={estilos.vacioLotes}>
                                Este producto no registra lotes con fecha de vencimiento cargada.
                            </p>
                        )}

                        {!cargandoLotes && !errorLotes && lotesSeguros.length > 0 && (
                            <div className={`table-responsive ${estilos.tablaContenedor}`}>
                                <table className={`table align-middle mb-0 ${estilos.tablaLotes}`}>
                                    <thead>
                                        <tr>
                                            <th scope="col">Número de lote</th>
                                            <th scope="col">Vencimiento</th>
                                            <th scope="col">Estado</th>
                                            <th scope="col">Cantidad disponible</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lotesSeguros.map((lote, idx) => {
                                            const estado = estadoVencimientoLote(lote?.dias);
                                            const Icono = estado.icono;
                                            return (
                                                <tr key={lote?.id ?? `lote-${idx}`}>
                                                    <td className={estilos.celdaFuerte}>
                                                        {lote?.numero || `Lote #${lote?.id ?? idx + 1}`}
                                                    </td>
                                                    <td>{formatearFecha(lote?.vence)}</td>
                                                    <td>
                                                        <span className={`badge rounded-pill ${estilos.badgeLote} ${estado.clase}`}>
                                                            <Icono size={13} />
                                                            <span>{estado.texto}</span>
                                                        </span>
                                                    </td>
                                                    <td className={estilos.celdaFuerte}>
                                                        {formatearCantidad(lote?.cantidad, producto?.unidad)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </section>
    );
}

export default DetalleProducto;
