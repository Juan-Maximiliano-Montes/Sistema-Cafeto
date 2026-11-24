import { formatearNumero } from '../../utils/formato';
import estilos from './Paginacion.module.css';

function Paginacion({
    pagina = 1,
    hayMas = false,
    cargando = false,
    cantidad = 0,
    etiquetaSingular = 'ítem',
    etiquetaPlural = 'ítems',
    ariaLabel = 'Paginación del listado',
    onCambiarPagina,
}) {
    if (cantidad <= 0 && pagina <= 1) {
        return null;
    }

    return (
        <nav className={estilos.paginacion} aria-label={ariaLabel}>
            <p className={estilos.resumen} aria-live="polite">
                {formatearNumero(cantidad)} {cantidad === 1 ? etiquetaSingular : etiquetaPlural} en esta página
            </p>

            <div className={estilos.controles}>
                <button
                    type="button"
                    className={estilos.boton}
                    disabled={pagina <= 1 || cargando}
                    onClick={() => onCambiarPagina?.(pagina - 1)}
                >
                    <span aria-hidden="true">←</span>
                    <span>Anterior</span>
                </button>

                <span className={estilos.paginaActual} aria-current="page">
                    Página {formatearNumero(pagina)}
                </span>

                <button
                    type="button"
                    className={estilos.boton}
                    disabled={!hayMas || cargando}
                    onClick={() => onCambiarPagina?.(pagina + 1)}
                >
                    <span>Siguiente</span>
                    <span aria-hidden="true">→</span>
                </button>
            </div>
        </nav>
    );
}

export default Paginacion;
