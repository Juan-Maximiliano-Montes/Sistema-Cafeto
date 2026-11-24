import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getAjustesStock,
    getAlertasStock,
    getPanelDelDia,
    getProductos,
    getUsuarioActual,
    mensajeDeError,
    tienePermiso,
    URL_WEB_DJANGO,
} from '../../api/api';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina';
import AvisoError from '../../components/AvisoError/AvisoError';
import { BarraCarga, EsqueletoPanel } from '../../components/BarraCarga/BarraCarga';
import BarraFlotante from '../../components/BarraFlotante/BarraFlotante';
import {
    IconoActualizar,
    IconoCaja,
    IconoEscudo,
    IconoEstadoAlerta,
    IconoEstadoError,
    IconoEstadoInfo,
    IconoEstadoOk,
    IconoEstrella,
    IconoExterno,
    IconoMinisuper,
    IconoReportes,
    IconoStock,
    IconoTaza,
} from '../../components/Iconos/Iconos';
import { formatearNumero, formatearPesos } from '../../utils/formato';
import estilos from './Reportes.module.css';

const MAX_PAGINAS_CATALOGO = 10;
const MAX_RUBROS_VISIBLES = 8;
const URL_REPORTES_WEB = `${URL_WEB_DJANGO}/reportes/`;

const FILTROS_SECCION = [
    { id: 'TODO', etiqueta: 'Todo el catálogo', icono: <IconoEstrella size={16} /> },
    { id: 'CAFETERIA', etiqueta: 'Cafetería', icono: <IconoTaza size={16} /> },
    { id: 'MINISUPER', etiqueta: 'Minisúper', icono: <IconoMinisuper size={16} /> },
];

async function cargarSeccionMuestra(seccion, signal) {
    const acumulado = [];
    let pagina = 1;
    let seguir = true;

    while (seguir && pagina <= MAX_PAGINAS_CATALOGO) {
        const datos = await getProductos({ seccion, pagina, signal });
        const resultados = Array.isArray(datos?.resultados) ? datos.resultados.filter(Boolean) : [];
        acumulado.push(...resultados);
        seguir = Boolean(datos?.hayMas);
        pagina += 1;
    }

    return {
        items: acumulado,
        truncada: seguir,
    };
}

const precioVigente = (item) => Number(item?.precio_oferta ?? item?.precio ?? 0);

function Reportes() {
    const usuario = getUsuarioActual();
    const puedeVerAlertas = tienePermiso(usuario, 'ver_stock');
    const puedeAutorizar = tienePermiso(usuario, 'autorizar_ajustes');

    const [panel, setPanel] = useState(null);
    const [productosCafeteria, setProductosCafeteria] = useState([]);
    const [productosMinisuper, setProductosMinisuper] = useState([]);
    const [muestraTruncada, setMuestraTruncada] = useState(false);
    const [alertasStock, setAlertasStock] = useState(null);
    const [ajustesPendientes, setAjustesPendientes] = useState(null);

    const [cargando, setCargando] = useState(true);
    const [errorGeneral, setErrorGeneral] = useState(null);
    const [avisoParcial, setAvisoParcial] = useState(null);
    const [actualizado, setActualizado] = useState(null);
    const [seccionActiva, setSeccionActiva] = useState('TODO');
    const [intento, setIntento] = useState(0);

    useEffect(() => {
        const controlador = new AbortController();

        async function cargarReportes() {
            try {
                setCargando(true);
                setErrorGeneral(null);
                setAvisoParcial(null);

                const promesaAlertas = puedeVerAlertas
                    ? getAlertasStock({ tipo: 'TODAS', signal: controlador.signal })
                    : Promise.resolve(null);
                const promesaAjustes = puedeAutorizar
                    ? getAjustesStock({ estado: 'PENDIENTE', signal: controlador.signal })
                    : Promise.resolve(null);

                const [resPanel, resCafeteria, resMinisuper, resAlertas, resAjustes] = await Promise.allSettled([
                    getPanelDelDia({ signal: controlador.signal }),
                    cargarSeccionMuestra('CAFETERIA', controlador.signal),
                    cargarSeccionMuestra('MINISUPER', controlador.signal),
                    promesaAlertas,
                    promesaAjustes,
                ]);

                if (controlador.signal.aborted) return;

                const errores = [];

                if (resPanel.status === 'fulfilled') {
                    const valorPanel = resPanel.value || {};
                    setPanel({
                        indicadores: Array.isArray(valorPanel?.indicadores) ? valorPanel.indicadores.filter(Boolean) : [],
                        avisos: Array.isArray(valorPanel?.avisos) ? valorPanel.avisos.filter(Boolean) : [],
                    });
                } else {
                    const msg = mensajeDeError(resPanel.reason, 'No pudimos cargar los indicadores del día.');
                    if (msg) errores.push(msg);
                }

                let truncado = false;
                if (resCafeteria.status === 'fulfilled') {
                    const itemsCaf = Array.isArray(resCafeteria.value?.items) ? resCafeteria.value.items.filter(Boolean) : [];
                    setProductosCafeteria(itemsCaf);
                    truncado = truncado || Boolean(resCafeteria.value?.truncada);
                } else {
                    const msg = mensajeDeError(resCafeteria.reason, 'No pudimos cargar el catálogo de Cafetería.');
                    if (msg) errores.push(msg);
                }

                if (resMinisuper.status === 'fulfilled') {
                    const itemsMini = Array.isArray(resMinisuper.value?.items) ? resMinisuper.value.items.filter(Boolean) : [];
                    setProductosMinisuper(itemsMini);
                    truncado = truncado || Boolean(resMinisuper.value?.truncada);
                } else {
                    const msg = mensajeDeError(resMinisuper.reason, 'No pudimos cargar el catálogo de Minisúper.');
                    if (msg) errores.push(msg);
                }
                setMuestraTruncada(truncado);

                if (resAlertas.status === 'fulfilled') {
                    setAlertasStock(
                        Array.isArray(resAlertas.value?.resultados) ? resAlertas.value.resultados.filter(Boolean) : null
                    );
                } else {
                    const msg = mensajeDeError(resAlertas.reason, 'No pudimos consultar las alertas de stock.');
                    if (msg) errores.push(msg);
                }

                if (resAjustes.status === 'fulfilled') {
                    setAjustesPendientes(
                        Array.isArray(resAjustes.value?.resultados) ? resAjustes.value.resultados.filter(Boolean) : null
                    );
                } else {
                    const msg = mensajeDeError(resAjustes.reason, 'No pudimos consultar los ajustes pendientes.');
                    if (msg) errores.push(msg);
                }

                const todoFallo =
                    resPanel.status === 'rejected' &&
                    resCafeteria.status === 'rejected' &&
                    resMinisuper.status === 'rejected';

                if (todoFallo) {
                    setErrorGeneral(errores[0] || 'No pudimos cargar los datos de reportes.');
                } else if (errores.length > 0) {
                    setAvisoParcial('Algunos datos no terminaron de cargarse. Podés reintentar para completar la vista.');
                    setActualizado(new Date());
                } else {
                    setActualizado(new Date());
                }
            } catch (err) {
                if (!controlador.signal.aborted) {
                    setErrorGeneral(mensajeDeError(err, 'No pudimos cargar los datos de reportes.'));
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCargando(false);
                }
            }
        }

        cargarReportes();
        return () => controlador.abort();
    }, [intento, puedeVerAlertas, puedeAutorizar]);

    const recargar = () => setIntento((n) => n + 1);

    const productosSeleccionados = useMemo(() => {
        const caf = Array.isArray(productosCafeteria) ? productosCafeteria : [];
        const mini = Array.isArray(productosMinisuper) ? productosMinisuper : [];
        if (seccionActiva === 'CAFETERIA') return caf;
        if (seccionActiva === 'MINISUPER') return mini;
        return [...caf, ...mini];
    }, [seccionActiva, productosCafeteria, productosMinisuper]);

    const radiografia = useMemo(() => {
        const total = productosSeleccionados.length;
        if (total === 0) {
            return {
                total: 0,
                rubros: [],
                maxRubro: 0,
                disponibles: 0,
                porcentajeStock: 0,
                conFoto: 0,
                porcentajeFotos: 0,
                enOferta: 0,
                precioPromedio: 0,
                minimo: null,
                maximo: null,
            };
        }

        const conteoRubros = new Map();
        let disponibles = 0;
        let conFoto = 0;
        let enOferta = 0;
        let sumaPrecios = 0;
        let minimo = null;
        let maximo = null;

        for (const item of productosSeleccionados) {
            if (!item) continue;
            const nombreRubro = item?.rubro?.nombre?.trim() || 'Sin rubro';
            conteoRubros.set(nombreRubro, (conteoRubros.get(nombreRubro) || 0) + 1);

            if (item.disponible) disponibles += 1;
            if (item.imagen) conFoto += 1;
            if (item.precio_oferta != null) enOferta += 1;

            const precio = precioVigente(item);
            sumaPrecios += precio;
            if (!minimo || precio < minimo.precio) {
                minimo = { precio, nombre: item.nombre || 'Producto' };
            }
            if (!maximo || precio > maximo.precio) {
                maximo = { precio, nombre: item.nombre || 'Producto' };
            }
        }

        const ordenados = Array.from(conteoRubros.entries())
            .map(([nombre, cantidad]) => ({
                nombre,
                cantidad,
                porcentaje: Math.round((cantidad / total) * 100),
            }))
            .sort((a, b) => b.cantidad - a.cantidad);

        const visibles = ordenados.slice(0, MAX_RUBROS_VISIBLES);
        if (ordenados.length > MAX_RUBROS_VISIBLES) {
            const resto = ordenados
                .slice(MAX_RUBROS_VISIBLES)
                .reduce((acc, r) => acc + r.cantidad, 0);
            visibles.push({
                nombre: 'Otros rubros',
                cantidad: resto,
                porcentaje: Math.round((resto / total) * 100),
            });
        }

        const maxRubro = visibles.reduce((max, r) => Math.max(max, r.cantidad), 0);

        return {
            total,
            rubros: visibles,
            maxRubro,
            disponibles,
            porcentajeStock: Math.round((disponibles / total) * 100),
            conFoto,
            porcentajeFotos: Math.round((conFoto / total) * 100),
            enOferta,
            precioPromedio: sumaPrecios / total,
            minimo,
            maximo,
        };
    }, [productosSeleccionados]);

    const indicadores = Array.isArray(panel?.indicadores) ? panel.indicadores.filter(Boolean) : [];
    const avisos = Array.isArray(panel?.avisos) ? panel.avisos.filter(Boolean) : [];
    const cajas = indicadores.find((i) => i?.clave === 'CAJAS_ABIERTAS');
    const vendidoHoy = indicadores.find((i) => i?.formato === 'PESOS');
    const indicadoresExtra = indicadores.filter(
        (i) => i?.clave !== 'CAJAS_ABIERTAS' && i !== vendidoHoy
    );

    const abiertas = Number(cajas?.valor || 0);
    const urgentes = avisos.filter((a) => a?.tipo === 'error').length;
    const atencion = avisos.length - urgentes;
    const cantidadAlertasStock = Array.isArray(alertasStock) ? alertasStock.length : null;
    const cantidadAjustes = Array.isArray(ajustesPendientes) ? ajustesPendientes.length : null;
    const hayDatos = actualizado !== null;

    const conteoPorFiltro = {
        TODO: productosCafeteria.length + productosMinisuper.length,
        CAFETERIA: productosCafeteria.length,
        MINISUPER: productosMinisuper.length,
    };

    const etiquetaSeccionMuestra = seccionActiva === 'CAFETERIA'
        ? 'Cafetería'
        : seccionActiva === 'MINISUPER'
            ? 'Minisúper'
            : 'Cafetería y Minisúper';

    const textoMuestra = muestraTruncada
        ? `Muestra analizada: primeros ${formatearNumero(radiografia.total)} productos de ${etiquetaSeccionMuestra} (hasta ${MAX_PAGINAS_CATALOGO} páginas por sección)`
        : `Muestra analizada: ${formatearNumero(radiografia.total)} productos cargados de ${etiquetaSeccionMuestra}`;

    return (
        <section className={estilos.pagina}>
            <BarraCarga activa={cargando} etiqueta="Cargando indicadores y reportes..." />

            <EncabezadoPagina
                compacto
                etiqueta="Resumen del negocio"
                titulo="Reportes"
                subtitulo="Indicadores del turno, alertas de stock, autorizaciones pendientes y radiografía del catálogo."
            >
                <button type="button" className={estilos.botonSecundario} onClick={recargar} disabled={cargando}>
                    <IconoActualizar size={17} />
                    <span>{cargando && hayDatos ? 'Actualizando...' : 'Actualizar'}</span>
                </button>
            </EncabezadoPagina>

            {cargando && !hayDatos && <EsqueletoPanel />}

            {!cargando && errorGeneral && (
                <AvisoError
                    titulo="No pudimos cargar los reportes"
                    mensaje={errorGeneral}
                    onReintentar={recargar}
                    reintentando={cargando}
                />
            )}

            {hayDatos && !errorGeneral && (
                <div className={`${estilos.bloques} ${cargando ? estilos.actualizando : ''}`}>
                    {avisoParcial && (
                        <AvisoError
                            titulo="Carga parcial"
                            mensaje={avisoParcial}
                            onReintentar={recargar}
                            reintentando={cargando}
                        />
                    )}

                    <section className={estilos.bloque} aria-labelledby="titulo-kpis">
                        <div className={estilos.cabeceraBloque}>
                            <div>
                                <span className={estilos.etiquetaBloque}>Turno actual</span>
                                <h2 id="titulo-kpis" className={estilos.tituloBloque}>
                                    Indicadores clave del día
                                </h2>
                            </div>
                            {actualizado && (
                                <span className={estilos.horaActualizacion}>
                                    Actualizado {actualizado.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>

                        <div className={estilos.grillaKpi}>
                            <Link to="/cajas" className={`${estilos.kpiEnlace} ${estilos.kpiDestacado}`}>
                                <div className={estilos.kpiCabecera}>
                                    <span className={estilos.kpiIcono} aria-hidden="true">
                                        <IconoReportes size={20} />
                                    </span>
                                    <span className={estilos.kpiTitulo}>
                                        {vendidoHoy?.titulo || 'Vendido hoy'}
                                    </span>
                                </div>
                                <p className={estilos.kpiValor}>
                                    {vendidoHoy ? formatearPesos(vendidoHoy.valor) : 'Sin acceso'}
                                </p>
                                <p className={estilos.kpiDetalle}>
                                    {vendidoHoy?.detalle || 'Tu perfil no tiene permisos para ver montos de venta.'}
                                </p>
                            </Link>

                            <Link to="/cajas" className={estilos.kpiEnlace}>
                                <div className={estilos.kpiCabecera}>
                                    <span className={estilos.kpiIcono} aria-hidden="true">
                                        <IconoCaja size={20} />
                                    </span>
                                    <span className={estilos.kpiTitulo}>Cajas abiertas</span>
                                </div>
                                <div className={estilos.kpiFilaValor}>
                                    <p className={estilos.kpiValor}>
                                        {cajas ? formatearNumero(abiertas) : '—'}
                                    </p>
                                    {cajas ? (
                                        <span className={`${estilos.badge} ${abiertas > 0 ? estilos.badgeOk : estilos.badgePeligro}`}>
                                            {abiertas > 0 ? <IconoEstadoOk size={13} /> : <IconoEstadoError size={13} />}
                                            <span>{abiertas > 0 ? 'Activa' : 'Cerradas'}</span>
                                        </span>
                                    ) : (
                                        <span className={`${estilos.badge} ${estilos.badgeNeutro}`}>
                                            <IconoEstadoInfo size={13} />
                                            <span>Sin acceso</span>
                                        </span>
                                    )}
                                </div>
                                <p className={estilos.kpiDetalle}>
                                    {cajas?.detalle || 'Pedí permiso de caja para ver los turnos en curso.'}
                                </p>
                            </Link>

                            <Link
                                to="/cajas"
                                state={{ filtroAviso: 'URGENTES' }}
                                className={estilos.kpiEnlace}
                            >
                                <div className={estilos.kpiCabecera}>
                                    <span className={`${estilos.kpiIcono} ${urgentes > 0 ? estilos.iconoPeligro : estilos.iconoOk}`} aria-hidden="true">
                                        {urgentes > 0 ? <IconoEstadoError size={20} /> : <IconoEstadoOk size={20} />}
                                    </span>
                                    <span className={estilos.kpiTitulo}>Avisos urgentes</span>
                                </div>
                                <div className={estilos.kpiFilaValor}>
                                    <p className={estilos.kpiValor}>{formatearNumero(urgentes)}</p>
                                    <span className={`${estilos.badge} ${urgentes > 0 ? estilos.badgePeligro : estilos.badgeOk}`}>
                                        {urgentes > 0 ? <IconoEstadoError size={13} /> : <IconoEstadoOk size={13} />}
                                        <span>{urgentes > 0 ? 'Requiere acción' : 'Sin urgencias'}</span>
                                    </span>
                                </div>
                                <p className={estilos.kpiDetalle}>
                                    {urgentes > 0
                                        ? 'Abrí Cajas con el filtro Urgentes aplicado.'
                                        : 'No hay alertas críticas pendientes en este momento.'}
                                </p>
                            </Link>

                            <Link
                                to="/cajas"
                                state={{ filtroAviso: 'ATENCION' }}
                                className={estilos.kpiEnlace}
                            >
                                <div className={estilos.kpiCabecera}>
                                    <span className={`${estilos.kpiIcono} ${atencion > 0 ? estilos.iconoAtencion : estilos.iconoOk}`} aria-hidden="true">
                                        {atencion > 0 ? <IconoEstadoAlerta size={20} /> : <IconoEstadoOk size={20} />}
                                    </span>
                                    <span className={estilos.kpiTitulo}>Avisos de atención</span>
                                </div>
                                <div className={estilos.kpiFilaValor}>
                                    <p className={estilos.kpiValor}>{formatearNumero(atencion)}</p>
                                    <span className={`${estilos.badge} ${atencion > 0 ? estilos.badgeAtencion : estilos.badgeOk}`}>
                                        {atencion > 0 ? <IconoEstadoAlerta size={13} /> : <IconoEstadoOk size={13} />}
                                        <span>{atencion > 0 ? 'Para revisar' : 'Todo en orden'}</span>
                                    </span>
                                </div>
                                <p className={estilos.kpiDetalle}>
                                    {atencion > 0
                                        ? 'Abrí los recordatorios operativos en Cajas.'
                                        : 'Sin recordatorios pendientes para el equipo.'}
                                </p>
                            </Link>

                            <Link
                                to="/stock"
                                state={{ pestana: 'ALERTAS' }}
                                className={estilos.kpiEnlace}
                            >
                                <div className={estilos.kpiCabecera}>
                                    <span
                                        className={`${estilos.kpiIcono} ${
                                            cantidadAlertasStock > 0 ? estilos.iconoAtencion : estilos.iconoOk
                                        }`}
                                        aria-hidden="true"
                                    >
                                        <IconoStock size={20} />
                                    </span>
                                    <span className={estilos.kpiTitulo}>Alertas de stock</span>
                                </div>
                                <div className={estilos.kpiFilaValor}>
                                    <p className={estilos.kpiValor}>
                                        {cantidadAlertasStock != null ? formatearNumero(cantidadAlertasStock) : '—'}
                                    </p>
                                    {cantidadAlertasStock != null ? (
                                        <span className={`${estilos.badge} ${cantidadAlertasStock > 0 ? estilos.badgeAtencion : estilos.badgeOk}`}>
                                            {cantidadAlertasStock > 0 ? <IconoEstadoAlerta size={13} /> : <IconoEstadoOk size={13} />}
                                            <span>{cantidadAlertasStock > 0 ? 'Activas' : 'Al día'}</span>
                                        </span>
                                    ) : (
                                        <span className={`${estilos.badge} ${estilos.badgeNeutro}`}>
                                            <IconoEstadoInfo size={13} />
                                            <span>Sin acceso</span>
                                        </span>
                                    )}
                                </div>
                                <p className={estilos.kpiDetalle}>
                                    {cantidadAlertasStock != null
                                        ? 'Stock bajo, sin stock y lotes próximos a vencer.'
                                        : 'Tu perfil no incluye consulta de alertas de stock.'}
                                </p>
                            </Link>

                            <Link
                                to="/stock"
                                state={{ pestana: 'AUTORIZACIONES' }}
                                className={estilos.kpiEnlace}
                            >
                                <div className={estilos.kpiCabecera}>
                                    <span
                                        className={`${estilos.kpiIcono} ${
                                            cantidadAjustes > 0 ? estilos.iconoAtencion : estilos.iconoOk
                                        }`}
                                        aria-hidden="true"
                                    >
                                        <IconoEscudo size={20} />
                                    </span>
                                    <span className={estilos.kpiTitulo}>Ajustes por autorizar</span>
                                </div>
                                <div className={estilos.kpiFilaValor}>
                                    <p className={estilos.kpiValor}>
                                        {cantidadAjustes != null ? formatearNumero(cantidadAjustes) : '—'}
                                    </p>
                                    {cantidadAjustes != null ? (
                                        <span className={`${estilos.badge} ${cantidadAjustes > 0 ? estilos.badgeAtencion : estilos.badgeOk}`}>
                                            {cantidadAjustes > 0 ? <IconoEstadoAlerta size={13} /> : <IconoEstadoOk size={13} />}
                                            <span>{cantidadAjustes > 0 ? 'Pendientes' : 'Al día'}</span>
                                        </span>
                                    ) : (
                                        <span className={`${estilos.badge} ${estilos.badgeNeutro}`}>
                                            <IconoEstadoInfo size={13} />
                                            <span>Sin acceso</span>
                                        </span>
                                    )}
                                </div>
                                <p className={estilos.kpiDetalle}>
                                    {cantidadAjustes != null
                                        ? 'Revisá y resolvé ajustes en doble control.'
                                        : 'Reservado para perfiles que autorizan ajustes.'}
                                </p>
                            </Link>
                        </div>

                        {indicadoresExtra.length > 0 && (
                            <div className={estilos.tiraComplementaria} aria-label="Indicadores complementarios del turno">
                                {indicadoresExtra.map((ind, idx) => (
                                    <div key={ind?.clave ?? `extra-${idx}`} className={estilos.chipComplementario}>
                                        <span>{ind?.titulo || 'Indicador'}:</span>
                                        <strong>
                                            {ind?.formato === 'PESOS'
                                                ? formatearPesos(ind?.valor)
                                                : formatearNumero(ind?.valor)}
                                        </strong>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className={estilos.bloque} aria-labelledby="titulo-radiografia">
                        <div className={estilos.cabeceraBloque}>
                            <div>
                                <span className={estilos.etiquetaBloque}>Catálogo en vivo</span>
                                <h2 id="titulo-radiografia" className={estilos.tituloBloque}>
                                    Radiografía visual del catálogo
                                </h2>
                                <p className={estilos.notaMuestra}>{textoMuestra}</p>
                            </div>

                            <div className={estilos.selectorSeccion} role="group" aria-label="Filtrar radiografía por sección">
                                {FILTROS_SECCION.map((filtro) => {
                                    const activo = seccionActiva === filtro.id;
                                    return (
                                        <button
                                            key={filtro.id}
                                            type="button"
                                            className={`${estilos.botonFiltro} ${activo ? estilos.botonFiltroActivo : ''}`}
                                            aria-pressed={activo}
                                            onClick={() => setSeccionActiva(filtro.id)}
                                        >
                                            {filtro.icono}
                                            <span>{filtro.etiqueta}</span>
                                            <span className={estilos.conteoFiltro}>
                                                {formatearNumero(conteoPorFiltro[filtro.id])}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {radiografia.total === 0 ? (
                            <p className={estilos.sinDatos}>
                                Todavía no hay productos cargados para analizar en esta sección.
                            </p>
                        ) : (
                            <div className={estilos.grillaRadiografia}>
                                <article className={estilos.panelGrafico}>
                                    <div className={estilos.cabeceraSubpanel}>
                                        <h3 className={estilos.tituloSubpanel}>Productos por rubro</h3>
                                        <span className={estilos.totalSubpanel}>
                                            {formatearNumero(radiografia.total)} en esta muestra
                                        </span>
                                    </div>

                                    <ul className={estilos.listaBarras}>
                                        {radiografia.rubros.map((rubro) => {
                                            const anchoRelativo = radiografia.maxRubro > 0
                                                ? Math.max(6, Math.round((rubro.cantidad / radiografia.maxRubro) * 100))
                                                : 0;
                                            return (
                                                <li key={rubro.nombre} className={estilos.filaBarra}>
                                                    <div className={estilos.metaBarra}>
                                                        <span className={estilos.nombreRubro}>{rubro.nombre}</span>
                                                        <span className={estilos.datosRubro}>
                                                            <strong>{formatearNumero(rubro.cantidad)}</strong>
                                                            <span>({rubro.porcentaje}%)</span>
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={estilos.pistaBarra}
                                                        role="progressbar"
                                                        aria-label={`${rubro.nombre}: ${rubro.cantidad} productos (${rubro.porcentaje}%)`}
                                                        aria-valuemin={0}
                                                        aria-valuemax={100}
                                                        aria-valuenow={rubro.porcentaje}
                                                    >
                                                        <span
                                                            className={estilos.rellenoBarra}
                                                            style={{ width: `${anchoRelativo}%` }}
                                                        />
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </article>

                                <div className={estilos.columnaResumen}>
                                    <article className={estilos.panelResumen}>
                                        <h3 className={estilos.tituloSubpanel}>Resumen de precios</h3>
                                        <dl className={estilos.listaPrecios}>
                                            <div className={estilos.datoPrecio}>
                                                <dt>Precio promedio</dt>
                                                <dd>{formatearPesos(radiografia.precioPromedio)}</dd>
                                            </div>
                                            <div className={estilos.datoPrecio}>
                                                <dt>Más económico</dt>
                                                <dd>{radiografia.minimo ? formatearPesos(radiografia.minimo.precio) : '—'}</dd>
                                                {radiografia.minimo && (
                                                    <span className={estilos.subDato}>{radiografia.minimo.nombre}</span>
                                                )}
                                            </div>
                                            <div className={estilos.datoPrecio}>
                                                <dt>Mayor valor</dt>
                                                <dd>{radiografia.maximo ? formatearPesos(radiografia.maximo.precio) : '—'}</dd>
                                                {radiografia.maximo && (
                                                    <span className={estilos.subDato}>{radiografia.maximo.nombre}</span>
                                                )}
                                            </div>
                                            <div className={estilos.datoPrecio}>
                                                <dt>Con oferta activa</dt>
                                                <dd>{formatearNumero(radiografia.enOferta)}</dd>
                                                <span className={estilos.subDato}>
                                                    de {formatearNumero(radiografia.total)} productos
                                                </span>
                                            </div>
                                        </dl>
                                    </article>

                                    <article className={estilos.panelResumen}>
                                        <h3 className={estilos.tituloSubpanel}>Cobertura de stock y fotos</h3>

                                        <div className={estilos.grupoCobertura}>
                                            <div className={estilos.metaCobertura}>
                                                <span className={estilos.etiquetaCobertura}>
                                                    <IconoEstadoOk size={15} />
                                                    <span>Disponibles para vender</span>
                                                </span>
                                                <strong className={estilos.valorCobertura}>
                                                    {formatearNumero(radiografia.disponibles)} / {formatearNumero(radiografia.total)} ({radiografia.porcentajeStock}%)
                                                </strong>
                                            </div>
                                            <div
                                                className={estilos.pistaCobertura}
                                                role="progressbar"
                                                aria-label={`Stock disponible: ${radiografia.porcentajeStock}%`}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                aria-valuenow={radiografia.porcentajeStock}
                                            >
                                                <span
                                                    className={`${estilos.rellenoCobertura} ${estilos.coberturaOk}`}
                                                    style={{ width: `${radiografia.porcentajeStock}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className={estilos.grupoCobertura}>
                                            <div className={estilos.metaCobertura}>
                                                <span className={estilos.etiquetaCobertura}>
                                                    <IconoEstadoInfo size={15} />
                                                    <span>Productos con foto cargada</span>
                                                </span>
                                                <strong className={estilos.valorCobertura}>
                                                    {formatearNumero(radiografia.conFoto)} / {formatearNumero(radiografia.total)} ({radiografia.porcentajeFotos}%)
                                                </strong>
                                            </div>
                                            <div
                                                className={estilos.pistaCobertura}
                                                role="progressbar"
                                                aria-label={`Cobertura de fotos: ${radiografia.porcentajeFotos}%`}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                aria-valuenow={radiografia.porcentajeFotos}
                                            >
                                                <span
                                                    className={`${estilos.rellenoCobertura} ${estilos.coberturaAmbar}`}
                                                    style={{ width: `${radiografia.porcentajeFotos}%` }}
                                                />
                                            </div>
                                        </div>
                                    </article>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className={estilos.bloqueExportacion} aria-labelledby="titulo-historicos">
                        <div className={estilos.textoExportacion}>
                            <span className={estilos.etiquetaBloque}>Historial y descargas</span>
                            <h2 id="titulo-historicos" className={estilos.tituloBloque}>
                                Reportes históricos y exportación
                            </h2>
                            <p className={estilos.detalleExportacion}>
                                Para consultar balances por rango de fechas, comparativas mensuales o descargar planillas en PDF y Excel, abrí la sección de reportes del panel completo de Cafeto.
                            </p>
                        </div>

                        <a
                            href={URL_REPORTES_WEB}
                            target="_blank"
                            rel="noreferrer"
                            className={estilos.botonPrincipal}
                        >
                            <span>Abrir balances históricos</span>
                            <IconoExterno size={17} />
                        </a>
                    </section>
                </div>
            )}

            <BarraFlotante
                onActualizar={recargar}
                actualizando={cargando}
                etiquetaActualizar="Actualizar los indicadores y el catálogo"
            />
        </section>
    );
}

export default Reportes;
