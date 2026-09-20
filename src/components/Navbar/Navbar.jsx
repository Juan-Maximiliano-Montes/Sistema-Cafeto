import styles from './Navbar.module.css';
import logo from '../../assets/logo.png';

const Navbar = ({titulo = "Sistema Cafeto"}) => {
    return (
        <header className={styles.barra}>
            <img src={logo} alt="Logo del sistema" className={styles.logo} />
            <h1 className={styles.titulo}>Sistema Cafeto</h1>
            <nav className={styles.menu} >
                <a href="#">Inicio</a>
                <a href="#">Módulos</a>
                <a href="#">Equipo</a>
            </nav>
        </header>
    );
}

export default Navbar;