import { IconoEstadoError } from '../Iconos/Iconos';
import estilos from './AvisoError.module.css';

function AvisoError({ titulo = 'No pudimos cargar los datos', mensaje, onReintentar, reintentando = false }) {
    return (
        <div className={estilos.caja} role="alert">
            <span className={estilos.icono} aria-hidden="true">
                <IconoEstadoError size={18} />
            </span>
            <div className={estilos.textos}>
                <strong className={estilos.titulo}>{titulo}</strong>
                <p className={estilos.mensaje}>{mensaje}</p>
            </div>
            {onReintentar && (
                <button type="button" className={estilos.boton} onClick={onReintentar} disabled={reintentando}>
                    {reintentando ? 'Reintentando...' : 'Reintentar'}
                </button>
            )}
        </div>
    );
}

export default AvisoError;
