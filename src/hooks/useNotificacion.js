import { useContext } from 'react';
import { NotificacionContext } from '../context/notificacionEstado';

const FALLBACK_NOTIFICACION = {
    avisoActual: null,
    pendientesEnCola: 0,
    sonidoActivo: true,
    notificar: () => null,
    cerrarAviso: () => {},
    pausarAviso: () => {},
    reanudarAviso: () => {},
    alternarSonido: () => {},
};

/**
 * Hook para emitir y controlar notificaciones en el Notch central Cafeto × iRiS.
 * Si se llama fuera de NotificacionProvider devuelve un fallback inocuo para
 * no romper componentes aislados durante migraciones parciales.
 */
export function useNotificacion() {
    const contexto = useContext(NotificacionContext);
    return contexto || FALLBACK_NOTIFICACION;
}
