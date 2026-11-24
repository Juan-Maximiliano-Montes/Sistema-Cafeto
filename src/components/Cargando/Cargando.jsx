import estilos from './Cargando.module.css';

function Cargando({ texto = 'Cargando...' }) {
    return (
        <div className={estilos.contenedor} role="status" aria-live="polite">
            <span className={estilos.spinner} aria-hidden="true" />
            <span>{texto}</span>
        </div>
    );
}

export default Cargando;
