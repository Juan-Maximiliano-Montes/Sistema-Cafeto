import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { logOutUsuario } from '../../api/api';
import { useTamanoTexto } from '../../hooks/useTamanoTexto';
import { useTema } from '../../hooks/useTema';
import Confirmacion from '../Confirmacion/Confirmacion';
import Tooltip from '../Tooltip/Tooltip';
import {
    IconoCaja,
    IconoCerrar,
    IconoColapsar,
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
import isotipoBlanco from '../../assets/cafeto-isotipo-blanco.svg';
import isotipoNegro from '../../assets/cafeto-isotipo-negro.svg';
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

function Sidebar({ colapsado, onAlternarColapso }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { esClaro, alternarTema } = useTema();
    const { esGrande, alternarTamano } = useTamanoTexto();

    const [enLinea, setEnLinea] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
    const [masMovilAbierto, setMasMovilAbierto] = useState(false);
    const [confirmandoSalida, setConfirmandoSalida] = useState(false);
    const [saliendo, setSaliendo] = useState(false);

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
        if (!masMovilAbierto) return undefined;
        const alPresionarTecla = (evento) => {
            if (evento.key === 'Escape') {
                setMasMovilAbierto(false);
            }
        };
        window.addEventListener('keydown', alPresionarTecla);
        return () => window.removeEventListener('keydown', alPresionarTecla);
    }, [masMovilAbierto]);

    const logoExpandido = esClaro ? logoPositivo : logoNegativo;
    const isotipoColapsado = esClaro ? isotipoNegro : isotipoBlanco;

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
        navigate('/login', {
            replace: true,
            state: {
                aviso: 'Cerraste la sesión. ¡Hasta la próxima!',
                tipoAviso: 'ok',
            },
        });
    };

    const enlacesMovilPrincipales = ENLACES_PRINCIPALES.filter((e) => ENLACES_BARRA_MOVIL.includes(e.to));
    const enlacesMovilExtra = ENLACES_PRINCIPALES.filter((e) => !ENLACES_BARRA_MOVIL.includes(e.to));
    const hayExtraActivo = enlacesMovilExtra.some(
        (e) => pathname === e.to || (e.to === '/perfil' && pathname === '/usuarios')
    );

    return (
        <>
            <aside
                className={`${estilos.sidebar} ${colapsado ? estilos.colapsado : ''}`}
                aria-label="Menú lateral de navegación"
            >
                <div className={estilos.cabecera}>
                    <Link
                        to="/inicio"
                        className={estilos.enlaceLogo}
                        aria-label="Cafeto Las Lomitas, ir al inicio"
                    >
                        <img
                            src={colapsado ? isotipoColapsado : logoExpandido}
                            alt="Cafeto Las Lomitas"
                            className={colapsado ? estilos.isotipo : estilos.logo}
                        />
                    </Link>

                    <Tooltip texto={colapsado ? 'Expandir menú' : 'Colapsar menú'} posicion="derecha">
                        <button
                            type="button"
                            className={estilos.botonColapsar}
                            onClick={onAlternarColapso}
                            aria-expanded={!colapsado}
                            aria-label={colapsado ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
                        >
                            {colapsado ? <IconoExpandir size={18} /> : <IconoColapsar size={18} />}
                        </button>
                    </Tooltip>
                </div>

                <nav className={estilos.navegacion} aria-label="Módulos del sistema">
                    {ENLACES_PRINCIPALES.map((enlace) => {
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
                                        <Icono size={20} />
                                    </span>
                                    {!colapsado && <span className={estilos.textoEnlace}>{enlace.texto}</span>}
                                </NavLink>
                            </Tooltip>
                        );
                    })}
                </nav>

                <div className={estilos.pie}>
                    <div className={estilos.controles}>
                        <Tooltip
                            texto={esGrande ? 'Volver al texto normal (A-)' : 'Agrandar texto (A+)'}
                            posicion="derecha"
                        >
                            <button
                                type="button"
                                className={`${estilos.botonControl} ${esGrande ? estilos.botonControlActivo : ''}`}
                                onClick={alternarTamano}
                                aria-pressed={esGrande}
                                aria-label={esGrande ? 'Volver al tamaño de texto normal' : 'Agrandar tamaño de texto'}
                            >
                                <span className={estilos.siglaTamano} aria-hidden="true">
                                    {esGrande ? 'A-' : 'A+'}
                                </span>
                                {!colapsado && <span>{esGrande ? 'Normal' : 'Agrandar'}</span>}
                            </button>
                        </Tooltip>

                        <Tooltip
                            texto={esClaro ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
                            posicion="derecha"
                        >
                            <button
                                type="button"
                                className={estilos.botonControl}
                                onClick={alternarTema}
                                aria-pressed={esClaro}
                                aria-label={esClaro ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
                            >
                                {esClaro ? <IconoLuna size={18} /> : <IconoSol size={18} />}
                                {!colapsado && <span>{esClaro ? 'Oscuro' : 'Claro'}</span>}
                            </button>
                        </Tooltip>
                    </div>

                    <Tooltip
                        texto={colapsado ? (enLinea ? 'Conectado' : 'Sin conexión') : ''}
                        posicion="derecha"
                    >
                        <div
                            className={`${estilos.estadoConexion} ${enLinea ? estilos.enLinea : estilos.sinConexion}`}
                            role="status"
                            aria-label={colapsado ? (enLinea ? 'Conectado' : 'Sin conexión') : undefined}
                        >
                            <span className={estilos.puntoEstado} aria-hidden="true" />
                            {!colapsado && <span>{enLinea ? 'Conectado' : 'Sin conexión'}</span>}
                        </div>
                    </Tooltip>

                    <Tooltip texto={colapsado ? 'Cerrar sesión' : ''} posicion="derecha">
                        <button
                            type="button"
                            className={estilos.botonSalir}
                            onClick={() => setConfirmandoSalida(true)}
                            aria-label="Cerrar sesión"
                        >
                            <IconoSalir size={18} />
                            {!colapsado && <span>Cerrar sesión</span>}
                        </button>
                    </Tooltip>
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
                                            `${estilos.enlace} ${esRutaActiva(enlace.to, isActive) ? estilos.enlaceActivo : ''}`
                                        }
                                    >
                                        <span className={estilos.iconoEnlace}>
                                            <Icono size={20} />
                                        </span>
                                        <span>{enlace.texto}</span>
                                    </NavLink>
                                );
                            })}
                        </div>

                        <div className={estilos.controlesCajon}>
                            <button
                                type="button"
                                className={`${estilos.botonControl} ${esGrande ? estilos.botonControlActivo : ''}`}
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
                                className={estilos.botonControl}
                                onClick={alternarTema}
                                aria-pressed={esClaro}
                            >
                                {esClaro ? <IconoLuna size={18} /> : <IconoSol size={18} />}
                                <span>{esClaro ? 'Oscuro' : 'Claro'}</span>
                            </button>
                        </div>

                        <div className={estilos.pieCajon}>
                            <div
                                className={`${estilos.estadoConexion} ${enLinea ? estilos.enLinea : estilos.sinConexion}`}
                                role="status"
                            >
                                <span className={estilos.puntoEstado} aria-hidden="true" />
                                <span>{enLinea ? 'Conectado' : 'Sin conexión'}</span>
                            </div>

                            <button
                                type="button"
                                className={estilos.botonSalir}
                                onClick={() => {
                                    setMasMovilAbierto(false);
                                    setConfirmandoSalida(true);
                                }}
                            >
                                <IconoSalir size={18} />
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
