import { useEffect, useState } from 'react';
import estilos from './BarraCarga.module.css';

export function BarraCarga({ activa, etiqueta = 'Cargando datos...' }) {
    const [progreso, setProgreso] = useState(activa ? 22 : 0);
    const [visible, setVisible] = useState(activa);

    useEffect(() => {
        if (activa) {
            const inicio = setTimeout(() => {
                setVisible(true);
                setProgreso((actual) => (actual > 10 && actual < 90 ? actual : 22));
            }, 0);
            const intervalo = setInterval(() => {
                setProgreso((actual) => (actual < 85 ? actual + Math.max(2, (85 - actual) * 0.2) : actual));
            }, 220);
            return () => {
                clearTimeout(inicio);
                clearInterval(intervalo);
            };
        }

        const completar = setTimeout(() => setProgreso(100), 0);
        const ocultar = setTimeout(() => {
            setVisible(false);
            setProgreso(0);
        }, 280);
        return () => {
            clearTimeout(completar);
            clearTimeout(ocultar);
        };
    }, [activa]);

    return (
        <div
            className={estilos.pista}
            role="progressbar"
            aria-label={etiqueta}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progreso)}
            aria-hidden={!visible}
            style={{ opacity: visible ? 1 : 0 }}
        >
            <span className={estilos.relleno} style={{ width: `${progreso}%` }} />
        </div>
    );
}

export function EsqueletoCatalogo({ cantidad = 6 }) {
    return (
        <div className={estilos.gridEsqueleto} aria-busy="true" role="status" aria-live="polite">
            <span className={estilos.oculto}>Cargando productos del catálogo...</span>
            {Array.from({ length: cantidad }, (_, indice) => (
                <div key={indice} className={estilos.tarjetaEsqueleto} aria-hidden="true">
                    <div className={`${estilos.bloque} ${estilos.fotoEsqueleto}`} />
                    <div className={estilos.cuerpoEsqueleto}>
                        <div className={`${estilos.bloque} ${estilos.lineaCorta}`} />
                        <div className={`${estilos.bloque} ${estilos.lineaTitulo}`} />
                        <div className={`${estilos.bloque} ${estilos.lineaTexto}`} />
                        <div className={`${estilos.bloque} ${estilos.lineaPrecio}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function EsqueletoPanel() {
    return (
        <div className={estilos.grillaPanel} aria-busy="true" role="status" aria-live="polite">
            <span className={estilos.oculto}>Cargando el panel del día...</span>
            <div className={estilos.tarjetaPanelEsqueleto} aria-hidden="true">
                <div className={`${estilos.bloque} ${estilos.lineaCorta}`} />
                <div className={`${estilos.bloque} ${estilos.numeroEsqueleto}`} />
                <div className={`${estilos.bloque} ${estilos.lineaTexto}`} />
            </div>
            <div className={estilos.tarjetaPanelEsqueleto} aria-hidden="true">
                <div className={`${estilos.bloque} ${estilos.lineaTitulo}`} />
                <div className={`${estilos.bloque} ${estilos.lineaTexto}`} />
                <div className={`${estilos.bloque} ${estilos.lineaTexto}`} />
                <div className={`${estilos.bloque} ${estilos.lineaCorta}`} />
            </div>
            <div className={`${estilos.tarjetaPanelEsqueleto} ${estilos.ancho}`} aria-hidden="true">
                <div className={`${estilos.bloque} ${estilos.lineaCorta}`} />
                <div className={`${estilos.bloque} ${estilos.lineaTexto}`} />
            </div>
        </div>
    );
}
