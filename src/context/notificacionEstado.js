import { createContext } from 'react';

export const CLAVE_SONIDO_IRIS = 'cafeto.iris.sonido';

export const NotificacionContext = createContext(null);

let audioCtx = null;

export const leerSonidoActivo = () => {
    try {
        return localStorage.getItem(CLAVE_SONIDO_IRIS) !== '0';
    } catch {
        return true;
    }
};

export const guardarSonidoActivo = (activo) => {
    try {
        localStorage.setItem(CLAVE_SONIDO_IRIS, activo ? '1' : '0');
    } catch {
        // Si el navegador bloquea localStorage, la preferencia sigue viva en memoria.
    }
};

/**
 * Tono suave 100% offline con Web Audio API (replica el chime de cafeto-iris.js).
 */
export const tocarChimeIris = (tono = 'exito', habilitado = true) => {
    if (!habilitado || typeof window === 'undefined') return;
    try {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return;
        if (!audioCtx) audioCtx = new AudioCtor();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        const ahora = audioCtx.currentTime;
        const notas =
            tono === 'aviso'
                ? [
                      [659.25, 0, 0.14, 0.06],
                      [880, 0.11, 0.2, 0.065],
                  ]
                : [
                      [523.25, 0, 0.11, 0.045],
                      [659.25, 0.09, 0.16, 0.045],
                  ];

        notas.forEach(([frecuencia, inicio, duracion, ganancia]) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(frecuencia, ahora + inicio);
            gain.gain.setValueAtTime(0.0001, ahora + inicio);
            gain.gain.exponentialRampToValueAtTime(ganancia, ahora + inicio + 0.018);
            gain.gain.exponentialRampToValueAtTime(0.0001, ahora + inicio + duracion);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(ahora + inicio);
            osc.stop(ahora + inicio + duracion + 0.02);
        });
    } catch {
        // El navegador puede bloquear audio si aún no hubo interacción del usuario.
    }
};
