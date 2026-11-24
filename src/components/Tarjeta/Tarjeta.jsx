import { Link } from 'react-router-dom';
import estilos from './Tarjeta.module.css';

function Tarjeta({ to, titulo, descripcion, icono, accion = 'Entrar', insignia, principal = false }) {
    return (
        <Link to={to} className={`${estilos.tarjeta} ${principal ? estilos.destacada : ''}`}>
            {insignia && <span className={estilos.insignia}>{insignia}</span>}
            <span className={estilos.icono}>{icono}</span>
            <h2 className={estilos.titulo}>{titulo}</h2>
            <p className={estilos.descripcion}>{descripcion}</p>
            <span className={estilos.accion}>
                {accion} <span aria-hidden="true">→</span>
            </span>
        </Link>
    );
}

export default Tarjeta;
