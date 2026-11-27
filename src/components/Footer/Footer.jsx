import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { haySesion, URL_WEB_DJANGO } from '../../api/api';
import { IconoEstadoError, IconoEstadoOk, IconoExterno } from '../Iconos/Iconos';
import styles from './Footer.module.css';

function Footer({ modoAutenticado = false }) {
    const sesionActiva = haySesion();
    const [enLinea, setEnLinea] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

    useEffect(() => {
        if (modoAutenticado) return undefined;
        const marcarEnLinea = () => setEnLinea(true);
        const marcarSinConexion = () => setEnLinea(false);
        window.addEventListener('online', marcarEnLinea);
        window.addEventListener('offline', marcarSinConexion);
        return () => {
            window.removeEventListener('online', marcarEnLinea);
            window.removeEventListener('offline', marcarSinConexion);
        };
    }, [modoAutenticado]);

    if (modoAutenticado) {
        return (
            <footer className={`${styles.pie} ${styles.pieCompacto}`}>
                <div className={styles.franjaCompacta}>
                    <div className={styles.izquierdaCompacta}>
                        <span className={styles.marcaCompacta}>Cafeto Las Lomitas · Campo Quijano</span>
                        <span className={styles.separadorCompacto} aria-hidden="true">·</span>
                        <a
                            href={URL_WEB_DJANGO}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.enlaceCompacto}
                        >
                            <span>Panel completo</span>
                            <span aria-hidden="true">↗</span>
                        </a>
                    </div>

                    <p className={styles.creditosCompactos}>
                        Camila Aramayo, Facundo Espinosa, Juan Montes y Ariel Roldán · 2026
                    </p>
                </div>
            </footer>
        );
    }

    return (
        <footer className={styles.pie}>
            <div className={`container ${styles.grilla}`}>
                <div className="row gx-4 gy-3">
                    <div className={`col-12 col-md-4 ${styles.columna}`}>
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
                        <span className={styles.copyright}>© 2026 Cafeto Las Lomitas</span>
                    </div>

                    <nav className={`col-12 col-md-4 ${styles.columna}`} aria-label="Accesos rápidos del pie de página">
                        <span className={styles.tituloColumna}>Accesos rápidos</span>
                        <ul className={styles.listaEnlaces}>
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
                        </ul>
                    </nav>

                    <div className={`col-12 col-md-4 ${styles.columna}`}>
                        <span className={styles.tituloColumna}>Equipo de desarrollo</span>
                        <p className={styles.equipo}>
                            Camila Anahí Aramayo, Facundo Gabriel Espinosa, Juan Maximiliano Montes y Ariel Guevara Roldán
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
