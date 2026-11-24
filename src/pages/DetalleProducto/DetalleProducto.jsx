import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getProductos, mensajeDeError, URL_WEB_DJANGO } from '../../api/api';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina';
import AvisoError from '../../components/AvisoError/AvisoError';
import { BarraCarga } from '../../components/BarraCarga/BarraCarga';
import Tooltip from '../../components/Tooltip/Tooltip';
import {
    IconoEstadoError,
    IconoEstadoOk,
    IconoExterno,
    IconoVolver,
} from '../../components/Iconos/Iconos';
import { formatearPesos } from '../../utils/formato';
import iconoCafeto from '../../assets/cafeto-icono-ambar.svg';
import estilos from './DetalleProducto.module.css';

const SECCIONES_BUSQUEDA = [
    { valor: 'CAFETERIA', nombre: 'Cafetería' },
    { valor: 'MINISUPER', nombre: 'Minisúper' },
];

const URL_PRODUCTOS_WEB = `${URL_WEB_DJANGO}/stock/productos/`;
const MAX_PAGINAS_POR_SECCION = 25;

function DetalleProducto() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

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

                for (const seccion of SECCIONES_BUSQUEDA) {
                    let pagina = 1;
                    let seguir = true;

                    while (seguir && pagina <= MAX_PAGINAS_POR_SECCION) {
                        const datos = await getProductos({
                            seccion: seccion.valor,
                            pagina,
                            signal: controlador.signal,
                        });
                        const hallado = datos.resultados.find((item) => String(item.id) === String(id));
                        if (hallado) {
                            setProductoRemoto(hallado);
                            setSeccionRemota(seccion.nombre);
                            return;
                        }
                        seguir = datos.hayMas;
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
    }, [id, intento, productoInicial]);

    const volverAProductos = () => navigate('/productos');
    const usarFoto = Boolean(producto?.imagen) && !falloFoto;
    const tieneOferta = producto?.precio_oferta != null;

    return (
        <section>
            <BarraCarga activa={cargando} etiqueta="Cargando detalle del producto" />

            <EncabezadoPagina
                volverA="/productos"
                textoVolver="Volver a productos"
                etiqueta={producto?.rubro?.nombre || 'Detalle del catálogo'}
                titulo={producto?.nombre || 'Producto'}
                subtitulo={
                    producto
                        ? 'Información completa de precio, rubro, marca y disponibilidad actual.'
                        : 'Consultando los datos del producto en el catálogo de Django.'
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
                    <button type="button" className={estilos.botonVolver} onClick={volverAProductos}>
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
                    <button type="button" className={estilos.botonVolver} onClick={volverAProductos}>
                        <IconoVolver size={17} />
                        <span>Volver a productos</span>
                    </button>
                </div>
            )}

            {!cargando && !error && producto && (
                <article className={estilos.ficha}>
                    <div className={estilos.columnaFoto}>
                        <div className={estilos.marcoFoto}>
                            <img
                                src={usarFoto ? producto.imagen : iconoCafeto}
                                alt={usarFoto ? producto.nombre : 'Producto sin foto disponible'}
                                className={usarFoto ? estilos.foto : estilos.placeholder}
                                onError={() => setFalloFoto(true)}
                            />
                            {tieneOferta && (
                                <span className={estilos.badgeOferta}>
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
                                    className={`${estilos.badge} ${producto.disponible ? estilos.disponible : estilos.agotado}`}
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
                            <div className={estilos.dato}>
                                <dt>Código interno</dt>
                                <dd>#{producto.id}</dd>
                            </div>
                        </dl>

                        <div className={estilos.acciones}>
                            <button type="button" className={estilos.botonVolver} onClick={volverAProductos}>
                                <IconoVolver size={17} />
                                <span>Volver a productos</span>
                            </button>

                            <Tooltip
                                texto="Abre el catálogo completo en Django para editar precios o stock"
                                posicion="arriba"
                            >
                                <a
                                    href={URL_PRODUCTOS_WEB}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={estilos.botonDjango}
                                >
                                    <span>Gestionar en Django</span>
                                    <IconoExterno size={17} />
                                </a>
                            </Tooltip>
                        </div>
                    </div>
                </article>
            )}
        </section>
    );
}

export default DetalleProducto;
