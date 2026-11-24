import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router-dom';
import {
    aprobarAjusteStock,
    extraerErroresDeCampo,
    getAjustesStock,
    getAlertasStock,
    getUsuarioActual,
    mensajeDeError,
    rechazarAjusteStock,
    tienePermiso,
} from '../../api/api';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina';
import AvisoError from '../../components/AvisoError/AvisoError';
import { BarraCarga } from '../../components/BarraCarga/BarraCarga';
import BarraFlotante from '../../components/BarraFlotante/BarraFlotante';
import {
    IconoActualizar,
    IconoBuscar,
    IconoCerrar,
    IconoEscudo,
    IconoEstadoAlerta,
    IconoEstadoError,
    IconoEstadoInfo,
    IconoEstadoOk,
    IconoLote,
    IconoStock,
} from '../../components/Iconos/Iconos';
import {
    formatearCantidad,
    formatearFecha,
    formatearFechaHora,
    formatearNumero,
    normalizar,
} from '../../utils/formato';
import estilos from './StockOperativo.module.css';

const SUBFILTROS_ALERTA = [
    { id: 'TODAS', etiqueta: 'Todas' },
    { id: 'STOCK', etiqueta: 'Stock' },
    { id: 'VENCIMIENTO', etiqueta: 'Vencimientos' },
];

const METADATA_ALERTA = {
    VENCIDO: { etiqueta: 'Vencido', clase: 'badgeError', icono: IconoEstadoError },
    SIN_STOCK: { etiqueta: 'Sin stock', clase: 'badgeError', icono: IconoEstadoError },
    POR_VENCER: { etiqueta: 'Por vencer', clase: 'badgeAviso', icono: IconoEstadoAlerta },
    STOCK_BAJO: { etiqueta: 'Stock bajo', clase: 'badgeAviso', icono: IconoEstadoAlerta },
};

const objetoSeguro = (valor) => (valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {});

const textoSeguro = (valor, fallback = '') => {
    if (valor == null) return fallback;
    if (typeof valor === 'string' || typeof valor === 'number') return String(valor);
    if (typeof valor === 'object') {
        if (valor.nombre && valor.apellido) {
            return `${valor.nombre} ${valor.apellido}`.trim();
        }
        const candidato = valor.nombre ?? valor.numero ?? valor.etiqueta ?? valor.titulo ?? valor.usuario;
        if (candidato != null && typeof candidato !== 'object') return String(candidato);
    }
    return fallback;
};

const formatearMotivo = (valor) => {
    const texto = textoSeguro(valor).trim();
    if (!texto) return '';
    const limpio = texto.replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (limpio === limpio.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(limpio)) {
        const minuscula = limpio.toLowerCase();
        return minuscula.charAt(0).toUpperCase() + minuscula.slice(1);
    }
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
};

function StockOperativo() {
    const location = useLocation();
    const usuario = getUsuarioActual();
    const puedeVerAlertas = tienePermiso(usuario, 'ver_stock');
    const puedeAutorizar = tienePermiso(usuario, 'autorizar_ajustes');

    const pestanaInicial = location.state?.pestana === 'AUTORIZACIONES' && puedeAutorizar
        ? 'AUTORIZACIONES'
        : puedeVerAlertas || !puedeAutorizar
            ? 'ALERTAS'
            : 'AUTORIZACIONES';

    const [pestanaEstado, setPestanaEstado] = useState({ key: location.key, valor: pestanaInicial });
    const pestana = pestanaEstado.key === location.key ? pestanaEstado.valor : pestanaInicial;
    const setPestana = (valor) => setPestanaEstado({ key: location.key, valor });

    const [tipoAlerta, setTipoAlerta] = useState('TODAS');
    const [busqueda, setBusqueda] = useState('');

    const [alertas, setAlertas] = useState([]);
    const [cargandoAlertas, setCargandoAlertas] = useState(puedeVerAlertas);
    const [errorAlertas, setErrorAlertas] = useState(null);

    const [ajustes, setAjustes] = useState([]);
    const [cargandoAjustes, setCargandoAjustes] = useState(puedeAutorizar);
    const [errorAjustes, setErrorAjustes] = useState(null);

    const [intento, setIntento] = useState(0);
    const [avisoExito, setAvisoExito] = useState('');
    const [errorAccion, setErrorAccion] = useState('');

    const [resolucion, setResolucion] = useState(null);
    const [enviandoResolucion, setEnviandoResolucion] = useState(false);
    const [errorModal, setErrorModal] = useState('');

    const dialogoRef = useRef(null);
    const idTituloModal = useId();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm({
        defaultValues: { observacion: '' },
        mode: 'onBlur',
        reValidateMode: 'onChange',
    });

    useEffect(() => {
        if (!puedeVerAlertas) {
            return undefined;
        }

        const controlador = new AbortController();

        async function cargarAlertas() {
            try {
                setCargandoAlertas(true);
                setErrorAlertas(null);
                const datos = await getAlertasStock({ tipo: tipoAlerta, signal: controlador.signal });
                if (!controlador.signal.aborted) {
                    setAlertas(Array.isArray(datos?.resultados) ? datos.resultados.filter(Boolean) : []);
                }
            } catch (err) {
                const msg = mensajeDeError(err, 'No pudimos cargar las alertas de stock.');
                if (msg && !controlador.signal.aborted) setErrorAlertas(msg);
            } finally {
                if (!controlador.signal.aborted) setCargandoAlertas(false);
            }
        }

        cargarAlertas();
        return () => controlador.abort();
    }, [puedeVerAlertas, tipoAlerta, intento]);

    useEffect(() => {
        if (!puedeAutorizar) {
            return undefined;
        }

        const controlador = new AbortController();

        async function cargarAjustes() {
            try {
                setCargandoAjustes(true);
                setErrorAjustes(null);
                const datos = await getAjustesStock({ estado: 'PENDIENTE', signal: controlador.signal });
                if (!controlador.signal.aborted) {
                    setAjustes(Array.isArray(datos?.resultados) ? datos.resultados.filter(Boolean) : []);
                }
            } catch (err) {
                const msg = mensajeDeError(err, 'No pudimos cargar los ajustes pendientes.');
                if (msg && !controlador.signal.aborted) setErrorAjustes(msg);
            } finally {
                if (!controlador.signal.aborted) setCargandoAjustes(false);
            }
        }

        cargarAjustes();
        return () => controlador.abort();
    }, [puedeAutorizar, intento]);

    useEffect(() => {
        const dialogo = dialogoRef.current;
        if (!dialogo) return;
        try {
            if (resolucion && !dialogo.open) dialogo.showModal();
            if (!resolucion && dialogo.open) dialogo.close();
        } catch {
            // Evita fallos si el navegador no soporta showModal en ese estado.
        }
    }, [resolucion]);

    const alertasSeguras = Array.isArray(alertas) ? alertas.filter(Boolean) : [];
    const ajustesSeguros = Array.isArray(ajustes) ? ajustes.filter(Boolean) : [];

    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    const alertasFiltradas = alertasSeguras.filter((alerta) => {
        if (palabras.length === 0) return true;
        const nombreProd = textoSeguro(alerta?.producto?.nombre ?? alerta?.producto);
        const numeroLote = textoSeguro(alerta?.lote?.numero ?? alerta?.lote);
        const texto = normalizar(
            `${nombreProd} ${textoSeguro(alerta?.detalle)} ${numeroLote} ${textoSeguro(alerta?.tipo)}`
        );
        return palabras.every((p) => texto.includes(p));
    });

    const abrirModalResolucion = (ajuste, accion) => {
        setErrorModal('');
        setErrorAccion('');
        reset({ observacion: '' });
        setResolucion({ ajuste, accion });
    };

    const cerrarModal = () => {
        if (enviandoResolucion) return;
        setResolucion(null);
    };

    const confirmarResolucion = async (datosForm) => {
        if (!resolucion?.ajuste) return;
        const { ajuste, accion } = resolucion;
        const observacion = String(datosForm?.observacion ?? '').trim();

        try {
            setEnviandoResolucion(true);
            setErrorModal('');
            setAvisoExito('');

            if (accion === 'APROBAR') {
                await aprobarAjusteStock(ajuste.id, observacion);
                setAvisoExito(`Aprobaste el ajuste #${ajuste.id} y se actualizó el stock.`);
            } else {
                await rechazarAjusteStock(ajuste.id, observacion);
                setAvisoExito(`Rechazaste el ajuste #${ajuste.id} dejando constancia en auditoría.`);
            }

            setResolucion(null);
            setIntento((n) => n + 1);
            window.dispatchEvent(new Event('cafeto:estado-actualizar'));
        } catch (err) {
            const erroresCampo = extraerErroresDeCampo(err);
            if (erroresCampo?.observacion) {
                setError('observacion', { type: 'server', message: erroresCampo.observacion });
            } else {
                const detalle = err?.response?.data?.detail;
                setErrorModal(detalle || mensajeDeError(err, 'No pudimos resolver este ajuste.'));
            }
        } finally {
            setEnviandoResolucion(false);
        }
    };

    const cargandoActual = pestana === 'ALERTAS' ? cargandoAlertas : cargandoAjustes;

    return (
        <section className={estilos.pagina}>
            <BarraCarga
                activa={cargandoAlertas || cargandoAjustes || enviandoResolucion}
                etiqueta="Actualizando stock operativo"
            />

            <EncabezadoPagina
                compacto
                etiqueta="Control operativo"
                titulo="Stock: alertas y autorizaciones"
                subtitulo="Seguí qué vence primero, faltantes de stock y resolvé ajustes pendientes con doble control."
            >
                <button
                    type="button"
                    className={estilos.botonSecundario}
                    onClick={() => setIntento((n) => n + 1)}
                    disabled={cargandoActual}
                >
                    <IconoActualizar size={17} />
                    <span>Actualizar</span>
                </button>
            </EncabezadoPagina>

            <div className={estilos.pestanasPrincipales} role="tablist" aria-label="Secciones de stock">
                <button
                    type="button"
                    role="tab"
                    aria-selected={pestana === 'ALERTAS'}
                    className={`${estilos.pestana} ${pestana === 'ALERTAS' ? estilos.pestanaActiva : ''}`}
                    onClick={() => setPestana('ALERTAS')}
                >
                    <IconoStock size={18} />
                    <span>Alertas de stock y vencimientos</span>
                    {puedeVerAlertas && (
                        <span className={estilos.conteo}>{formatearNumero(alertasSeguras.length)}</span>
                    )}
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={pestana === 'AUTORIZACIONES'}
                    className={`${estilos.pestana} ${pestana === 'AUTORIZACIONES' ? estilos.pestanaActiva : ''}`}
                    onClick={() => setPestana('AUTORIZACIONES')}
                >
                    <IconoEscudo size={18} />
                    <span>Autorizaciones pendientes</span>
                    {puedeAutorizar && (
                        <span className={estilos.conteo}>{formatearNumero(ajustesSeguros.length)}</span>
                    )}
                </button>
            </div>

            {avisoExito && (
                <div className={estilos.avisoExito} role="status">
                    <IconoEstadoOk size={17} />
                    <span>{avisoExito}</span>
                </div>
            )}

            {errorAccion && (
                <AvisoError
                    titulo="No pudimos completar la acción"
                    mensaje={errorAccion}
                    onReintentar={() => setErrorAccion('')}
                />
            )}

            {pestana === 'ALERTAS' ? (
                !puedeVerAlertas ? (
                    <div className={estilos.sinPermiso} role="status">
                        <IconoEstadoInfo size={20} />
                        <div>
                            <strong>Sin permiso para ver alertas de stock</strong>
                            <p>Tu perfil no tiene habilitado el permiso de consulta de stock en este momento.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={estilos.barraFiltros}>
                            <div className={estilos.subfiltros} role="group" aria-label="Filtrar alertas por tipo">
                                {SUBFILTROS_ALERTA.map((sub) => (
                                    <button
                                        key={sub.id}
                                        type="button"
                                        aria-pressed={tipoAlerta === sub.id}
                                        className={`${estilos.subfiltro} ${tipoAlerta === sub.id ? estilos.subfiltroActivo : ''}`}
                                        onClick={() => setTipoAlerta(sub.id)}
                                    >
                                        {sub.etiqueta}
                                    </button>
                                ))}
                            </div>

                            <div className={estilos.buscador}>
                                <span className={estilos.iconoBuscar} aria-hidden="true">
                                    <IconoBuscar size={16} />
                                </span>
                                <input
                                    type="search"
                                    className={estilos.inputBuscar}
                                    placeholder="Buscar por producto, lote o detalle..."
                                    aria-label="Buscar en alertas de stock"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                                {busqueda && (
                                    <button
                                        type="button"
                                        className={estilos.limpiar}
                                        onClick={() => setBusqueda('')}
                                        aria-label="Limpiar búsqueda"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>

                        {errorAlertas ? (
                            <AvisoError
                                titulo="No pudimos cargar las alertas"
                                mensaje={errorAlertas}
                                onReintentar={() => setIntento((n) => n + 1)}
                                reintentando={cargandoAlertas}
                            />
                        ) : cargandoAlertas && alertasSeguras.length === 0 ? (
                            <div className={estilos.esqueletoLista} aria-busy="true">
                                <div className={estilos.filaEsqueleto} />
                                <div className={estilos.filaEsqueleto} />
                                <div className={estilos.filaEsqueleto} />
                            </div>
                        ) : alertasFiltradas.length === 0 ? (
                            busqueda.trim() ? (
                                <div className={estilos.vacioBusqueda} role="status">
                                    <div className={estilos.vacioMensaje}>
                                        <IconoBuscar size={20} />
                                        <span>
                                            No hay alertas que coincidan con &quot;{busqueda.trim()}&quot;.
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className={estilos.botonLimpiarVacio}
                                        onClick={() => setBusqueda('')}
                                    >
                                        Limpiar búsqueda
                                    </button>
                                </div>
                            ) : (
                                <div className={estilos.todoEnOrden}>
                                    <IconoEstadoOk size={20} />
                                    <span>Todo en orden: no hay alertas activas para este filtro.</span>
                                </div>
                            )
                        ) : (
                            <ul className={`${estilos.listaAlertas} ${cargandoAlertas ? estilos.actualizando : ''}`}>
                                {alertasFiltradas.map((alerta, idx) => {
                                    const tipoAlertaItem = textoSeguro(alerta?.tipo, 'ALERTA');
                                    const meta = METADATA_ALERTA[tipoAlertaItem] || {
                                        etiqueta: tipoAlertaItem,
                                        clase: 'badgeAviso',
                                        icono: IconoEstadoAlerta,
                                    };
                                    const Icono = meta.icono || IconoEstadoAlerta;
                                    const producto = typeof alerta?.producto === 'object'
                                        ? objetoSeguro(alerta.producto)
                                        : { nombre: textoSeguro(alerta?.producto, 'Producto') };
                                    const loteObj = alerta?.lote && typeof alerta.lote === 'object' ? alerta.lote : null;
                                    const loteTexto = textoSeguro(alerta?.lote);
                                    const detalleAlerta = textoSeguro(alerta?.detalle);

                                    return (
                                        <li key={alerta?.id ?? `alerta-${idx}`} className={estilos.itemAlerta}>
                                            <div className={estilos.alertaPrincipal}>
                                                <div className={estilos.alertaCabecera}>
                                                    <span className={`${estilos.badge} ${estilos[meta.clase] || estilos.badgeAviso}`}>
                                                        <Icono size={13} />
                                                        <span>{meta.etiqueta}</span>
                                                    </span>
                                                    <h2 className={estilos.productoAlerta}>
                                                        {textoSeguro(producto.nombre, 'Producto')}
                                                        {producto.presentacion ? ` · ${textoSeguro(producto.presentacion)}` : ''}
                                                    </h2>
                                                </div>

                                                {detalleAlerta && (
                                                    <p className={estilos.detalleAlerta}>{detalleAlerta}</p>
                                                )}

                                                <div className={estilos.metaAlerta}>
                                                    {producto.stock_actual != null && (
                                                        <span>
                                                            Stock actual: <strong>{formatearCantidad(producto.stock_actual, producto.unidad)}</strong>
                                                        </span>
                                                    )}
                                                    {(loteObj || loteTexto) && (
                                                        <span className={estilos.metaLote}>
                                                            <IconoLote size={14} />
                                                            <span>
                                                                {loteObj
                                                                    ? `${loteObj.numero ? `Lote ${textoSeguro(loteObj.numero)}` : 'Lote'}${
                                                                        loteObj.cantidad != null
                                                                            ? ` (${formatearCantidad(loteObj.cantidad, producto.unidad || 'UNIDAD')})`
                                                                            : ''
                                                                    }`
                                                                    : `Lote ${loteTexto}`}
                                                            </span>
                                                        </span>
                                                    )}
                                                    {alerta?.fecha && (
                                                        <span>Fecha: {formatearFecha(alerta.fecha)}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {producto.id && (
                                                <Link to={`/productos/${producto.id}`} className={estilos.enlaceProducto}>
                                                    Ver producto y lotes <span aria-hidden="true">→</span>
                                                </Link>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </>
                )
            ) : !puedeAutorizar ? (
                <div className={estilos.sinPermiso} role="status">
                    <IconoEstadoInfo size={20} />
                    <div>
                        <strong>Sin permiso para autorizar ajustes</strong>
                        <p>
                            Esta pestaña está reservada para perfiles con permiso de autorización por regla de doble control.
                        </p>
                    </div>
                </div>
            ) : errorAjustes ? (
                <AvisoError
                    titulo="No pudimos cargar las autorizaciones"
                    mensaje={errorAjustes}
                    onReintentar={() => setIntento((n) => n + 1)}
                    reintentando={cargandoAjustes}
                />
            ) : cargandoAjustes && ajustesSeguros.length === 0 ? (
                <div className={estilos.esqueletoLista} aria-busy="true">
                    <div className={estilos.filaEsqueleto} />
                    <div className={estilos.filaEsqueleto} />
                </div>
            ) : ajustesSeguros.length === 0 ? (
                <div className={estilos.todoEnOrden}>
                    <IconoEstadoOk size={20} />
                    <span>No hay ajustes de stock pendientes de autorización.</span>
                </div>
            ) : (
                <div className={`${estilos.listaAjustes} ${cargandoAjustes ? estilos.actualizando : ''}`}>
                    {ajustesSeguros.map((ajuste, idx) => {
                        const ajusteId = ajuste?.id ?? `ajuste-${idx}`;
                        const renglones = Array.isArray(ajuste?.renglones) ? ajuste.renglones.filter(Boolean) : [];
                        const bloqueado = ajuste?.puede_aprobar === false;
                        const motivoTexto = formatearMotivo(ajuste?.motivo);
                        const detalleTexto = textoSeguro(ajuste?.detalle);

                        return (
                            <article key={ajusteId} className={estilos.bloqueAjuste}>
                                <header className={estilos.cabeceraAjuste}>
                                    <div className={estilos.ajusteTitular}>
                                        <span className={`${estilos.badge} ${estilos.badgeAviso}`}>
                                            <IconoEstadoAlerta size={13} />
                                            <span>{textoSeguro(ajuste?.estado, 'PENDIENTE')}</span>
                                        </span>
                                        <h2 className={estilos.tituloAjuste}>
                                            {textoSeguro(ajuste?.tipo, 'Ajuste de stock')} #{ajuste?.id ?? idx + 1}
                                        </h2>
                                    </div>
                                    <div className={estilos.ajusteMeta}>
                                        <span>Cargado por: <strong>{textoSeguro(ajuste?.cargado_por, 'Equipo')}</strong></span>
                                        <span>{formatearFechaHora(ajuste?.fecha)}</span>
                                    </div>
                                </header>

                                {(motivoTexto || detalleTexto) && (
                                    <div className={estilos.ajusteMotivos}>
                                        {motivoTexto && (
                                            <p>
                                                <strong>Motivo:</strong> {motivoTexto}
                                            </p>
                                        )}
                                        {detalleTexto && <p>{detalleTexto}</p>}
                                    </div>
                                )}

                                {renglones.length > 0 && (
                                    <div className={estilos.tablaContenedor}>
                                        <table className={estilos.tablaRenglones}>
                                            <thead>
                                                <tr>
                                                    <th scope="col">Producto</th>
                                                    <th scope="col">Lote</th>
                                                    <th scope="col">Teórico</th>
                                                    <th scope="col">Contado</th>
                                                    <th scope="col">Diferencia / Cantidad</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {renglones.map((r, idxRenglon) => {
                                                    const nombreProd = textoSeguro(r?.producto, '—');
                                                    const destinoTexto = textoSeguro(r?.destino);
                                                    const loteRenglon = textoSeguro(r?.lote, '—');
                                                    const unidadRenglon =
                                                        r?.unidad ??
                                                        r?.unidad_medida ??
                                                        (typeof r?.producto === 'object'
                                                            ? (r.producto?.unidad ?? r.producto?.unidad_medida)
                                                            : null) ??
                                                        ajuste?.unidad ??
                                                        'UNIDAD';
                                                    const unidadDestino =
                                                        r?.unidad_destino ??
                                                        (typeof r?.destino === 'object'
                                                            ? (r.destino?.unidad ?? r.destino?.unidad_medida)
                                                            : null) ??
                                                        unidadRenglon;
                                                    return (
                                                        <tr key={`${ajusteId}-${idxRenglon}`}>
                                                            <td className={estilos.celdaFuerte}>
                                                                {nombreProd}
                                                                {destinoTexto ? ` → ${destinoTexto}` : ''}
                                                            </td>
                                                            <td>{loteRenglon}</td>
                                                            <td>{r?.teorica != null ? formatearCantidad(r.teorica, unidadRenglon) : '—'}</td>
                                                            <td>{r?.contada != null ? formatearCantidad(r.contada, unidadRenglon) : '—'}</td>
                                                            <td className={estilos.celdaFuerte}>
                                                                {r?.diferencia != null
                                                                    ? (Number(r.diferencia) > 0
                                                                        ? `+${formatearCantidad(r.diferencia, unidadRenglon)}`
                                                                        : formatearCantidad(r.diferencia, unidadRenglon))
                                                                    : r?.cantidad != null
                                                                        ? formatearCantidad(r.cantidad, unidadRenglon)
                                                                        : r?.cantidad_destino != null
                                                                            ? formatearCantidad(r.cantidad_destino, unidadDestino)
                                                                            : '—'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <footer className={estilos.pieAjuste}>
                                    {bloqueado && (
                                        <p className={estilos.notaDobleControl} role="status">
                                            <IconoEstadoInfo size={16} />
                                            <span>
                                                {ajuste?.propio
                                                    ? 'Este ajuste lo cargaste vos: por regla de doble control debe aprobarlo o rechazarlo otro integrante.'
                                                    : 'Tu perfil no puede aprobar este ajuste en este momento.'}
                                            </span>
                                        </p>
                                    )}

                                    <div className={estilos.accionesAjuste}>
                                        <button
                                            type="button"
                                            className={estilos.botonRechazar}
                                            disabled={bloqueado}
                                            onClick={() => abrirModalResolucion(ajuste, 'RECHAZAR')}
                                        >
                                            <IconoEstadoError size={15} />
                                            <span>Rechazar</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={estilos.botonPrincipal}
                                            disabled={bloqueado}
                                            onClick={() => abrirModalResolucion(ajuste, 'APROBAR')}
                                        >
                                            <IconoEstadoOk size={15} />
                                            <span>Aprobar ajuste</span>
                                        </button>
                                    </div>
                                </footer>
                            </article>
                        );
                    })}
                </div>
            )}

            <dialog
                ref={dialogoRef}
                className={estilos.dialogo}
                aria-labelledby={idTituloModal}
                onCancel={(e) => {
                    e.preventDefault();
                    cerrarModal();
                }}
                onClick={(e) => {
                    if (e.target === dialogoRef.current) cerrarModal();
                }}
            >
                {resolucion && (
                    <div className={estilos.cajaDialogo}>
                        <header className={estilos.cabeceraModal}>
                            <div>
                                <span className={estilos.etiquetaModal}>
                                    Doble control · Ajuste #{resolucion?.ajuste?.id ?? '—'}
                                </span>
                                <h2 id={idTituloModal} className={estilos.tituloModal}>
                                    {resolucion?.accion === 'APROBAR'
                                        ? '¿Aprobás este ajuste?'
                                        : '¿Rechazás este ajuste?'}
                                </h2>
                            </div>
                            <button
                                type="button"
                                className={estilos.botonCerrarModal}
                                onClick={cerrarModal}
                                disabled={enviandoResolucion}
                                aria-label="Cerrar ventana"
                            >
                                <IconoCerrar size={18} />
                            </button>
                        </header>

                        <p className={estilos.textoModal}>
                            {resolucion?.accion === 'APROBAR'
                                ? 'Al aprobarlo se aplicarán las variaciones de stock indicadas en el ajuste.'
                                : 'Al rechazarlo no se modifica el stock. Dejá el motivo claro para el registro de auditoría.'}
                        </p>

                        {errorModal && (
                            <div className={estilos.errorForm} role="alert">
                                <IconoEstadoError size={16} />
                                <span>{errorModal}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(confirmarResolucion)} className={estilos.formularioModal} noValidate>
                            <div className={estilos.campo}>
                                <label htmlFor="ajuste-observacion" className={estilos.label}>
                                    {resolucion?.accion === 'RECHAZAR'
                                        ? 'Motivo del rechazo (obligatorio)'
                                        : 'Observación (opcional)'}
                                </label>
                                <textarea
                                    id="ajuste-observacion"
                                    rows={3}
                                    className={`${estilos.textarea} ${errors.observacion ? estilos.inputError : ''}`}
                                    placeholder={
                                        resolucion?.accion === 'RECHAZAR'
                                            ? 'Explicá por qué se rechaza este ajuste...'
                                            : 'Anotá una aclaración si hace falta...'
                                    }
                                    aria-invalid={errors.observacion ? 'true' : 'false'}
                                    aria-describedby={errors.observacion ? 'error-ajuste-obs' : undefined}
                                    disabled={enviandoResolucion}
                                    {...register('observacion', {
                                        validate: (valor) => {
                                            if (resolucion?.accion === 'RECHAZAR' && String(valor ?? '').trim() === '') {
                                                return 'Ingresá una observación para justificar el rechazo.';
                                            }
                                            return true;
                                        },
                                        maxLength: { value: 400, message: 'No puede superar los 400 caracteres.' },
                                    })}
                                />
                                {errors.observacion && (
                                    <p id="error-ajuste-obs" className={estilos.mensajeError} role="alert">
                                        <IconoEstadoError size={14} />
                                        <span>{errors.observacion.message}</span>
                                    </p>
                                )}
                            </div>

                            <div className={estilos.accionesModal}>
                                <button
                                    type="button"
                                    className={estilos.botonSecundario}
                                    onClick={cerrarModal}
                                    disabled={enviandoResolucion}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={resolucion.accion === 'RECHAZAR' ? estilos.botonPeligroSolido : estilos.botonPrincipal}
                                    disabled={enviandoResolucion}
                                >
                                    {enviandoResolucion
                                        ? 'Confirmando...'
                                        : resolucion.accion === 'APROBAR'
                                            ? 'Confirmar aprobación'
                                            : 'Confirmar rechazo'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </dialog>

            <BarraFlotante
                onActualizar={() => setIntento((n) => n + 1)}
                actualizando={cargandoActual}
                etiquetaActualizar="Actualizar alertas y autorizaciones"
            />
        </section>
    );
}

export default StockOperativo;
