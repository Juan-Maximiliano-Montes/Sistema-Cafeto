import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Tarjeta from '../Tarjeta/Tarjeta';
import Tooltip from '../Tooltip/Tooltip';
import {
    IconoActualizar,
    IconoCaja,
    IconoCampana,
    IconoEstadoError,
    IconoEstadoOk,
    IconoEtiqueta,
    IconoExterno,
    IconoReportes,
    IconoStock,
    IconoTaza,
    IconoUsuarios,
} from '../Iconos/Iconos';
import {
    getAlertasStock,
    getPanelDelDia,
    getUsuarioActual,
    tienePermiso,
} from '../../api/api';
import { useNotificacion } from '../../hooks/useNotificacion';
import {
    formatearFecha,
    formatearNumero,
    formatearPesos,
    saludoSegunHora,
} from '../../utils/formato';
import { clasificarDestinoAviso } from '../../utils/avisos';
import { puedeVerModulo } from '../../utils/permisos';
import estilos from './Main.module.css';

const MODULOS_BASE = [
    {
        to: '/productos',
        titulo: 'Productos',
        descripcion: 'Carta de cafetería, góndola de minisúper, búsqueda por código de barras y qué vence primero.',
        icono: <IconoTaza size={24} />,
        accion: 'Ir a productos',
        principal: true,
    },
    {
        to: '/stock',
        titulo: 'Stock',
        descripcion: 'Alertas de vencimiento o stock bajo y autorizaciones de ajustes con doble control.',
        icono: <IconoStock size={24} />,
        accion: 'Revisar alertas y ajustes',
    },
    {
        to: '/catalogo',
        titulo: 'Marcas y rubros',
        descripcion: 'Altas, ediciones y bajas seguras de marcas y rubros del catálogo.',
        icono: <IconoEtiqueta size={24} />,
        accion: 'Gestionar marcas y rubros',
    },
    {
        to: '/cajas',
        titulo: 'Cajas',
        descripcion: 'Cajas registradoras abiertas, recaudación del turno y avisos operativos del día.',
        icono: <IconoCaja size={24} />,
        accion: 'Ver estado de cajas',
    },
    {
        to: '/reportes',
        titulo: 'Reportes',
        descripcion: 'Indicadores del turno, alertas activas y radiografía visual por rubro.',
        icono: <IconoReportes size={24} />,
        accion: 'Ver reportes',
        requiereReportes: true,
    },
    {
        to: '/perfil',
        titulo: 'Mi perfil',
        descripcion: 'Tu rol efectivo, estado de la sesión y matriz de permisos habilitados.',
        icono: <IconoUsuarios size={24} />,
        accion: 'Ver mi cuenta',
    },
];

const CATEGORIAS_ALERTA = [
    { clave: 'VENCIDO', etiqueta: 'Vencido', plural: 'Vencidos', clase: 'barraPeligro', prioridad: 0, critica: true },
    { clave: 'SIN_STOCK', etiqueta: 'Sin stock', plural: 'Sin stock', clase: 'barraPeligro', prioridad: 1, critica: true },
    { clave: 'POR_VENCER', etiqueta: 'Por vencer', plural: 'Por vencer', clase: 'barraAviso', prioridad: 2, critica: false },
    { clave: 'STOCK_BAJO', etiqueta: 'Stock bajo', plural: 'Stock bajo', clase: 'barraInfo', prioridad: 3, critica: false },
];

const PRIORIDAD_POR_TIPO = Object.fromEntries(CATEGORIAS_ALERTA.map((c) => [c.clave, c]));

const nombreAlerta = (valor) => {
    if (!valor) return 'Producto';
    if (typeof valor === 'string') return valor;
    return valor.nombre || 'Producto';
};

function Main() {
    const usuario = getUsuarioActual();
    const { notificar } = useNotificacion();
    const saludo = saludoSegunHora();

    const puedeVerReportes = Boolean(
        usuario?.es_titular ||
            usuario?.es_administrador ||
            tienePermiso(usuario, 'ver_reportes')
    );
    const puedeVerStock = Boolean(
        usuario?.es_titular ||
            usuario?.es_administrador ||
            tienePermiso(usuario, 'ver_stock')
    );

    const [resumen, setResumen] = useState(null);
    const [alertasDia, setAlertasDia] = useState([]);
    const [cargandoResumen, setCargandoResumen] = useState(true);
    const [errorResumen, setErrorResumen] = useState(false);
    const [intento, setIntento] = useState(0);

    useEffect(() => {
        const controlador = new AbortController();

        async function cargarResumen() {
            try {
                setCargandoResumen(true);
                setErrorResumen(false);
                const [resPanel, resAlertas] = await Promise.allSettled([
                    getPanelDelDia({ signal: controlador.signal }),
                    puedeVerStock
                        ? getAlertasStock({ tipo: 'TODAS', signal: controlador.signal })
                        : Promise.resolve(null),
                ]);

                if (controlador.signal.aborted) return;

                if (resPanel.status === 'fulfilled') {
                    setResumen(resPanel.value);
                } else {
                    setErrorResumen(true);
                }

                if (resAlertas.status === 'fulfilled' && resAlertas.value) {
                    const lista = Array.isArray(resAlertas.value?.resultados)
                        ? resAlertas.value.resultados.filter(Boolean)
                        : [];
                    setAlertasDia(lista);
                }
            } catch (error) {
                if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                    setErrorResumen(true);
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCargandoResumen(false);
                }
            }
        }

        cargarResumen();
        return () => controlador.abort();
    }, [intento, puedeVerReportes, puedeVerStock]);

    const refrescarResumen = () => {
        setIntento((n) => n + 1);
        notificar({
            texto: 'Actualizando resumen e indicadores del turno...',
            tono: 'info',
        });
    };

    const indicadoresSeguros = Array.isArray(resumen?.indicadores) ? resumen.indicadores.filter(Boolean) : [];
    const cajas = indicadoresSeguros.find((i) => i?.clave === 'CAJAS_ABIERTAS');
    const vendidoHoy = indicadoresSeguros.find((i) => i?.formato === 'PESOS');
    const avisos = Array.isArray(resumen?.avisos) ? resumen.avisos.filter(Boolean) : [];
    const cantidadAvisos = avisos.length;

    const modulosVisibles = MODULOS_BASE.filter((m) => puedeVerModulo(usuario, m.to));
    const puedeVerCajas = puedeVerModulo(usuario, '/cajas');
    const mostrarResumenVivo = Boolean(
        cajas || vendidoHoy || (puedeVerCajas && (cargandoResumen || errorResumen))
    );
    const mostrarPrioridadesStock = Boolean(!puedeVerReportes && puedeVerStock);

    const avisosUrgentes = avisos.filter(
        (a) => a?.tipo === 'error' && (!mostrarPrioridadesStock || a?.destino !== 'ALERTAS')
    );

    const alertasPrioritarias = [...alertasDia]
        .sort((a, b) => {
            const pA = PRIORIDAD_POR_TIPO[String(a?.tipo || '').toUpperCase()]?.prioridad ?? 9;
            const pB = PRIORIDAD_POR_TIPO[String(b?.tipo || '').toUpperCase()]?.prioridad ?? 9;
            return pA - pB;
        })
        .slice(0, 5);

    const conteoAlertas = CATEGORIAS_ALERTA.map((cat) => ({
        ...cat,
        cantidad: alertasDia.filter((a) => String(a?.tipo || '').toUpperCase() === cat.clave).length,
    }));
    const maxAlerta = Math.max(1, ...conteoAlertas.map((c) => c.cantidad));

    const indicadoresGraficables = indicadoresSeguros
        .filter((ind) => ind?.valor != null && Number.isFinite(Number(ind.valor)))
        .slice(0, 4);
    const maxIndicador = Math.max(
        1,
        ...indicadoresGraficables.map((i) => Math.abs(Number(i.valor) || 0))
    );

    return (
        <section className={estilos.contenido}>
            <header className={`${estilos.bienvenida} ${!mostrarResumenVivo ? estilos.bienvenidaSimple : ''}`}>
                <div className={estilos.saludoColumna}>
                    <span className={estilos.etiqueta}>Panel de inicio</span>
                    <h1 className={estilos.titulo}>
                        {saludo}{usuario?.nombre ? `, ${usuario.nombre}` : ''}
                    </h1>
                    <p className={estilos.texto}>
                        Elegí el módulo con el que querés trabajar ahora.
                    </p>
                    {usuario?.perfil && (
                        <span className={estilos.insigniaRol}>
                            Rol: <strong className={estilos.perfil}>{usuario.perfil}</strong>
                        </span>
                    )}
                </div>

                {mostrarResumenVivo ? (
                    <aside className={estilos.resumenVivo} aria-label="Resumen rápido del turno">
                        <div className={estilos.cabeceraResumen}>
                            <span className={estilos.tituloResumen}>Resumen en vivo</span>
                            <button
                                type="button"
                                data-iris-tour="actualizar"
                                className={estilos.botonRefrescar}
                                onClick={refrescarResumen}
                                disabled={cargandoResumen}
                                aria-label="Actualizar resumen en vivo"
                            >
                                <IconoActualizar size={15} />
                                <span>{cargandoResumen ? 'Cargando...' : 'Actualizar'}</span>
                            </button>
                        </div>

                        {cargandoResumen && !resumen && (
                            <div className={estilos.esqueletoResumen} aria-busy="true">
                                <div className={estilos.lineaEsqueleto} />
                                <div className={estilos.lineaEsqueleto} />
                                <div className={estilos.lineaEsqueleto} />
                            </div>
                        )}

                        {!cargandoResumen && errorResumen && !resumen && (
                            <div className={estilos.errorResumen} role="status">
                                <IconoEstadoError size={16} />
                                <span>No pudimos cargar el resumen del turno.</span>
                            </div>
                        )}

                        {resumen && (
                            <div className={estilos.grillaMetricas}>
                                {cajas && (
                                    <Link to={puedeVerCajas ? '/cajas' : '/inicio'} className={estilos.metricaEnlace}>
                                        <span className={estilos.metricaNombre}>
                                            <IconoCaja size={16} />
                                            <span>Cajas abiertas</span>
                                        </span>
                                        <strong className={`${estilos.metricaValor} iris-num`}>
                                            {formatearNumero(cajas.valor)}
                                        </strong>
                                    </Link>
                                )}

                                {vendidoHoy && (
                                    <Link to={puedeVerCajas ? '/cajas' : '/inicio'} className={estilos.metricaEnlace}>
                                        <span className={estilos.metricaNombre}>
                                            <IconoReportes size={16} />
                                            <span>{vendidoHoy.titulo || 'Vendido hoy'}</span>
                                        </span>
                                        <strong className={`${estilos.metricaValor} iris-num`}>
                                            {formatearPesos(vendidoHoy.valor)}
                                        </strong>
                                    </Link>
                                )}

                                <Link
                                    to={puedeVerCajas ? '/cajas' : '/stock'}
                                    state={puedeVerCajas ? { filtroAviso: cantidadAvisos > 0 ? 'URGENTES' : 'TODOS' } : undefined}
                                    className={`${estilos.metricaEnlace} ${cantidadAvisos > 0 ? estilos.metricaAlerta : ''}`}
                                >
                                    <span className={estilos.metricaNombre}>
                                        {cantidadAvisos > 0 ? <IconoCampana size={16} /> : <IconoEstadoOk size={16} />}
                                        <span>Avisos pendientes</span>
                                    </span>
                                    <strong className={`${estilos.metricaValor} iris-num`}>
                                        {cantidadAvisos === 0
                                            ? 'Sin avisos'
                                            : `${formatearNumero(cantidadAvisos)} ${cantidadAvisos === 1 ? 'aviso' : 'avisos'}`}
                                    </strong>
                                </Link>
                            </div>
                        )}
                    </aside>
                ) : (
                    <div className={estilos.accionesSimples}>
                        <button
                            type="button"
                            data-iris-tour="actualizar"
                            className={estilos.botonRefrescar}
                            onClick={refrescarResumen}
                            disabled={cargandoResumen}
                            aria-label="Actualizar datos del turno"
                        >
                            <IconoActualizar size={15} />
                            <span>{cargandoResumen ? 'Actualizando...' : 'Actualizar'}</span>
                        </button>
                    </div>
                )}
            </header>

            {avisosUrgentes.length > 0 && (
                <div className={estilos.tiraUrgentes} role="region" aria-label="Avisos urgentes del turno">
                    <span className={estilos.etiquetaUrgentes}>
                        <IconoEstadoError size={14} />
                        <span>Urgente</span>
                    </span>
                    <div className={estilos.pildorasUrgentes}>
                        {avisosUrgentes.map((aviso, idx) => {
                            const accion = clasificarDestinoAviso(aviso);
                            if (accion?.tipo === 'interno') {
                                return (
                                    <Link
                                        key={`${idx}-${aviso.texto}`}
                                        to={accion.to}
                                        state={accion.state}
                                        className={estilos.pildoraUrgente}
                                    >
                                        <span>{aviso.texto}</span>
                                        <span aria-hidden="true">→</span>
                                    </Link>
                                );
                            }
                            if (accion?.tipo === 'externo') {
                                return (
                                    <a
                                        key={`${idx}-${aviso.texto}`}
                                        href={accion.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={estilos.pildoraUrgente}
                                    >
                                        <span>{aviso.texto}</span>
                                        <IconoExterno size={13} />
                                    </a>
                                );
                            }
                            return (
                                <Link
                                    key={`${idx}-${aviso.texto}`}
                                    to="/cajas"
                                    state={{ filtroAviso: 'URGENTES' }}
                                    className={estilos.pildoraUrgente}
                                >
                                    <span>{aviso.texto}</span>
                                    <span aria-hidden="true">→</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className={estilos.grillaModulos}>
                {modulosVisibles.map((modulo) => (
                    <Tarjeta key={modulo.to} {...modulo} />
                ))}
            </div>

            {mostrarPrioridadesStock && (
                <section className={estilos.seccionGraficos} aria-labelledby="titulo-prioridades-turno">
                    <div className={estilos.cabeceraGraficos}>
                        <div className={estilos.tituloConBadge}>
                            <div>
                                <span className={estilos.etiqueta}>Para revisar en este turno</span>
                                <h2 id="titulo-prioridades-turno" className={estilos.tituloGraficos}>
                                    Prioridades de stock
                                </h2>
                            </div>
                            {alertasDia.length > 0 && (
                                <span className={`${estilos.badgeTotalAlertas} iris-num`}>
                                    {formatearNumero(alertasDia.length)}{' '}
                                    {alertasDia.length === 1 ? 'alerta activa' : 'alertas activas'}
                                </span>
                            )}
                        </div>
                        <Link to="/stock" className={estilos.enlaceReportes}>
                            <span>Ver todas en Stock</span>
                            <span aria-hidden="true">→</span>
                        </Link>
                    </div>

                    {alertasPrioritarias.length > 0 ? (
                        <ul className={estilos.listaPrioridades}>
                            {alertasPrioritarias.map((alerta, idx) => {
                                const tipoClave = String(alerta?.tipo || '').toUpperCase();
                                const meta = PRIORIDAD_POR_TIPO[tipoClave] || {
                                    etiqueta: tipoClave || 'Alerta',
                                    critica: false,
                                };
                                const productoId = typeof alerta?.producto === 'object' ? alerta.producto?.id : null;
                                return (
                                    <li key={alerta?.id ?? `prio-${idx}`} className={estilos.itemPrioridad}>
                                        <span
                                            className={`${estilos.badgePrioridad} ${
                                                meta.critica ? estilos.badgePrioridadCritica : estilos.badgePrioridadAviso
                                            }`}
                                        >
                                            {meta.etiqueta}
                                        </span>
                                        <div className={estilos.datosPrioridad}>
                                            <strong>{nombreAlerta(alerta?.producto)}</strong>
                                            <span>
                                                {[
                                                    alerta?.detalle,
                                                    alerta?.fecha ? `Fecha: ${formatearFecha(alerta.fecha)}` : null,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ') || 'Revisar estado de stock y lotes'}
                                            </span>
                                        </div>
                                        <Link
                                            to={productoId ? `/productos/${productoId}` : '/stock'}
                                            className={estilos.linkChico}
                                        >
                                            Revisar →
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className={estilos.todoAlDia}>
                            <IconoEstadoOk size={18} />
                            <span>Todo al día en stock: no hay vencimientos ni faltantes activos.</span>
                        </div>
                    )}
                </section>
            )}

            {puedeVerReportes && (
                <section className={estilos.seccionGraficos} aria-labelledby="titulo-pulso-dia">
                    <div className={estilos.cabeceraGraficos}>
                        <div>
                            <span className={estilos.etiqueta}>Reportes gráficos del día</span>
                            <h2 id="titulo-pulso-dia" className={estilos.tituloGraficos}>
                                Pulso visual del turno
                            </h2>
                        </div>
                        <Link to="/reportes" className={estilos.enlaceReportes}>
                            <span>Abrir reportes completos</span>
                            <span aria-hidden="true">→</span>
                        </Link>
                    </div>

                    <div className={estilos.grillaGraficos}>
                        <article className={estilos.tarjetaGrafico}>
                            <div className={estilos.cabeceraTarjetaGrafico}>
                                <h3>Alertas de stock por severidad</h3>
                                <Link to="/stock" className={estilos.linkChico}>
                                    Ir a stock →
                                </Link>
                            </div>
                            {puedeVerStock ? (
                                <ul className={estilos.listaBarras}>
                                    {conteoAlertas.map((item) => {
                                        const porcentaje =
                                            item.cantidad > 0
                                                ? Math.max(8, Math.round((item.cantidad / maxAlerta) * 100))
                                                : 0;
                                        return (
                                            <li key={item.clave} className={estilos.filaBarra}>
                                                <div className={estilos.metaBarra}>
                                                    <span>{item.plural || item.etiqueta}</span>
                                                    <strong className="iris-num">
                                                        {formatearNumero(item.cantidad)}
                                                    </strong>
                                                </div>
                                                <Tooltip
                                                    texto={`${item.etiqueta}: ${formatearNumero(item.cantidad)} alerta(s) activa(s)`}
                                                    posicion="arriba"
                                                >
                                                    <div className={estilos.pistaBarra} role="presentation">
                                                        <span
                                                            className={`${estilos.rellenoBarra} ${estilos[item.clase]}`}
                                                            style={{ width: `${porcentaje}%` }}
                                                        />
                                                    </div>
                                                </Tooltip>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className={estilos.sinDatosGrafico}>
                                    Sin permiso de consulta de stock para graficar alertas.
                                </p>
                            )}
                        </article>

                        <article className={estilos.tarjetaGrafico}>
                            <div className={estilos.cabeceraTarjetaGrafico}>
                                <h3>Indicadores activos de hoy</h3>
                                <Link to="/cajas" className={estilos.linkChico}>
                                    Ver cajas →
                                </Link>
                            </div>
                            {indicadoresGraficables.length > 0 ? (
                                <ul className={estilos.listaBarras}>
                                    {indicadoresGraficables.map((ind) => {
                                        const valorNum = Number(ind.valor) || 0;
                                        const porcentaje =
                                            valorNum !== 0
                                                ? Math.max(10, Math.round((Math.abs(valorNum) / maxIndicador) * 100))
                                                : 0;
                                        const etiquetaValor =
                                            ind.formato === 'PESOS'
                                                ? formatearPesos(valorNum)
                                                : formatearNumero(valorNum);
                                        return (
                                            <li key={ind.clave || ind.titulo} className={estilos.filaBarra}>
                                                <div className={estilos.metaBarra}>
                                                    <span>{ind.titulo}</span>
                                                    <strong className="iris-num">{etiquetaValor}</strong>
                                                </div>
                                                <div className={estilos.pistaBarra} role="presentation">
                                                    <span
                                                        className={`${estilos.rellenoBarra} ${estilos.barraAcento}`}
                                                        style={{ width: `${porcentaje}%` }}
                                                    />
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className={estilos.sinDatosGrafico}>
                                    Todavía no hay indicadores numéricos registrados en el turno.
                                </p>
                            )}
                        </article>
                    </div>
                </section>
            )}
        </section>
    );
}

export default Main;
