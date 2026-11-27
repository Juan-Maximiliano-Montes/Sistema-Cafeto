import { IconoEstadoError, IconoEstadoInfo, IconoEstadoOk } from '../Iconos/Iconos';
import Tooltip from '../Tooltip/Tooltip';
import estilos from './CampoFormulario.module.css';

/**
 * Wrapper reutilizable para campos controlados con react-hook-form (mode: 'onBlur').
 * Agrega tooltip de ayuda contextual, contador de caracteres en vivo e indicador
 * visual de validación (error inline o estado válido al salir del foco).
 */
function CampoFormulario({
    id,
    etiqueta,
    requerido = false,
    ayudaTooltip = '',
    pista = '',
    error = '',
    valido = false,
    longitudActual = null,
    longitudMaxima = null,
    children,
}) {
    const idError = error ? `${id}-error` : undefined;
    const mostrarContador = typeof longitudActual === 'number' && typeof longitudMaxima === 'number' && longitudMaxima > 0;
    const cercaDelLimite = mostrarContador && longitudActual / longitudMaxima >= 0.85;
    const excedido = mostrarContador && longitudActual > longitudMaxima;

    return (
        <div className={estilos.campo}>
            <div className={estilos.filaCabecera}>
                <label htmlFor={id} className={estilos.etiqueta}>
                    <span>{etiqueta}</span>
                    {requerido && (
                        <span className={estilos.requerido} aria-hidden="true">
                            *
                        </span>
                    )}
                </label>

                <div className={estilos.metaDerecha}>
                    {valido && !error && (
                        <span className={estilos.badgeValido} aria-label="Campo válido">
                            <IconoEstadoOk size={13} />
                            <span>Listo</span>
                        </span>
                    )}

                    {mostrarContador && (
                        <span
                            className={`${estilos.contador} iris-num ${
                                excedido
                                    ? estilos.contadorExcedido
                                    : cercaDelLimite
                                        ? estilos.contadorAlerta
                                        : ''
                            }`}
                            aria-live="polite"
                        >
                            {longitudActual} / {longitudMaxima}
                        </span>
                    )}

                    {ayudaTooltip && (
                        <Tooltip texto={ayudaTooltip} posicion="arriba" esEtiqueta>
                            <span className={estilos.iconoAyuda} aria-label={`Ayuda sobre ${etiqueta}`}>
                                <IconoEstadoInfo size={15} />
                            </span>
                        </Tooltip>
                    )}
                </div>
            </div>

            <div className={estilos.control}>{children}</div>

            {error ? (
                <p id={idError} className={estilos.mensajeError} role="alert">
                    <IconoEstadoError size={14} />
                    <span>{error}</span>
                </p>
            ) : pista ? (
                <p className={estilos.pista}>{pista}</p>
            ) : null}
        </div>
    );
}

export default CampoFormulario;
