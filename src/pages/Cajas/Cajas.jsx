import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getPanelDelDia, mensajeDeError, URL_WEB_DJANGO } from '../../api/api';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina';
import AvisoError from '../../components/AvisoError/AvisoError';
import { BarraCarga, EsqueletoPanel } from '../../components/BarraCarga/BarraCarga';
import BarraFlotante from '../../components/BarraFlotante/BarraFlotante';
import Tooltip from '../../components/Tooltip/Tooltip';
import {
    IconoActualizar,
    IconoBuscar,
    IconoEstadoAlerta,
    IconoEstadoError,
    IconoEstadoInfo,
    IconoEstadoOk,
    IconoExterno,
    IconoStock,
} from '../../components/Iconos/Iconos';
import { formatearNumero, formatearPesos, normalizar } from '../../utils/formato';
import { clasificarDestinoAviso } from '../../utils/avisos';
import estilos from './Cajas.module.css';

const URL_CAJA_WEB = `${URL_WEB_DJANGO}/ventas/caja/`;

const formatearValor = ({ valor, formato } = {}) => {
    if (valor == null) return '—';
    return formato === 'PESOS' ? formatearPesos(valor) : formatearNumero(valor);
};

function Cajas() {
    const location = useLocation();
    const filtroDesdeRuta = ['TODOS', 'URGENTES', 'ATENCION'].includes(location.state?.filtroAviso)
        ? location.state.filtroAviso
        : 'TODOS';

    const [panel, setPanel] = useState({ indicadores: [], avisos: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actualizado, setActualizado] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState({ key: location.key, valor: filtroDesdeRuta });
    const [busquedaAviso, setBusquedaAviso] = useState('');
    const [intento, setIntento] = useState(0);

    const filtroAviso = filtroEstado.key === location.key ? filtroEstado.valor : filtroDesdeRuta;
    const setFiltroAviso = (valor) => setFiltroEstado({ key: location.key, valor });

    useEffect(() => {
        const controlador = new AbortController();

        async function cargarPanel() {
            try {
                setLoading(true);
                setError(null);
                const datos = await getPanelDelDia({ signal: controlador.signal });
                setPanel({
                    indicadores: Array.isArray(datos?.indicadores) ? datos.indicadores.filter(Boolean) : [],
                    avisos: Array.isArray(datos?.avisos) ? datos.avisos.filter(Boolean) : [],
                });
                setActualizado(new Date());
            } catch (err) {
                const mensaje = mensajeDeError(err, 'No se pudo consultar el estado de cajas.');
                if (mensaje) setError(mensaje);
            } finally {
                if (!controlador.signal.aborted) setLoading(false);
            }
        }

        cargarPanel();
        return () => controlador.abort();
    }, [intento]);

    const recargar = () => setIntento((n) => n + 1);

    const indicadoresSeguros = Array.isArray(panel?.indicadores) ? panel.indicadores : [];
    const avisosSeguros = Array.isArray(panel?.avisos) ? panel.avisos : [];
    const cajas = indicadoresSeguros.find((i) => i?.clave === 'CAJAS_ABIERTAS');
    const otrosIndicadores = indicadoresSeguros.filter((i) => i?.clave !== 'CAJAS_ABIERTAS');
    const abiertas = Number(cajas?.valor || 0);
    const hayDatos = actualizado !== null;

    const totalUrgentes = avisosSeguros.filter((a) => a?.tipo === 'error').length;
    const totalAtencion = avisosSeguros.length - totalUrgentes;
    const palabrasBusqueda = normalizar(busquedaAviso).split(/\s+/).filter(Boolean);

    const avisosFiltrados = avisosSeguros.filter((aviso) => {
        const esError = aviso?.tipo === 'error';
        if (filtroAviso === 'URGENTES' && !esError) return false;
        if (filtroAviso === 'ATENCION' && esError) return false;
        if (palabrasBusqueda.length === 0) return true;
        const textoNormalizado = normalizar(aviso?.texto);
        return palabrasBusqueda.every((palabra) => textoNormalizado.includes(palabra));
    });

    const pestanasAvisos = [
        { id: 'TODOS', etiqueta: 'Todos', cantidad: avisosSeguros.length, icono: null },
        { id: 'URGENTES', etiqueta: 'Urgentes', cantidad: totalUrgentes, icono: <IconoEstadoError size={14} /> },
        { id: 'ATENCION', etiqueta: 'Atención', cantidad: totalAtencion, icono: <IconoEstadoAlerta size={14} /> },
    ];

    return (
        <section>
            <BarraCarga activa={loading} etiqueta="Consultando el estado de cajas..." />

            <EncabezadoPagina
                compacto
                etiqueta="Panel del día"
                titulo="Cajas"
                subtitulo="Estado de las cajas registradoras, lo vendido hoy y los avisos que necesitan atención."
            >
                <Tooltip texto="Traer los datos más recientes del sistema" posicion="abajo">
                    <button type="button" className={estilos.botonSecundario} onClick={recargar} disabled={loading}>
                        <IconoActualizar size={17} />
                        <span>{loading && hayDatos ? 'Actualizando...' : 'Actualizar'}</span>
                    </button>
                </Tooltip>
                <Tooltip texto="Abrir, arquear o cerrar caja en el panel completo" posicion="abajo">
                    <a href={URL_CAJA_WEB} target="_blank" rel="noreferrer" className={estilos.botonPrincipal}>
                        <span>Ir a caja en panel completo</span>
                        <IconoExterno size={16} />
                    </a>
                </Tooltip>
            </EncabezadoPagina>

            {loading && !hayDatos && <EsqueletoPanel />}

            {!loading && error && (
                <AvisoError titulo="No pudimos traer el panel" mensaje={error} onReintentar={recargar} />
            )}

            {hayDatos && !error && (
                <div className={`${estilos.grilla} ${loading ? estilos.actualizando : ''}`}>
                    <article className={estilos.bloqueCaja}>
                        <div className={estilos.cabeceraTarjeta}>
                            <h2 className={estilos.nombreCaja}>Cajas registradoras</h2>
                            {cajas ? (
                                <Tooltip
                                    esEtiqueta
                                    texto={
                                        abiertas > 0
                                            ? 'Hay al menos una caja habilitada cobrando ahora'
                                            : 'Todas las cajas se encuentran cerradas en este momento'
                                    }
                                >
                                    <span className={`${estilos.badge} ${abiertas > 0 ? estilos.abierta : estilos.cerrada}`}>
                                        {abiertas > 0 ? <IconoEstadoOk size={14} /> : <IconoEstadoError size={14} />}
                                        <span>{abiertas > 0 ? 'Abierta' : 'Cerrada'}</span>
                                    </span>
                                </Tooltip>
                            ) : (
                                <Tooltip
                                    esEtiqueta
                                    texto='Tu usuario no tiene permiso "ver caja" asignado'
                                >
                                    <span className={`${estilos.badge} ${estilos.neutro}`}>
                                        <IconoEstadoInfo size={14} />
                                        <span>Sin acceso</span>
                                    </span>
                                </Tooltip>
                            )}
                        </div>

                        {cajas ? (
                            <div className={estilos.cuerpoCaja}>
                                <p className={estilos.numeroGrande}>
                                    {formatearNumero(abiertas)}
                                    <span>{abiertas === 1 ? 'caja abierta ahora' : 'cajas abiertas ahora'}</span>
                                </p>
                                <p className={estilos.detalle}>{cajas.detalle}</p>
                            </div>
                        ) : (
                            <p className={estilos.detalle}>
                                Tu perfil no tiene el permiso &quot;ver caja&quot;. Si lo necesitás, pedíselo al administrador.
                            </p>
                        )}

                        <p className={estilos.nota}>
                            La apertura, el arqueo y el cierre de turno se hacen desde el puesto de caja del panel completo,
                            porque ahí se controla el efectivo declarado.
                        </p>
                    </article>

                    <article className={estilos.bloqueMetricas}>
                        <div className={estilos.cabeceraTarjeta}>
                            <h2 className={estilos.tituloSeccion}>Indicadores de hoy</h2>
                            <span className={estilos.subEtiqueta}>Turno actual</span>
                        </div>

                        {otrosIndicadores.length > 0 ? (
                            <div className={estilos.listaMetricas}>
                                {otrosIndicadores.map((indicador) => (
                                    <div key={indicador.clave} className={estilos.tarjetaMetrica}>
                                        <span className={estilos.metricaTitulo}>{indicador.titulo}</span>
                                        <strong className={estilos.metricaValor}>{formatearValor(indicador)}</strong>
                                        {indicador.detalle && (
                                            <p className={estilos.metricaDetalle}>{indicador.detalle}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={estilos.detalle}>Tu perfil no tiene indicadores de ventas habilitados.</p>
                        )}
                    </article>

                    <article className={`${estilos.bloqueAvisos} ${estilos.ancho}`}>
                        <div className={estilos.cabeceraAvisos}>
                            <h2 className={estilos.tituloSeccion}>Avisos del turno</h2>
                            {avisosSeguros.length > 0 && (
                                <div className={estilos.controlesAvisos}>
                                    <div className={estilos.pestanasAvisos} role="group" aria-label="Filtrar avisos por prioridad">
                                        {pestanasAvisos.map((pestana) => {
                                            const activa = filtroAviso === pestana.id;
                                            return (
                                                <button
                                                    key={pestana.id}
                                                    type="button"
                                                    className={`${estilos.pestana} ${activa ? estilos.pestanaActiva : ''}`}
                                                    aria-pressed={activa}
                                                    onClick={() => setFiltroAviso(pestana.id)}
                                                >
                                                    {pestana.icono}
                                                    <span>{pestana.etiqueta}</span>
                                                    <span className={estilos.conteoPestana}>{pestana.cantidad}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className={estilos.buscadorAvisos}>
                                        <span className={estilos.iconoBuscar} aria-hidden="true">
                                            <IconoBuscar size={16} />
                                        </span>
                                        <input
                                            type="search"
                                            className={estilos.inputBuscarAvisos}
                                            placeholder="Buscar en avisos..."
                                            aria-label="Buscar en los avisos del día"
                                            value={busquedaAviso}
                                            onChange={(e) => setBusquedaAviso(e.target.value)}
                                        />
                                        {busquedaAviso && (
                                            <button
                                                type="button"
                                                className={estilos.limpiarBusqueda}
                                                onClick={() => setBusquedaAviso('')}
                                                aria-label="Limpiar búsqueda de avisos"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {avisosSeguros.length > 0 ? (
                            avisosFiltrados.length > 0 ? (
                                <ul className={estilos.listaAvisos}>
                                    {avisosFiltrados.map((aviso, indice) => {
                                        const esError = aviso?.tipo === 'error';
                                        const accionAviso = clasificarDestinoAviso(aviso);

                                        return (
                                            <li key={`${aviso?.destino || 'aviso'}-${indice}-${aviso?.texto || ''}`} className={estilos.aviso}>
                                                <Tooltip
                                                    esEtiqueta
                                                    texto={
                                                        esError
                                                            ? 'Aviso urgente: conviene revisarlo cuanto antes'
                                                            : 'Aviso de atención para tener en cuenta hoy'
                                                    }
                                                >
                                                    <span className={`${estilos.badge} ${esError ? estilos.cerrada : estilos.atencion}`}>
                                                        {esError ? <IconoEstadoError size={14} /> : <IconoEstadoAlerta size={14} />}
                                                        <span>{esError ? 'Urgente' : 'Atención'}</span>
                                                    </span>
                                                </Tooltip>
                                                <span className={estilos.textoAviso}>{aviso?.texto}</span>
                                                {accionAviso?.tipo === 'interno' ? (
                                                    <Link
                                                        to={accionAviso.to}
                                                        state={accionAviso.state}
                                                        className={estilos.enlaceInterno}
                                                    >
                                                        <IconoStock size={15} />
                                                        <span>{accionAviso.etiqueta}</span>
                                                    </Link>
                                                ) : accionAviso?.tipo === 'externo' ? (
                                                    <a
                                                        href={accionAviso.href}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={estilos.enlaceAviso}
                                                    >
                                                        <span>{accionAviso.etiqueta}</span>
                                                        <IconoExterno size={15} />
                                                    </a>
                                                ) : null}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className={estilos.vacioFiltro}>
                                    <p className={estilos.detalle}>
                                        No hay avisos que coincidan con el filtro actual.
                                    </p>
                                    <button
                                        type="button"
                                        className={estilos.botonLimpiarFiltro}
                                        onClick={() => {
                                            setFiltroAviso('TODOS');
                                            setBusquedaAviso('');
                                        }}
                                    >
                                        Ver todos los avisos
                                    </button>
                                </div>
                            )
                        ) : (
                            <p className={`${estilos.detalle} ${estilos.todoBien}`}>
                                <IconoEstadoOk size={16} />
                                <span>Todo en orden: no hay avisos pendientes.</span>
                            </p>
                        )}
                    </article>

                    {actualizado && (
                        <p className={`${estilos.actualizadoA} ${estilos.ancho}`}>
                            Actualizado a las {actualizado.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>
            )}

            <BarraFlotante
                onActualizar={recargar}
                actualizando={loading}
                etiquetaActualizar="Actualizar el estado de cajas"
            />
        </section>
    );
}

export default Cajas;
