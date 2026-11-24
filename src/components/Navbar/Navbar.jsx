import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getUsuarioActual, haySesion, logOutUsuario, URL_WEB_DJANGO } from '../../api/api';
import { useTamanoTexto } from '../../hooks/useTamanoTexto';
import Confirmacion from '../Confirmacion/Confirmacion';
import MenuDesplegable from '../MenuDesplegable/MenuDesplegable';
import Tooltip from '../Tooltip/Tooltip';
import { IconoEstadoError, IconoExterno, IconoUsuarios } from '../Iconos/Iconos';
import logoHorizontal from '../../assets/cafeto-horizontal-negativo.svg';
import estilos from './Navbar.module.css';

const ENLACES = [
    { to: '/inicio', texto: 'Inicio' },
    { to: '/productos', texto: 'Productos' },
    { to: '/cajas', texto: 'Cajas' },
    { to: '/usuarios', texto: 'Usuarios' },
];

const inicialesDe = (usuario) => {
    const primero = usuario?.nombre?.[0] || '';
    const segundo = usuario?.apellido?.[0] || '';
    return `${primero}${segundo}`.toUpperCase() || 'CF';
};

function Navbar() {
    const navigate = useNavigate();
    useLocation();

    const [menuAbierto, setMenuAbierto] = useState(false);
    const [confirmando, setConfirmando] = useState(false);
    const [saliendo, setSaliendo] = useState(false);
    const { esGrande, alternarTamano } = useTamanoTexto();

    const sesionActiva = haySesion();
    const usuario = getUsuarioActual();

    const pedirConfirmacion = () => {
        setMenuAbierto(false);
        setConfirmando(true);
    };

    const handleCerrarSesion = async () => {
        setSaliendo(true);
        await logOutUsuario();
        setSaliendo(false);
        setConfirmando(false);
        navigate('/login', { replace: true, state: { aviso: 'Cerraste la sesión. ¡Hasta la próxima!' } });
    };

    const botonTamanoTexto = (
        <Tooltip
            texto={esGrande ? 'Volver al tamaño de texto normal' : 'Agrandar el tamaño de las letras para leer más cómodo'}
            posicion="abajo"
        >
            <button
                type="button"
                className={`${estilos.botonTexto} ${esGrande ? estilos.botonTextoActivo : ''}`}
                onClick={alternarTamano}
                aria-pressed={esGrande}
                aria-label={esGrande ? 'Texto grande activado, volver a normal' : 'Agrandar tamaño de texto'}
            >
                <span aria-hidden="true">{esGrande ? 'A+' : 'A'}</span>
                <span className={estilos.etiquetaTamano}>{esGrande ? 'Grande' : 'Texto'}</span>
            </button>
        </Tooltip>
    );

    const opcionesCuenta = [
        {
            id: 'perfil',
            etiqueta: 'Mi perfil y permisos',
            descripcion: 'Ver lo que tenés habilitado',
            icono: <IconoUsuarios size={18} />,
            onClick: () => {
                setMenuAbierto(false);
                navigate('/usuarios');
            },
        },
        {
            id: 'django',
            etiqueta: 'Abrir sistema web (Django)',
            descripcion: 'Gestión completa en otra pestaña',
            icono: <IconoExterno size={18} />,
            href: URL_WEB_DJANGO,
            externo: true,
        },
        {
            id: 'salir',
            etiqueta: 'Cerrar sesión',
            descripcion: 'Salir de tu cuenta en este equipo',
            icono: <IconoEstadoError size={17} />,
            peligro: true,
            separadorAntes: true,
            onClick: pedirConfirmacion,
        },
    ];

    const nombreCompleto = usuario
        ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Mi cuenta'
        : 'Mi cuenta';
    const rolUsuario = usuario?.perfil || 'Personal operativo';

    return (
        <header className={estilos.barra}>
            <Link
                to={sesionActiva ? '/inicio' : '/'}
                className={estilos.enlaceLogo}
                aria-label={sesionActiva ? 'Cafeto Las Lomitas, ir al panel de inicio' : 'Cafeto Las Lomitas, ir a la portada'}
            >
                <img src={logoHorizontal} alt="Cafeto Las Lomitas" className={estilos.logo} />
            </Link>

            {sesionActiva ? (
                <>
                    <div className={estilos.controlesMovil}>
                        {botonTamanoTexto}
                        <button
                            type="button"
                            className={estilos.botonMenu}
                            aria-expanded={menuAbierto}
                            aria-controls="menu-principal"
                            onClick={() => setMenuAbierto((abierto) => !abierto)}
                        >
                            <span className={estilos.lineas} aria-hidden="true" />
                            <span className={estilos.oculto}>{menuAbierto ? 'Cerrar menú' : 'Abrir menú'}</span>
                        </button>
                    </div>

                    <nav
                        id="menu-principal"
                        className={`${estilos.menu} ${menuAbierto ? estilos.menuAbierto : ''}`}
                        aria-label="Módulos del sistema"
                    >
                        {ENLACES.map(({ to, texto }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={estilos.enlace}
                                onClick={() => setMenuAbierto(false)}
                            >
                                {texto}
                            </NavLink>
                        ))}

                        <div className={estilos.controlTextoEscritorio}>{botonTamanoTexto}</div>

                        <Tooltip texto="Abrir opciones de tu cuenta, ir al sistema web o cerrar sesión" posicion="abajo">
                            <div className={estilos.menuCuenta}>
                                <MenuDesplegable
                                    etiquetaAria="Opciones de cuenta del usuario"
                                    alineacion="derecha"
                                    claseBoton={estilos.disparadorCuenta}
                                    disparador={
                                        <>
                                            <span className={estilos.avatar} aria-hidden="true">
                                                {inicialesDe(usuario)}
                                            </span>
                                            <span className={estilos.infoCuenta}>
                                                <span className={estilos.nombreCuenta}>{usuario?.nombre || 'Mi cuenta'}</span>
                                                <span className={estilos.rolCuenta}>{rolUsuario}</span>
                                            </span>
                                        </>
                                    }
                                    encabezado={
                                        <div className={estilos.encabezadoCuenta}>
                                            <strong>{nombreCompleto}</strong>
                                            <span>{rolUsuario}</span>
                                        </div>
                                    }
                                    opciones={opcionesCuenta}
                                />
                            </div>
                        </Tooltip>
                    </nav>
                </>
            ) : (
                <nav className={estilos.menuPublico} aria-label="Navegación pública">
                    <NavLink to="/" end className={estilos.enlace}>
                        Portada
                    </NavLink>
                    {botonTamanoTexto}
                    <Link to="/login" className={estilos.enlaceLogin}>
                        Iniciar sesión
                    </Link>
                </nav>
            )}

            <Confirmacion
                abierta={confirmando}
                titulo="¿Cerrás la sesión?"
                mensaje="Vas a salir del Sistema Cafeto en este navegador. Para volver a entrar vas a necesitar tu usuario (o DNI) y tu contraseña."
                textoConfirmar={saliendo ? 'Cerrando...' : 'Sí, cerrar sesión'}
                textoCancelar="Seguir trabajando"
                onConfirmar={handleCerrarSesion}
                onCancelar={() => setConfirmando(false)}
                ocupado={saliendo}
                peligro
            />
        </header>
    );
}

export default Navbar;
