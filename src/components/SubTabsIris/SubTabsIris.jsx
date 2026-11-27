import { useEffect, useId, useRef, useState } from 'react';
import { IconoCerrar, IconoChevron } from '../Iconos/Iconos';
import estilos from './SubTabsIris.module.css';

/**
 * Sub-pestañas soldadas Cafeto × iRiS ("carpeta física real").
 * En desktop suelda la pestaña activa al cuerpo con curvas cóncavas de 14px.
 * En pantallas chicas cambia a selector táctil + Bottom Sheet nativo (<dialog>).
 */
function SubTabsIris({
    pestanas = [],
    activa,
    onCambiar,
    meta = '',
    ariaLabel = 'Secciones de la pantalla',
    acciones = null,
    children,
}) {
    const [sheetAbierto, setSheetAbierto] = useState(false);
    const sheetRef = useRef(null);
    const idSheetTitulo = useId();

    const pestanaActual = pestanas.find((p) => p.id === activa) || pestanas[0];

    useEffect(() => {
        const dialogo = sheetRef.current;
        if (!dialogo) return;
        if (sheetAbierto && !dialogo.open) {
            dialogo.showModal();
        } else if (!sheetAbierto && dialogo.open) {
            dialogo.close();
        }
    }, [sheetAbierto]);

    const seleccionar = (id) => {
        if (id && id !== activa) {
            onCambiar?.(id);
        }
        setSheetAbierto(false);
    };

    const alPresionarTecla = (evento) => {
        const habilitadas = pestanas.filter((p) => !p.deshabilitada);
        if (habilitadas.length <= 1) return;
        const idx = habilitadas.findIndex((p) => p.id === activa);
        if (idx === -1) return;

        if (evento.key === 'ArrowRight') {
            evento.preventDefault();
            seleccionar(habilitadas[(idx + 1) % habilitadas.length].id);
        } else if (evento.key === 'ArrowLeft') {
            evento.preventDefault();
            seleccionar(habilitadas[(idx - 1 + habilitadas.length) % habilitadas.length].id);
        } else if (evento.key === 'Home') {
            evento.preventDefault();
            seleccionar(habilitadas[0].id);
        } else if (evento.key === 'End') {
            evento.preventDefault();
            seleccionar(habilitadas[habilitadas.length - 1].id);
        }
    };

    return (
        <div className={estilos.contenedor}>
            <div className={estilos.cabecera}>
                <div className={estilos.filaDesktop}>
                    <div
                        className={estilos.tiraPestanas}
                        role="tablist"
                        aria-label={ariaLabel}
                        onKeyDown={alPresionarTecla}
                    >
                        {pestanas.map((item, indice) => {
                            const esActiva = item.id === activa;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={esActiva}
                                    tabIndex={esActiva ? 0 : -1}
                                    disabled={item.deshabilitada}
                                    className={`${estilos.pestana} ${indice === 0 ? estilos.primera : ''} ${
                                        esActiva ? estilos.activa : ''
                                    }`}
                                    onClick={() => seleccionar(item.id)}
                                >
                                    {item.icono && (
                                        <span className={estilos.icono} aria-hidden="true">
                                            {item.icono}
                                        </span>
                                    )}
                                    <span>{item.etiqueta}</span>
                                    {item.conteo != null && item.conteo !== '' && (
                                        <span className={`${estilos.conteo} iris-num`}>{item.conteo}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className={estilos.lateralDerecho}>
                        {acciones}
                        {meta && (
                            <span className={estilos.meta} aria-hidden="true">
                                {meta}
                            </span>
                        )}
                    </div>
                </div>

                <div className={estilos.filaMovil}>
                    <button
                        type="button"
                        className={estilos.selectorMovil}
                        onClick={() => setSheetAbierto(true)}
                        aria-haspopup="dialog"
                        aria-expanded={sheetAbierto}
                    >
                        <span className={estilos.selectorIzq}>
                            {pestanaActual?.icono && (
                                <span className={estilos.icono} aria-hidden="true">
                                    {pestanaActual.icono}
                                </span>
                            )}
                            <span className={estilos.selectorTitulo}>{pestanaActual?.etiqueta}</span>
                            {pestanaActual?.conteo != null && pestanaActual.conteo !== '' && (
                                <span className={`${estilos.conteo} iris-num`}>{pestanaActual.conteo}</span>
                            )}
                        </span>
                        <span className={estilos.selectorBadge}>
                            <span>{pestanas.length} vistas</span>
                            <IconoChevron size={15} />
                        </span>
                    </button>
                    {acciones && <div className={estilos.accionesMovil}>{acciones}</div>}
                </div>
            </div>

            {children && <div className={estilos.cuerpo}>{children}</div>}

            <dialog
                ref={sheetRef}
                className={estilos.sheet}
                aria-labelledby={idSheetTitulo}
                onCancel={(e) => {
                    e.preventDefault();
                    setSheetAbierto(false);
                }}
                onClick={(e) => {
                    if (e.target === sheetRef.current) setSheetAbierto(false);
                }}
            >
                <div className={estilos.sheetCabecera}>
                    <h2 id={idSheetTitulo} className={estilos.sheetTitulo}>
                        {ariaLabel}
                    </h2>
                    <button
                        type="button"
                        className={estilos.sheetCerrar}
                        onClick={() => setSheetAbierto(false)}
                        aria-label="Cerrar selector de vistas"
                    >
                        <IconoCerrar size={17} />
                    </button>
                </div>
                <div className={estilos.sheetLista}>
                    {pestanas.map((item) => {
                        const esActiva = item.id === activa;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                disabled={item.deshabilitada}
                                className={`${estilos.sheetOpcion} ${esActiva ? estilos.sheetOpcionActiva : ''}`}
                                onClick={() => seleccionar(item.id)}
                            >
                                {item.icono && (
                                    <span className={estilos.icono} aria-hidden="true">
                                        {item.icono}
                                    </span>
                                )}
                                <span className={estilos.sheetOpcionTexto}>{item.etiqueta}</span>
                                {item.conteo != null && item.conteo !== '' && (
                                    <span className={`${estilos.conteo} iris-num`}>{item.conteo}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </dialog>
        </div>
    );
}

export default SubTabsIris;
