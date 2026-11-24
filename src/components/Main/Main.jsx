import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Tarjeta from '../Tarjeta/Tarjeta';
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
} from '../Iconos/Iconos';
import { getPanelDelDia, getUsuarioActual } from '../../api/api';
import { formatearNumero, formatearPesos, saludoSegunHora } from '../../utils/formato';
import { clasificarDestinoAviso } from '../../utils/avisos';
import estilos from './Main.module.css';

const MODULOS_FILA_SUPERIOR = [
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
];

const MODULOS_FILA_INFERIOR = [
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
    },
];

function Main() {
    const usuario = getUsuarioActual();
    const saludo = saludoSegunHora();

    const [resumen, setResumen] = useState(null);
    const [cargandoResumen, setCargandoResumen] = useState(true);
    const [errorResumen, setErrorResumen] = useState(false);
    const [intento, setIntento] = useState(0);

    useEffect(() => {
        const controlador = new AbortController();

        async function cargarResumen() {
            try {
                setCargandoResumen(true);
                setErrorResumen(false);
                const datos = await getPanelDelDia({ signal: controlador.signal });
                setResumen(datos);
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
    }, [intento]);

    const indicadoresSeguros = Array.isArray(resumen?.indicadores) ? resumen.indicadores.filter(Boolean) : [];
    const cajas = indicadoresSeguros.find((i) => i?.clave === 'CAJAS_ABIERTAS');
    const vendidoHoy = indicadoresSeguros.find((i) => i?.formato === 'PESOS');
    const avisos = Array.isArray(resumen?.avisos) ? resumen.avisos.filter(Boolean) : [];
    const cantidadAvisos = avisos.length;
    const avisosUrgentes = avisos.filter((a) => a?.tipo === 'error');

    return (
        <section className={estilos.contenido}>
            <header className={estilos.bienvenida}>
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

                <aside className={estilos.resumenVivo} aria-label="Resumen rápido del turno">
                    <div className={estilos.cabeceraResumen}>
                        <span className={estilos.tituloResumen}>Resumen en vivo</span>
                        <button
                            type="button"
                            className={estilos.botonRefrescar}
                            onClick={() => setIntento((n) => n + 1)}
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
                            <Link to="/cajas" className={estilos.metricaEnlace}>
                                <span className={estilos.metricaNombre}>
                                    <IconoCaja size={16} />
                                    <span>Cajas abiertas</span>
                                </span>
                                <strong className={estilos.metricaValor}>
                                    {cajas ? formatearNumero(cajas.valor) : 'Sin acceso'}
                                </strong>
                            </Link>

                            <Link to="/cajas" className={estilos.metricaEnlace}>
                                <span className={estilos.metricaNombre}>
                                    <IconoReportes size={16} />
                                    <span>{vendidoHoy?.titulo || 'Vendido hoy'}</span>
                                </span>
                                <strong className={estilos.metricaValor}>
                                    {vendidoHoy ? formatearPesos(vendidoHoy.valor) : 'Sin acceso'}
                                </strong>
                            </Link>

                            <Link
                                to="/cajas"
                                state={{ filtroAviso: cantidadAvisos > 0 ? 'URGENTES' : 'TODOS' }}
                                className={`${estilos.metricaEnlace} ${cantidadAvisos > 0 ? estilos.metricaAlerta : ''}`}
                            >
                                <span className={estilos.metricaNombre}>
                                    {cantidadAvisos > 0 ? <IconoCampana size={16} /> : <IconoEstadoOk size={16} />}
                                    <span>Avisos pendientes</span>
                                </span>
                                <strong className={estilos.metricaValor}>
                                    {cantidadAvisos === 0
                                        ? 'Sin avisos'
                                        : `${formatearNumero(cantidadAvisos)} ${cantidadAvisos === 1 ? 'aviso' : 'avisos'}`}
                                </strong>
                            </Link>
                        </div>
                    )}
                </aside>
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

            <div className={estilos.piramide}>
                <div className={estilos.filaSuperior}>
                    {MODULOS_FILA_SUPERIOR.map((modulo) => (
                        <div key={modulo.to} className={estilos.celdaSuperior}>
                            <Tarjeta {...modulo} />
                        </div>
                    ))}
                </div>

                <div className={estilos.filaInferior}>
                    {MODULOS_FILA_INFERIOR.map((modulo) => (
                        <div key={modulo.to} className={estilos.celdaInferior}>
                            <Tarjeta {...modulo} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Main;
