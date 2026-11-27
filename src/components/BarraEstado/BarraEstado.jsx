import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    getAjustesStock,
    getPanelDelDia,
    getUsuarioActual,
    tienePermiso,
} from '../../api/api';
import { useNotificacion } from '../../hooks/useNotificacion';
import { formatearNumero } from '../../utils/formato';
import { puedeVerModulo } from '../../utils/permisos';
import {
    IconoBuscar,
    IconoCaja,
    IconoCerrar,
    IconoEscudo,
    IconoEstadoAlerta,
    IconoEstadoInfo,
    IconoEstadoOk,
} from '../Iconos/Iconos';
import Tooltip from '../Tooltip/Tooltip';
import estilos from './BarraEstado.module.css';

function BarraEstado({ onAbrirBuscador }) {
    const { pathname } = useLocation();
    const usuario = getUsuarioActual();
    const puedeAutorizar = tienePermiso(usuario, 'autorizar_ajustes');
    const puedeVerCajas = puedeVerModulo(usuario, '/cajas');

    const {
        avisoActual,
        pendientesEnCola,
        cerrarAviso,
        pausarAviso,
        reanudarAviso,
    } = useNotificacion();

    const [cajasAbiertas, setCajasAbiertas] = useState(null);
    const [pendientesAutorizar, setPendientesAutorizar] = useState(0);
    const [recarga, setRecarga] = useState(0);
    const [enLinea, setEnLinea] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

    useEffect(() => {
        const alActualizarEstado = () => setRecarga((n) => n + 1);
        const marcarEnLinea = () => setEnLinea(true);
        const marcarSinConexion = () => setEnLinea(false);

        window.addEventListener('cafeto:estado-actualizar', alActualizarEstado);
        window.addEventListener('online', marcarEnLinea);
        window.addEventListener('offline', marcarSinConexion);
        return () => {
            window.removeEventListener('cafeto:estado-actualizar', alActualizarEstado);
            window.removeEventListener('online', marcarEnLinea);
            window.removeEventListener('offline', marcarSinConexion);
        };
    }, []);

    useEffect(() => {
        const controlador = new AbortController();

        async function cargarEstadoVivo() {
            try {
                const [resPanel, resAjustes] = await Promise.allSettled([
                    getPanelDelDia({ signal: controlador.signal }),
                    puedeAutorizar
                        ? getAjustesStock({ estado: 'PENDIENTE', signal: controlador.signal })
                        : Promise.resolve(null),
                ]);

                if (controlador.signal.aborted) return;

                if (resPanel.status === 'fulfilled') {
                    const indicadores = Array.isArray(resPanel.value?.indicadores) ? resPanel.value.indicadores : [];
                    const indicadorCaja = indicadores.find((i) => i?.clave === 'CAJAS_ABIERTAS');
                    setCajasAbiertas(indicadorCaja ? Number(indicadorCaja.valor || 0) : null);
                }

                if (resAjustes.status === 'fulfilled' && resAjustes.value) {
                    const listaAjustes = Array.isArray(resAjustes.value?.resultados) ? resAjustes.value.resultados : [];
                    setPendientesAutorizar(listaAjustes.length);
                } else if (!puedeAutorizar) {
                    setPendientesAutorizar(0);
                }
            } catch {
                // La barra de estado nunca bloquea la pantalla si falla una actualización silenciosa.
            }
        }

        cargarEstadoVivo();
        return () => controlador.abort();
    }, [pathname, puedeAutorizar, recarga]);

    const etiquetaCajas =
        cajasAbiertas === null
            ? 'Ver cajas'
            : cajasAbiertas === 0
                ? 'Cajas cerradas'
                : cajasAbiertas === 1
                    ? '1 caja abierta'
                    : `${formatearNumero(cajasAbiertas)} cajas abiertas`;

    const iconoAviso =
        avisoActual?.tono === 'aviso' ? (
            <IconoEstadoAlerta size={16} />
        ) : avisoActual?.tono === 'info' ? (
            <IconoEstadoInfo size={16} />
        ) : (
            <IconoEstadoOk size={16} />
        );

    const claseTonoAviso =
        avisoActual?.tono === 'aviso'
            ? estilos.avisoTonoAviso
            : avisoActual?.tono === 'info'
                ? estilos.avisoTonoInfo
                : estilos.avisoTonoExito;

    return (
        <header className={estilos.barra} aria-label="Estado en vivo y notificaciones">
            <div className={estilos.zonaCentro}>
                <div
                    data-iris-tour="notch"
                    className={`${estilos.notch} ${avisoActual ? estilos.notchConAviso : ''} ${
                        avisoActual?.esLargo ? estilos.notchConAvisoLargo : ''
                    }`}
                >
                    {avisoActual ? (
                        <div
                            key={avisoActual.id}
                            className={`${estilos.cajaAviso} ${claseTonoAviso} ${
                                avisoActual.esLargo ? estilos.cajaAvisoLargo : ''
                            } ${avisoActual.pausado ? estilos.cajaAvisoPausado : ''}`}
                            role="status"
                            aria-live="polite"
                            onMouseEnter={pausarAviso}
                            onMouseLeave={reanudarAviso}
                            onFocus={pausarAviso}
                            onBlur={reanudarAviso}
                        >
                            {!avisoActual.fijo && avisoActual.duracionMs > 0 && (
                                <span
                                    className={estilos.barraTimer}
                                    style={{ '--iris-notice-ms': `${avisoActual.duracionMs}ms` }}
                                    aria-hidden="true"
                                />
                            )}

                            <div className={estilos.cuerpoAviso}>
                                <span className={estilos.iconoAviso} aria-hidden="true">
                                    {iconoAviso}
                                </span>
                                <span className={estilos.textoAviso}>{avisoActual.texto}</span>
                                {pendientesEnCola > 0 && (
                                    <span
                                        className={estilos.badgeCola}
                                        title={`${pendientesEnCola} aviso(s) más en espera`}
                                    >
                                        +{pendientesEnCola}
                                    </span>
                                )}
                                {!avisoActual.esLargo && (
                                    <button
                                        type="button"
                                        className={estilos.cerrarAviso}
                                        onClick={cerrarAviso}
                                        aria-label="Cerrar aviso"
                                    >
                                        <IconoCerrar size={14} />
                                    </button>
                                )}
                            </div>

                            {avisoActual.esLargo && (
                                <div className={estilos.pieAviso}>
                                    <span className={estilos.pistaAviso}>
                                        {avisoActual.fijo
                                            ? 'Queda fijo hasta que confirmes'
                                            : 'Pasá el mouse para pausar'}
                                    </span>
                                    <div className={estilos.accionesAviso}>
                                        {avisoActual.accion?.onClick && (
                                            <button
                                                type="button"
                                                className={estilos.botonEntendido}
                                                onClick={() => {
                                                    avisoActual.accion.onClick();
                                                    cerrarAviso();
                                                }}
                                            >
                                                {avisoActual.accion.etiqueta || 'Abrir'}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className={
                                                avisoActual.accion?.onClick
                                                    ? estilos.botonSecundarioAviso
                                                    : estilos.botonEntendido
                                            }
                                            onClick={cerrarAviso}
                                        >
                                            Entendido
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={estilos.reposo}>
                            {!enLinea && (
                                <span className={estilos.chipOffline} role="status">
                                    <span className={estilos.puntoOffline} aria-hidden="true" />
                                    <span>Sin conexión</span>
                                </span>
                            )}

                            {puedeVerCajas ? (
                                <Tooltip texto="Ver estado de cajas del local" posicion="abajo">
                                    <Link
                                        to="/cajas"
                                        className={`${estilos.chipCaja} ${
                                            cajasAbiertas > 0 ? estilos.chipCajaAbierta : ''
                                        }`}
                                    >
                                        <span className={estilos.puntoCaja} aria-hidden="true" />
                                        <IconoCaja size={14} />
                                        <span>{etiquetaCajas}</span>
                                    </Link>
                                </Tooltip>
                            ) : (
                                <span className={estilos.chipCaja}>
                                    <span className={`${estilos.puntoCaja} ${estilos.chipCajaAbierta}`} aria-hidden="true" />
                                    <span>Cafeto · Las Lomitas</span>
                                </span>
                            )}

                            {puedeAutorizar && pendientesAutorizar > 0 && (
                                <Tooltip texto="Revisar autorizaciones pendientes" posicion="abajo">
                                    <Link
                                        to="/stock"
                                        state={{ pestana: 'AUTORIZACIONES' }}
                                        className={estilos.pillAuth}
                                    >
                                        <IconoEscudo size={14} />
                                        <span className="iris-num">
                                            {formatearNumero(pendientesAutorizar)} por autorizar
                                        </span>
                                    </Link>
                                </Tooltip>
                            )}

                            <Tooltip texto="Buscar pantallas, productos o acciones (Ctrl+K)" posicion="abajo">
                                <button
                                    type="button"
                                    data-iris-tour="buscador"
                                    className={estilos.botonLupa}
                                    onClick={onAbrirBuscador}
                                    aria-label="Buscar pantallas, productos o acciones (Ctrl + K)"
                                >
                                    <IconoBuscar size={15} />
                                    <kbd className={`iris-keycap iris-keycap-chassis ${estilos.atajo}`}>
                                        Ctrl+K
                                    </kbd>
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default BarraEstado;
