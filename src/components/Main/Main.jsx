import Tarjeta from '../Tarjeta/Tarjeta';
import { IconoCaja, IconoTaza, IconoUsuarios } from '../Iconos/Iconos';
import { getUsuarioActual } from '../../api/api';
import { saludoSegunHora } from '../../utils/formato';
import estilos from './Main.module.css';

const MODULOS = [
    {
        to: '/productos',
        titulo: 'Productos',
        descripcion: 'Carta de cafetería y góndola del minisúper con precios, ofertas y disponibilidad al momento.',
        icono: <IconoTaza />,
        accion: 'Ver el catálogo',
        insignia: 'Más usado',
        principal: true,
    },
    {
        to: '/cajas',
        titulo: 'Cajas',
        descripcion: 'Cuántas cajas hay abiertas, lo vendido hoy y los avisos del día que necesitan atención.',
        icono: <IconoCaja />,
        accion: 'Ver el panel del día',
    },
    {
        to: '/usuarios',
        titulo: 'Usuarios',
        descripcion: 'Tu perfil, tu rol y lo que tenés habilitado para hacer dentro del sistema.',
        icono: <IconoUsuarios />,
        accion: 'Ver mi perfil',
    },
];

function Main() {
    const usuario = getUsuarioActual();
    const saludo = saludoSegunHora();

    return (
        <section className={estilos.contenido}>
            <header className={estilos.bienvenida}>
                <span className={estilos.etiqueta}>Panel de inicio</span>
                <h1 className={estilos.titulo}>
                    {saludo}{usuario?.nombre ? `, ${usuario.nombre}` : ''}
                </h1>
                <p className={estilos.texto}>
                    ¿Qué querés hacer ahora? Elegí un módulo para empezar.
                    {usuario?.perfil && (
                        <> Estás trabajando como <strong className={estilos.perfil}>{usuario.perfil}</strong>.</>
                    )}
                </p>
            </header>

            <div className={estilos.modulos}>
                {MODULOS.map((modulo) => (
                    <Tarjeta key={modulo.to} {...modulo} />
                ))}
            </div>
        </section>
    );
}

export default Main;
