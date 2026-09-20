import styles from './Footer.module.css';

function Footer() {
    return (
        <footer className={styles.pie}>
            <p>Sistema Cafeto</p>
            <p>Equipo: Aramayo, Camila Anahí | Espinosa, Facundo Gabriel | Montes, Juan Maximiliano | Roldán, Ariel Guevara</p>
            <p>Instituto Superior del Milagro N° 8207 - © 2026</p>
        </footer>
    );
}

export default Footer;