import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    getAjustesStock,
    getPanelDelDia,
    getUsuarioActual,
    tienePermiso,
} from '../../api/api';
import { formatearNumero } from '../../utils/formato';
import {
    IconoBuscar,
    IconoCaja,
    IconoEscudo,
    IconoEstadoOk,
} from '../Iconos/Iconos';
import estilos from './BarraEstado.module.css';

const inicialesDe = (usuario) => {
    const primero = usuario?.nombre?.[0] || '';
    const segundo = usuario?.apellido?.[0] || '';
    return `${primero}${segundo}`.toUpperCase() || 'CF';
};

function BarraEstado({ onAbrirBuscador }) {
    const { pathname } = useLocation();
    const usuario = getUsuarioActual();
    const puedeAutorizar = tienePermiso(usuario, 'autorizar_ajustes');

    const [cajasAbiertas, setCajasAbiertas] = useState(null);
    const [pendientesAutorizar, setPendientesAutorizar] = useState(0);
    const [recarga, setRecarga] = useState(0);

    useEffect(() => {
        const alActualizarEstado = () => setRecarga((n) => n + 1);
        window.addEventListener('cafeto:estado-actualizar', alActualizarEstado);
        return () => window.removeEventListener('cafeto:estado-actualizar', alActualizarEstado);
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
            } finally {
                // Sin spinner bloqueante para mantener la barra fluida.
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

    return (
        <div className={estilos.contenedor}>
            <header className={estilos.pildora} aria-label="Estado en vivo y acceso rápido">
                <div className={estilos.grupoEstado}>
                    <Link
                        to="/cajas"
                        className={`${estilos.chipEstado} ${cajasAbiertas > 0 ? estilos.chipOk : estilos.chipNeutro}`}
                    >
                        {cajasAbiertas > 0 ? <IconoEstadoOk size={14} /> : <IconoCaja size={15} />}
                        <span>{etiquetaCajas}</span>
                    </Link>

                    {puedeAutorizar && pendientesAutorizar > 0 && (
                        <Link
                            to="/stock"
                            state={{ pestana: 'AUTORIZACIONES' }}
                            className={`${estilos.chipEstado} ${estilos.chipAlerta}`}
                        >
                            <IconoEscudo size={14} />
                            <span>{formatearNumero(pendientesAutorizar)} por autorizar</span>
                        </Link>
                    )}
                </div>

                <div className={estilos.grupoAcciones}>
                    <button
                        type="button"
                        className={estilos.botonBuscar}
                        onClick={onAbrirBuscador}
                        aria-label="Buscar pantallas o productos (Ctrl+K)"
                    >
                        <IconoBuscar size={16} />
                        <span>Buscar</span>
                        <kbd className={estilos.atajo}>Ctrl+K</kbd>
                    </button>

                    <Link
                        to="/perfil"
                        className={estilos.enlacePerfil}
                        aria-label={`Mi perfil: ${usuario?.nombre || 'Cuenta'}`}
                    >
                        <span className={estilos.avatar} aria-hidden="true">
                            {inicialesDe(usuario)}
                        </span>
                        <span className={estilos.nombrePerfil}>{usuario?.nombre || 'Mi perfil'}</span>
                    </Link>
                </div>
            </header>
        </div>
    );
}

export default BarraEstado;
