import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    guardarSonidoActivo,
    leerSonidoActivo,
    NotificacionContext,
    tocarChimeIris,
} from './notificacionEstado';

const DURACION_CORTA_MS = 4500;
const DURACION_LARGA_MS = 7500;
const UMBRAL_TEXTO_LARGO = 78;
const MAX_COLA = 8;

let siguienteId = 1;

const normalizarTono = (tono) => {
    if (tono === 'aviso' || tono === 'info') return tono;
    return 'exito';
};

/**
 * Proveedor global de notificaciones para el Notch central Cafeto × iRiS.
 * Contrato iRiS: solo recibe avisos no-críticos ('exito' | 'aviso' | 'info').
 * Los errores críticos siempre deben mostrarse inline en la pantalla.
 */
export function NotificacionProvider({ children }) {
    const [avisoActual, setAvisoActual] = useState(null);
    const [cola, setCola] = useState([]);
    const [sonidoActivo, setSonidoActivo] = useState(leerSonidoActivo);

    const temporizadorRef = useRef(null);
    const avisoActualRef = useRef(null);
    const colaRef = useRef([]);
    const sonidoRef = useRef(sonidoActivo);

    useEffect(() => {
        avisoActualRef.current = avisoActual;
    }, [avisoActual]);

    useEffect(() => {
        colaRef.current = cola;
    }, [cola]);

    useEffect(() => {
        sonidoRef.current = sonidoActivo;
    }, [sonidoActivo]);

    const limpiarTemporizador = useCallback(() => {
        if (temporizadorRef.current !== null) {
            window.clearTimeout(temporizadorRef.current);
            temporizadorRef.current = null;
        }
    }, []);

    const activarAviso = useCallback(
        function programarAviso(entrada, { silencioso = false } = {}) {
            limpiarTemporizador();
            const ahora = Date.now();
            const preparado = {
                ...entrada,
                pausado: false,
                iniciadoEn: ahora,
                expiraEn: entrada.fijo ? 0 : ahora + entrada.restanteMs,
            };

            avisoActualRef.current = preparado;
            setAvisoActual(preparado);

            if (!silencioso) {
                tocarChimeIris(preparado.tono, sonidoRef.current);
            }

            if (!preparado.fijo && preparado.restanteMs > 0) {
                temporizadorRef.current = window.setTimeout(() => {
                    const siguiente = colaRef.current[0];
                    if (siguiente) {
                        const resto = colaRef.current.slice(1);
                        colaRef.current = resto;
                        setCola(resto);
                        programarAviso(siguiente);
                    } else {
                        avisoActualRef.current = null;
                        setAvisoActual(null);
                    }
                }, preparado.restanteMs);
            }
        },
        [limpiarTemporizador]
    );

    const cerrarAviso = useCallback(() => {
        limpiarTemporizador();
        const siguiente = colaRef.current[0];
        if (siguiente) {
            const resto = colaRef.current.slice(1);
            colaRef.current = resto;
            setCola(resto);
            activarAviso(siguiente);
        } else {
            avisoActualRef.current = null;
            setAvisoActual(null);
        }
    }, [activarAviso, limpiarTemporizador]);

    const pausarAviso = useCallback(() => {
        const actual = avisoActualRef.current;
        if (!actual || actual.fijo || actual.pausado) return;

        limpiarTemporizador();
        const restante = actual.expiraEn
            ? actual.expiraEn - Date.now()
            : actual.restanteMs - (Date.now() - actual.iniciadoEn);
        const actualizado = {
            ...actual,
            restanteMs: Math.max(800, restante),
            pausado: true,
        };
        avisoActualRef.current = actualizado;
        setAvisoActual(actualizado);
    }, [limpiarTemporizador]);

    const reanudarAviso = useCallback(() => {
        const actual = avisoActualRef.current;
        if (!actual || actual.fijo || !actual.pausado) return;

        const ahora = Date.now();
        const actualizado = {
            ...actual,
            pausado: false,
            iniciadoEn: ahora,
            expiraEn: ahora + actual.restanteMs,
        };
        avisoActualRef.current = actualizado;
        setAvisoActual(actualizado);

        limpiarTemporizador();
        temporizadorRef.current = window.setTimeout(cerrarAviso, actualizado.restanteMs);
    }, [cerrarAviso, limpiarTemporizador]);

    const notificar = useCallback(
        ({ texto, tono = 'exito', duracionMs, fijo = false, accion = null, silencioso = false } = {}) => {
            const mensaje = String(texto ?? '').trim();
            if (!mensaje) return null;

            const tonoNormalizado = normalizarTono(tono);
            const esLargo = Boolean(fijo || accion || mensaje.length > UMBRAL_TEXTO_LARGO);
            const duracion =
                typeof duracionMs === 'number' && duracionMs > 0
                    ? duracionMs
                    : esLargo
                        ? DURACION_LARGA_MS
                        : DURACION_CORTA_MS;

            const nuevoAviso = {
                id: siguienteId++,
                texto: mensaje,
                tono: tonoNormalizado,
                esLargo,
                fijo: Boolean(fijo),
                accion,
                duracionMs: duracion,
                restanteMs: duracion,
                pausado: false,
            };

            if (!avisoActualRef.current) {
                activarAviso(nuevoAviso, { silencioso });
            } else {
                setCola((prev) => {
                    const proxima = [...prev, nuevoAviso].slice(0, MAX_COLA);
                    colaRef.current = proxima;
                    return proxima;
                });
            }

            return nuevoAviso.id;
        },
        [activarAviso]
    );

    const alternarSonido = useCallback(() => {
        setSonidoActivo((prev) => {
            const nuevo = !prev;
            guardarSonidoActivo(nuevo);
            return nuevo;
        });
    }, []);

    useEffect(() => () => limpiarTemporizador(), [limpiarTemporizador]);

    const valor = useMemo(
        () => ({
            avisoActual,
            pendientesEnCola: cola.length,
            sonidoActivo,
            notificar,
            cerrarAviso,
            pausarAviso,
            reanudarAviso,
            alternarSonido,
        }),
        [
            avisoActual,
            cola.length,
            sonidoActivo,
            notificar,
            cerrarAviso,
            pausarAviso,
            reanudarAviso,
            alternarSonido,
        ]
    );

    return <NotificacionContext.Provider value={valor}>{children}</NotificacionContext.Provider>;
}
