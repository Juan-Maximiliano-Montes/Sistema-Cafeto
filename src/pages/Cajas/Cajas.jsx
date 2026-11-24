import { useEffect, useState } from 'react';
import { getPanelDelDia, mensajeDeError, URL_WEB_DJANGO } from '../../api/api';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina';
import AvisoError from '../../components/AvisoError/AvisoError';
import { BarraCarga, EsqueletoPanel } from '../../components/BarraCarga/BarraCarga';
import BarraFlotante from '../../components/BarraFlotante/BarraFlotante';
import Tooltip from '../../components/Tooltip/Tooltip';
import {
    IconoActualizar,
    IconoEstadoAlerta,
    IconoEstadoError,
    IconoEstadoInfo,
    IconoEstadoOk,
    IconoExterno,
} from '../../components/Iconos/Iconos';
import { formatearNumero, formatearPesos } from '../../utils/formato';
import estilos from './Cajas.module.css';

const URL_CAJA_WEB = `${URL_WEB_DJANGO}/ventas/caja/`;

const formatearValor = ({ valor, formato }) => {
    if (valor == null) return '—';
    return formato === 'PESOS' ? formatearPesos(valor) : formatearNumero(valor);
};

function Cajas() {
    const [panel, setPanel] = useState({ indicadores: [], avisos: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actualizado, setActualizado] = useState(null);

    const [intento, setIntento] = useState(0);

    useEffect(() => {
        let vigente = true;

        async function cargarPanel() {
            try {
                setLoading(true);
                setError(null);
                const datos = await getPanelDelDia();
                if (!vigente) return;
                setPanel(datos);
                setActualizado(new Date());
            } catch (err) {
                if (vigente) setError(mensajeDeError(err, 'No se pudo sincronizar el estado de cajas con Django.'));
            } finally {
                if (vigente) setLoading(false);
            }
        }

        cargarPanel();
        return () => {
            vigente = false;
        };
    }, [intento]);

    const recargar = () => setIntento((n) => n + 1);

    const cajas = panel.indicadores.find((i) => i.clave === 'CAJAS_ABIERTAS');
    const otrosIndicadores = panel.indicadores.filter((i) => i.clave !== 'CAJAS_ABIERTAS');
    const abiertas = Number(cajas?.valor || 0);
    const hayDatos = actualizado !== null;

    return (
        <section>
            <BarraCarga activa={loading} etiqueta="Actualizando panel de cajas" />

            <EncabezadoPagina
                volverA="/inicio"
                textoVolver="Volver al inicio"
                etiqueta="Panel del día"
                titulo="Cajas"
                subtitulo="Estado de las cajas registradoras, lo vendido hoy y los avisos que necesitan atención."
            >
                <Tooltip texto="Traer los datos más recientes desde Django" posicion="abajo">
                    <button type="button" className={estilos.botonSecundario} onClick={recargar} disabled={loading}>
                        <IconoActualizar size={17} />
                        <span>{loading && hayDatos ? 'Actualizando...' : 'Actualizar'}</span>
                    </button>
                </Tooltip>
                <a href={URL_CAJA_WEB} target="_blank" rel="noreferrer" className={estilos.botonPrincipal}>
                    <span>Abrir o cerrar caja en la web</span>
                    <IconoExterno size={16} />
                </a>
            </EncabezadoPagina>

            {loading && !hayDatos && <EsqueletoPanel />}

            {!loading && error && (
                <AvisoError titulo="No pudimos traer el panel" mensaje={error} onReintentar={recargar} />
            )}

            {hayDatos && !error && (
                <div className={`${estilos.grilla} ${loading ? estilos.actualizando : ''}`}>
                    <article className={estilos.tarjetaCaja}>
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
                            <>
                                <p className={estilos.numeroGrande}>
                                    {formatearNumero(abiertas)}
                                    <span>{abiertas === 1 ? 'caja abierta ahora' : 'cajas abiertas ahora'}</span>
                                </p>
                                <p className={estilos.detalle}>{cajas.detalle}</p>
                            </>
                        ) : (
                            <p className={estilos.detalle}>
                                Tu perfil no tiene el permiso "ver caja". Si lo necesitás, pedíselo al administrador.
                            </p>
                        )}

                        <p className={estilos.nota}>
                            La apertura, el arqueo y el cierre de turno se hacen desde el puesto de caja de la web,
                            porque ahí se controla el efectivo declarado.
                        </p>
                    </article>

                    <article className={estilos.tarjetaTabla}>
                        <h2 className={estilos.tituloSeccion}>Indicadores de hoy</h2>
                        {otrosIndicadores.length > 0 ? (
                            <div className={estilos.tablaContenedor}>
                                <table className={estilos.tabla}>
                                    <thead>
                                        <tr>
                                            <th scope="col">Indicador</th>
                                            <th scope="col">Valor</th>
                                            <th scope="col">Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {otrosIndicadores.map((indicador) => (
                                            <tr key={indicador.clave}>
                                                <td className={estilos.celdaTitulo}>{indicador.titulo}</td>
                                                <td className={estilos.celdaValor}>{formatearValor(indicador)}</td>
                                                <td>{indicador.detalle}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className={estilos.detalle}>Tu perfil no tiene indicadores de ventas habilitados.</p>
                        )}
                    </article>

                    <article className={`${estilos.tarjetaTabla} ${estilos.ancho}`}>
                        <h2 className={estilos.tituloSeccion}>Avisos</h2>
                        {panel.avisos.length > 0 ? (
                            <ul className={estilos.listaAvisos}>
                                {panel.avisos.map((aviso, indice) => {
                                    const esError = aviso.tipo === 'error';
                                    return (
                                        <li key={`${aviso.destino}-${indice}`} className={estilos.aviso}>
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
                                            <span className={estilos.textoAviso}>{aviso.texto}</span>
                                            {aviso.destino === 'WEB' && (
                                                <a href={URL_WEB_DJANGO} target="_blank" rel="noreferrer" className={estilos.enlaceAviso}>
                                                    <span>Resolver en la web</span>
                                                    <IconoExterno size={15} />
                                                </a>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
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
