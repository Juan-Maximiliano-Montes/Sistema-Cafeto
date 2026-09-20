import styles from './Tarjeta.module.css';

function Tarjeta ({ titulo, descripcion, estado = 'Pendiente', principal = false}) {
    return (
        <article className={`${styles.tarjeta} ${principal ? styles.destacada : ''}`}>
            <h3>{titulo}</h3>
            <p>{descripcion}</p>
            {principal && <span className={styles.insignia}>Módulo Central</span>}
            <p className={styles.estado}>Estado: {estado}</p>
        </article>
    );
}

export default Tarjeta;