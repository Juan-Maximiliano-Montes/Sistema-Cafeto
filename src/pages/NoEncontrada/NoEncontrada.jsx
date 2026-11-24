import { Link } from 'react-router-dom';
import { haySesion } from '../../api/api';
import estilos from './NoEncontrada.module.css';

function NoEncontrada() {
    const sesionActiva = haySesion();

    return (
        <section className={estilos.contenedor}>
            <span className={estilos.codigo}>404</span>
            <h1 className={estilos.titulo}>Esta página no existe</h1>
            <p className={estilos.texto}>Puede que la dirección esté mal escrita o que la sección se haya movido.</p>
            <div className={estilos.acciones}>
                {sesionActiva ? (
                    <Link to="/inicio" className={estilos.boton}>
                        Volver al inicio
                    </Link>
                ) : (
                    <>
                        <Link to="/login" className={estilos.boton}>
                            Ir a iniciar sesión
                        </Link>
                        <Link to="/" className={estilos.botonSecundario}>
                            Volver a la portada
                        </Link>
                    </>
                )}
            </div>
        </section>
    );
}

export default NoEncontrada;
