import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getUsuarioActual, logOutUsuario } from '../../api/api';
import { useNotificacion } from '../../hooks/useNotificacion';
import { useTamanoTexto } from '../../hooks/useTamanoTexto';
import { useTema } from '../../hooks/useTema';
import { puedeVerModulo } from '../../utils/permisos';
import { navegarConTransicion } from '../../utils/transicion';
import Confirmacion from '../Confirmacion/Confirmacion';
import Tooltip from '../Tooltip/Tooltip';
import {
    IconoCaja,
    IconoCampana,
    IconoCerrar,
    IconoChevron,
    IconoColapsar,
    IconoEstadoInfo,
    IconoEtiqueta,
    IconoExpandir,
    IconoInicio,
    IconoLuna,
    IconoMenuMas,
    IconoReportes,
    IconoSalir,
    IconoSol,
    IconoStock,
    IconoTaza,
    IconoUsuarios,
} from '../Iconos/Iconos';
import logoNegativo from '../../assets/cafeto-horizontal-negativo.svg';
import logoPositivo from '../../assets/cafeto-horizontal-positivo.svg';
import iconoAmbar from '../../assets/cafeto-icono-ambar.svg';
import estilos from './Sidebar.module.css';

const ENLACES_PRINCIPALES = [
    { to: '/inicio', texto: 'Inicio', corto: 'Inicio', icono: IconoInicio },
    { to: '/productos', texto: 'Productos', corto: 'Productos', icono: IconoTaza },
    { to: '/stock', texto: 'Stock', corto: 'Stock', icono: IconoStock },
    { to: '/catalogo', texto: 'Marcas y rubros', corto: 'Marcas', icono: IconoEtiqueta },
    { to: '/cajas', texto: 'Cajas', corto: 'Cajas', icono: IconoCaja },
    { to: '/reportes', texto: 'Reportes', corto: 'Reportes', icono: IconoReportes },
    { to: '/perfil', texto: 'Mi perfil', corto: 'Perfil', icono: IconoUsuarios },
];

const ENLACES_BARRA_MOVIL = ['/inicio', '/productos', '/stock', '/cajas'];

const inicialesDe = (usuario) => {
    const primero = usuario?.nombre?.[0] || '';
    const segundo = usuario?.apellido?.[0] || '';
    return `${primero}${segundo}`.toUpperCase() || 'CF';
};

function Sidebar({ colapsado, onAlternarColapso, onAbrirAyuda }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { esClaro, alternarTema } = useTema();
    const { esGrande, alternarTamano } = useTamanoTexto();
    const { sonidoActivo, alternarSonido } = useNotificacion();
    const usuario = getUsuarioActual();

    const [enLinea, setEnLinea] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
    const [masMovilAbierto, setMasMovilAbierto] = useState(false);
    const [perfilAbierto, setPerfilAbierto] = useState(false);
    const [confirmandoSalida, setConfirmandoSalida] = useState(false);
    const [saliendo, setSaliendo] = useState(false);

    const perfilRef = useRef(null);

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

    useEffect(() => {
        if (!masMovilAbierto && !perfilAbierto) return undefined;

        const alPresionarTecla = (evento) => {
            if (evento.key === 'Escape') {
                setMasMovilAbierto(false);
                setPerfilAbierto(false);
            }
        };

        const alClickAfuera = (evento) => {
            if (perfilAbierto && perfilRef.current && !perfilRef.current.contains(evento.target)) {
                setPerfilAbierto(false);
            }
        };

        window.addEventListener('keydown', alPresionarTecla);
        document.addEventListener('mousedown', alClickAfuera);
        return () => {
            window.removeEventListener('keydown', alPresionarTecla);
            document.removeEventListener('mousedown', alClickAfuera);
        };
    }, [masMovilAbierto, perfilAbierto]);

    const logoExpandido = esClaro ? logoPositivo : logoNegativo;

    const esRutaActiva = (to, isActive) => {
        if (to === '/perfil' && pathname === '/usuarios') return true;
        return isActive;
    };

    const handleCerrarSesion = async () => {
        setSaliendo(true);
        await logOutUsuario();
        setSaliendo(false);
        setConfirmandoSalida(false);
        setMasMovilAbierto(false);
        setPerfilAbierto(false);
        navegarConTransicion(navigate, '/login', {
            replace: true,
            state: {
                aviso: 'Cerraste la sesión. ¡Hasta la próxima!',
                tipoAviso: 'ok',
            },
        });
    };

    const nombreCorto = usuario?.nombre || 'Mi cuenta';
    const nombreCompleto = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ') || 'Usuario Cafeto';
    const rolUsuario = usuario?.perfil || usuario?.rol || 'Equipo Cafeto';

    const enlacesVisibles = ENLACES_PRINCIPALES.filter((e) => puedeVerModulo(usuario, e.to));
    const enlacesMovilPrincipales = enlacesVisibles.filter((e) => ENLACES_BARRA_MOVIL.includes(e.to));
    const enlacesMovilExtra = enlacesVisibles.filter((e) => !ENLACES_BARRA_MOVIL.includes(e.to));
    const hayExtraActivo = enlacesMovilExtra.some(
        (e) => pathname === e.to || (e.to === '/perfil' && pathname === '/usuarios')
    );

    return (
        <>
            <aside
                className={`${estilos.sidebar} ${colapsado ? estilos.colapsado : ''}`}
                data-iris-tour="rail"
                aria-label="Menú lateral de navegación"
            >
                <div className={estilos.cabecera}>
                    <Link
                        to="/inicio"
                        className={estilos.enlaceLogo}
                        aria-label="Cafeto Las Lomitas, ir al inicio"
                    >
                        <img
                            src={colapsado ? iconoAmbar : logoExpandido}
                            alt="Cafeto Las Lomitas"
                            className={colapsado ? estilos.isotipo : estilos.logo}
                        />
                    </Link>

                    <Tooltip texto={colapsado ? 'Expandir menú' : 'Contraer menú'} posicion="derecha">
                        <button
                            type="button"
                            className={estilos.botonColapsar}
                            onClick={onAlternarColapso}
                            aria-pressed={colapsado}
                            aria-label={colapsado ? 'Expandir menú lateral' : 'Contraer menú lateral'}
                        >
                            {colapsado ? <IconoExpandir size={17} /> : <IconoColapsar size={17} />}
                        </button>
                    </Tooltip>
                </div>

                <nav className={estilos.navegacion} aria-label="Áreas del sistema">
                    {enlacesVisibles.map((enlace) => {
                        const Icono = enlace.icono;
                        return (
                            <Tooltip
                                key={enlace.to}
                                texto={colapsado ? enlace.texto : ''}
                                posicion="derecha"
                            >
                                <NavLink
                                    to={enlace.to}
                                    className={({ isActive }) =>
                                        `${estilos.enlace} ${esRutaActiva(enlace.to, isActive) ? estilos.enlaceActivo : ''}`
                                    }
                                    aria-label={colapsado ? enlace.texto : undefined}
                                >
                                    <span className={estilos.iconoEnlace}>
                                        <Icono size={19} />
                                    </span>
                                    {!colapsado && <span className={estilos.textoEnlace}>{enlace.texto}</span>}
                                </NavLink>
                            </Tooltip>
                        );
                    })}
                </nav>

                <div className={estilos.pie} data-iris-tour="pie-rail">
                    <Tooltip
                        texto={colapsado ? (esGrande ? 'Texto normal (A-)' : 'Agrandar texto (A+)') : ''}
                        posicion="derecha"
                    >
                        <button
                            type="button"
                            className={`${estilos.filaPie} ${esGrande ? estilos.filaPieActiva : ''}`}
                            onClick={alternarTamano}
                            aria-pressed={esGrande}
                            aria-label={esGrande ? 'Volver al tamaño de texto normal' : 'Agrandar tamaño de texto'}
                        >
                            <span className={estilos.siglaTamano} aria-hidden="true">
                                {esGrande ? 'A-' : 'A+'}
                            </span>
                            {!colapsado && (
                                <span className={estilos.textoFila}>
                                    {esGrande ? 'Texto normal' : 'Agrandar texto'}
                                </span>
                            )}
                        </button>
                    </Tooltip>

                    <Tooltip
                        texto={colapsado ? (esClaro ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro') : ''}
                        posicion="derecha"
                    >
                        <button
                            type="button"
                            className={estilos.filaPie}
                            onClick={alternarTema}
                            aria-pressed={esClaro}
                            aria-label={esClaro ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
                        >
                            {esClaro ? <IconoLuna size={17} /> : <IconoSol size={17} />}
                            {!colapsado && (
                                <span className={estilos.textoFila}>{esClaro ? 'Oscuro' : 'Claro'}</span>
                            )}
                        </button>
                    </Tooltip>

                    <Tooltip texto={colapsado ? 'Ayuda y atajos (F1)' : ''} posicion="derecha">
                        <button
                            type="button"
                            className={estilos.filaPie}
                            onClick={onAbrirAyuda}
                            aria-label="Abrir centro de ayuda y atajos (F1)"
                        >
                            <IconoEstadoInfo size={17} />
                            {!colapsado && (
                                <>
                                    <span className={estilos.textoFila}>Ayuda</span>
                                    <kbd className={`iris-keycap iris-keycap-chassis ${estilos.kbdDerecha}`}>
                                        F1
                                    </kbd>
                                </>
                            )}
                        </button>
                    </Tooltip>

                    <div ref={perfilRef} className={estilos.perfilWrap}>
                        <Tooltip
                            texto={colapsado ? `${nombreCompleto} · ${rolUsuario}` : ''}
                            posicion="derecha"
                        >
                            <button
                                type="button"
                                className={`${estilos.botonPerfil} ${perfilAbierto ? estilos.botonPerfilAbierto : ''}`}
                                onClick={() => setPerfilAbierto((abierto) => !abierto)}
                                aria-expanded={perfilAbierto}
                                aria-haspopup="menu"
                                aria-label={`Cuenta de ${nombreCompleto}`}
                            >
                                <span className={estilos.avatar} aria-hidden="true">
                                    {inicialesDe(usuario)}
                                </span>
                                {!colapsado && (
                                    <>
                                        <span className={estilos.datosPerfil}>
                                            <span className={estilos.nombrePerfil}>{nombreCorto}</span>
                                            <span className={estilos.rolPerfil}>{rolUsuario}</span>
                                        </span>
                                        <span
                                            className={`${estilos.flechaPerfil} ${
                                                perfilAbierto ? estilos.flechaPerfilAbierta : ''
                                            }`}
                                            aria-hidden="true"
                                        >
                                            <IconoChevron size={15} />
                                        </span>
                                    </>
                                )}
                            </button>
                        </Tooltip>

                        {perfilAbierto && (
                            <div
                                className={estilos.menuPerfil}
                                role="menu"
                                aria-label="Opciones de cuenta"
                            >
                                <div className={estilos.cabeceraMenuPerfil}>
                                    <span className={estilos.menuNombre}>{nombreCompleto}</span>
                                    <span className={estilos.menuRol}>{rolUsuario}</span>
                                    <span
                                        className={`${estilos.estadoConexion} ${
                                            enLinea ? estilos.enLinea : estilos.sinConexion
                                        }`}
                                        role="status"
                                    >
                                        <span className={estilos.puntoEstado} aria-hidden="true" />
                                        <span>{enLinea ? 'Cafeto · En línea' : 'Sin conexión'}</span>
                                    </span>
                                </div>

                                <Link
                                    to="/perfil"
                                    role="menuitem"
                                    className={estilos.itemMenuPerfil}
                                    onClick={() => setPerfilAbierto(false)}
                                >
                                    <IconoUsuarios size={16} />
                                    <span>Mi perfil</span>
                                </Link>

                                <button
                                    type="button"
                                    role="menuitemcheckbox"
                                    aria-checked={sonidoActivo}
                                    className={estilos.itemMenuPerfil}
                                    onClick={alternarSonido}
                                >
                                    <IconoCampana size={16} />
                                    <span>Sonido avisos</span>
                                    <span className={estilos.estadoSonido}>
                                        {sonidoActivo ? 'Activado' : 'Silenciado'}
                                    </span>
                                </button>

                                <hr className={estilos.divisorMenu} />

                                <button
                                    type="button"
                                    role="menuitem"
                                    className={`${estilos.itemMenuPerfil} ${estilos.itemMenuPeligro}`}
                                    onClick={() => {
                                        setPerfilAbierto(false);
                                        setConfirmandoSalida(true);
                                    }}
                                >
                                    <IconoSalir size={16} />
                                    <span>Cerrar sesión</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            <nav className={estilos.barraMovil} aria-label="Navegación rápida móvil">
                {enlacesMovilPrincipales.map((enlace) => {
                    const Icono = enlace.icono;
                    return (
                        <NavLink
                            key={enlace.to}
                            to={enlace.to}
                            onClick={() => setMasMovilAbierto(false)}
                            className={({ isActive }) =>
                                `${estilos.itemMovil} ${isActive ? estilos.itemMovilActivo : ''}`
                            }
                        >
                            <Icono size={20} />
                            <span>{enlace.corto}</span>
                        </NavLink>
                    );
                })}

                <button
                    type="button"
                    className={`${estilos.itemMovil} ${masMovilAbierto || hayExtraActivo ? estilos.itemMovilActivo : ''}`}
                    onClick={() => setMasMovilAbierto((prev) => !prev)}
                    aria-expanded={masMovilAbierto}
                    aria-controls="menu-movil-extra"
                >
                    <IconoMenuMas size={20} />
                    <span>Más</span>
                </button>
            </nav>

            {masMovilAbierto && (
                <>
                    <div
                        className={estilos.telonMovil}
                        onClick={() => setMasMovilAbierto(false)}
                        aria-hidden="true"
                    />
                    <div
                        id="menu-movil-extra"
                        className={estilos.cajonMovil}
                        role="dialog"
                        aria-label="Más opciones del menú"
                    >
                        <div className={estilos.cabeceraCajon}>
                            <span className={estilos.tituloCajon}>Más opciones</span>
                            <button
                                type="button"
                                className={estilos.cerrarCajon}
                                onClick={() => setMasMovilAbierto(false)}
                                aria-label="Cerrar menú adicional"
                            >
                                <IconoCerrar size={18} />
                            </button>
                        </div>

                        <div className={estilos.enlacesCajon}>
                            {enlacesMovilExtra.map((enlace) => {
                                const Icono = enlace.icono;
                                return (
                                    <NavLink
                                        key={enlace.to}
                                        to={enlace.to}
                                        onClick={() => setMasMovilAbierto(false)}
                                        className={({ isActive }) =>
                                            `${estilos.enlaceMovil} ${
                                                esRutaActiva(enlace.to, isActive) ? estilos.enlaceMovilActivo : ''
                                            }`
                                        }
                                    >
                                        <span className={estilos.iconoEnlace}>
                                            <Icono size={19} />
                                        </span>
                                        <span>{enlace.texto}</span>
                                    </NavLink>
                                );
                            })}
                        </div>

                        <div className={estilos.controlesCajon}>
                            <button
                                type="button"
                                className={`${estilos.botonControlMovil} ${esGrande ? estilos.filaPieActiva : ''}`}
                                onClick={alternarTamano}
                                aria-pressed={esGrande}
                            >
                                <span className={estilos.siglaTamano} aria-hidden="true">
                                    {esGrande ? 'A-' : 'A+'}
                                </span>
                                <span>{esGrande ? 'Normal' : 'Agrandar'}</span>
                            </button>
                            <button
                                type="button"
                                className={estilos.botonControlMovil}
                                onClick={alternarTema}
                                aria-pressed={esClaro}
                            >
                                {esClaro ? <IconoLuna size={17} /> : <IconoSol size={17} />}
                                <span>{esClaro ? 'Oscuro' : 'Claro'}</span>
                            </button>
                        </div>

                        <div className={estilos.pieCajon}>
                            <div
                                className={`${estilos.estadoConexion} ${
                                    enLinea ? estilos.enLinea : estilos.sinConexion
                                }`}
                                role="status"
                            >
                                <span className={estilos.puntoEstado} aria-hidden="true" />
                                <span>{enLinea ? 'Conectado' : 'Sin conexión'}</span>
                            </div>

                            <button
                                type="button"
                                className={estilos.botonSalirMovil}
                                onClick={() => {
                                    setMasMovilAbierto(false);
                                    setConfirmandoSalida(true);
                                }}
                            >
                                <IconoSalir size={17} />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            <Confirmacion
                abierta={confirmandoSalida}
                titulo="¿Cerrás la sesión?"
                mensaje="Vas a salir del Sistema Cafeto en este navegador. Para volver a entrar vas a necesitar tu usuario (o DNI) y tu contraseña."
                textoConfirmar={saliendo ? 'Cerrando...' : 'Sí, cerrar sesión'}
                textoCancelar="Seguir trabajando"
                onConfirmar={handleCerrarSesion}
                onCancelar={() => setConfirmandoSalida(false)}
                ocupado={saliendo}
                peligro
            />
        </>
    );
}

export default Sidebar;
