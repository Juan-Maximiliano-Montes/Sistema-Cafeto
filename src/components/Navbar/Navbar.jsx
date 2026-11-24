import { Link, NavLink, useLocation } from 'react-router-dom';
import { haySesion } from '../../api/api';
import { useTamanoTexto } from '../../hooks/useTamanoTexto';
import { useTema } from '../../hooks/useTema';
import Tooltip from '../Tooltip/Tooltip';
import { IconoLuna, IconoSol } from '../Iconos/Iconos';
import logoNegativo from '../../assets/cafeto-horizontal-negativo.svg';
import logoPositivo from '../../assets/cafeto-horizontal-positivo.svg';
import estilos from './Navbar.module.css';

function Navbar() {
    const { pathname } = useLocation();
    const { esGrande, alternarTamano } = useTamanoTexto();
    const { esClaro, alternarTema } = useTema();

    const sesionActiva = haySesion();
    const estaEnPortada = pathname === '/';
    const estaEnLogin = pathname === '/login';
    const logoActual = esClaro ? logoPositivo : logoNegativo;

    return (
        <header className={estilos.barra}>
            <Link
                to={sesionActiva ? '/inicio' : '/'}
                className={estilos.enlaceLogo}
                aria-label={sesionActiva ? 'Cafeto Las Lomitas, ir al panel de inicio' : 'Cafeto Las Lomitas, ir a la portada'}
            >
                <img src={logoActual} alt="Cafeto Las Lomitas" className={estilos.logo} />
            </Link>

            <nav className={estilos.menuPublico} aria-label="Navegación pública">
                <NavLink to="/" end className={estilos.enlace}>
                    Portada
                </NavLink>

                <Tooltip
                    texto={esGrande ? 'Volver al tamaño de texto normal' : 'Agrandar el tamaño de las letras'}
                    posicion="abajo"
                >
                    <button
                        type="button"
                        className={`${estilos.botonControl} ${esGrande ? estilos.botonControlActivo : ''}`}
                        onClick={alternarTamano}
                        aria-pressed={esGrande}
                        aria-label={esGrande ? 'Texto grande activado, volver a normal' : 'Agrandar tamaño de texto'}
                    >
                        <span className={estilos.siglaTamano} aria-hidden="true">
                            {esGrande ? 'A-' : 'A+'}
                        </span>
                        <span className={estilos.etiquetaControl}>
                            {esGrande ? 'Normal' : 'Agrandar'}
                        </span>
                    </button>
                </Tooltip>

                <Tooltip
                    texto={esClaro ? 'Cambiar a tema oscuro (Morado Noche)' : 'Cambiar a tema claro (Crema)'}
                    posicion="abajo"
                >
                    <button
                        type="button"
                        className={estilos.botonControl}
                        onClick={alternarTema}
                        aria-pressed={esClaro}
                        aria-label={esClaro ? 'Tema claro activo, cambiar a tema oscuro' : 'Tema oscuro activo, cambiar a tema claro'}
                    >
                        {esClaro ? <IconoLuna size={17} /> : <IconoSol size={17} />}
                        <span className={estilos.etiquetaControl}>
                            {esClaro ? 'Oscuro' : 'Claro'}
                        </span>
                    </button>
                </Tooltip>

                {!estaEnLogin && (
                    <Link
                        to={sesionActiva ? '/inicio' : '/login'}
                        className={estaEnPortada ? estilos.enlaceLoginContorno : estilos.enlaceLogin}
                    >
                        {sesionActiva ? 'Ir a mi panel' : 'Ingresar al turno'}
                    </Link>
                )}
            </nav>
        </header>
    );
}

export default Navbar;
