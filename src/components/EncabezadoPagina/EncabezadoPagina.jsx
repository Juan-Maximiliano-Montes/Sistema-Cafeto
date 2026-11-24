import { Link } from 'react-router-dom';
import { IconoVolver } from '../Iconos/Iconos';
import estilos from './EncabezadoPagina.module.css';

function EncabezadoPagina({
    etiqueta,
    titulo,
    subtitulo,
    volverA,
    textoVolver = 'Volver al inicio',
    children,
}) {
    return (
        <header className={estilos.encabezado}>
            <div className={estilos.columnaPrincipal}>
                {volverA && (
                    <Link to={volverA} className={estilos.volver}>
                        <IconoVolver size={17} />
                        <span>{textoVolver}</span>
                    </Link>
                )}
                {etiqueta && <span className={estilos.etiqueta}>{etiqueta}</span>}
                <h1 className={estilos.titulo}>{titulo}</h1>
                {subtitulo && <p className={estilos.subtitulo}>{subtitulo}</p>}
            </div>
            {children && <div className={estilos.acciones}>{children}</div>}
        </header>
    );
}

export default EncabezadoPagina;
