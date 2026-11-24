import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { haySesion, URL_WEB_DJANGO } from '../../api/api';
import { IconoEstadoError, IconoEstadoOk, IconoExterno } from '../Iconos/Iconos';
import styles from './Footer.module.css';

function Footer({ modoAutenticado = false }) {
    const sesionActiva = haySesion();
    const [enLinea, setEnLinea] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

    useEffect(() => {
        const marcarEnLinea = () => setEnLinea(true);
        const marcarSinConexion = () => setEnLinea(false);
        window.addEventListener('online', marcarEnLinea);
        window.addEventListener('offline', marcarSinConexion);
        return () => {
            window.removeEventListener('online', marcarEnLinea);
            window.removeEventListener('offline', marcarSinConexion);
        };
    }, []);

    return (
        <footer className={styles.pie}>
            <div className={styles.grilla}>
                <div className={styles.columna}>
                    <strong className={styles.marca}>Cafeto Las Lomitas · Campo Quijano</strong>
                    <span
                        className={`${styles.estado} ${enLinea ? '' : styles.estadoSinConexion}`}
                        role="status"
                        aria-live="polite"
                    >
                        <span className={enLinea ? styles.puntoOk : styles.puntoError} aria-hidden="true">
                            {enLinea ? <IconoEstadoOk size={10} /> : <IconoEstadoError size={10} />}
                        </span>
                        <span>{enLinea ? 'Sistema operativo en línea' : 'Sin conexión con el servidor'}</span>
                    </span>
                </div>

                <nav className={styles.columna} aria-label="Accesos rápidos del pie de página">
                    <span className={styles.tituloColumna}>Accesos rápidos</span>
                    <ul className={styles.listaEnlaces}>
                        {modoAutenticado ? (
                            <>
                                <li><Link to="/inicio" className={styles.enlace}>Inicio</Link></li>
                                <li><Link to="/productos" className={styles.enlace}>Productos</Link></li>
                                <li><Link to="/stock" className={styles.enlace}>Stock</Link></li>
                                <li><Link to="/catalogo" className={styles.enlace}>Marcas y rubros</Link></li>
                                <li><Link to="/cajas" className={styles.enlace}>Cajas</Link></li>
                                <li><Link to="/reportes" className={styles.enlace}>Reportes</Link></li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link to={sesionActiva ? '/inicio' : '/login'} className={styles.enlace}>
                                        {sesionActiva ? 'Ir a mi panel' : 'Ingresar'}
                                    </Link>
                                </li>
                                <li>
                                    <a href="/#modulos-sistema" className={styles.enlace}>
                                        Recorrer módulos
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href={URL_WEB_DJANGO}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={styles.enlace}
                                    >
                                        <span>Panel completo</span>
                                        <IconoExterno size={13} />
                                    </a>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>

                <div className={styles.columna}>
                    <span className={styles.tituloColumna}>Equipo de desarrollo</span>
                    <p className={styles.equipo}>
                        Camila Anahí Aramayo, Facundo Gabriel Espinosa, Juan Maximiliano Montes y Ariel Guevara Roldán · 2026
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
