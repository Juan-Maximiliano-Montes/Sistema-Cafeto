import Tarjeta from '../Tarjeta/Tarjeta';
import styles from './Main.module.css';

function Main() {
    return (
        <main className={styles.contenido}>
            <h2>Sistema Cafeto</h2>
            <p>
                Plataforma integral diseñada para optimizar la gestión combinada de cafetería y minisúper, agilizando la atención al cliente y el control de inventarios.
            </p>

            <h3>Módulos Previstos</h3>
            <section className={styles.modulos}>
                <Tarjeta
                    titulo="Módulo Cafetería"
                    descripcion="Gestión de pedidos de bebidas, combos de desayunos y pedidos en tiempo real"
                    estado="Activo"
                    principal
                />
                <Tarjeta
                    titulo="Módulo Minisúper"
                    descripcion="Control de stock de golosinas, fiambres, bebidas y prodcutos de góndola."
                    estado="Activo"
                />
                <Tarjeta
                    titulo="Módulo Caja y Ventas"
                    descripcion="Facturación rápida, aruqeo diario y soporte para múltiples medios de pago."
                />
            </section>
        </main>
    );
}

export default Main;