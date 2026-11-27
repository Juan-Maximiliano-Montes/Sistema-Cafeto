import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import BarraEstado from './components/BarraEstado/BarraEstado';
import BuscadorRapido from './components/BuscadorRapido/BuscadorRapido';
import CentroAyuda from './components/CentroAyuda/CentroAyuda';
import GuiaInteractiva from './components/GuiaInteractiva/GuiaInteractiva';
import Main from './components/Main/Main';
import Footer from './components/Footer/Footer';
import RutaProtegida from './components/RutaProtegida/RutaProtegida';
import Cargando from './components/Cargando/Cargando';
import LimiteError from './components/LimiteError/LimiteError';

import Login from './pages/Login/Login';

const Landing = lazy(() => import('./pages/Landing/Landing'));
const Productos = lazy(() => import('./pages/Productos/Productos'));
const DetalleProducto = lazy(() => import('./pages/DetalleProducto/DetalleProducto'));
const StockOperativo = lazy(() => import('./pages/StockOperativo/StockOperativo'));
const CatalogoAbm = lazy(() => import('./pages/CatalogoAbm/CatalogoAbm'));
const Cajas = lazy(() => import('./pages/Cajas/Cajas'));
const Reportes = lazy(() => import('./pages/Reportes/Reportes'));
const Usuarios = lazy(() => import('./pages/Usuarios/Usuarios'));
const NoEncontrada = lazy(() => import('./pages/NoEncontrada/NoEncontrada'));

import {
    EVENTO_SESION_VENCIDA,
    guardarRutaPostLogin,
    haySesion,
    limpiarSesion,
    normalizarRutaPostLogin,
} from './api/api';
import { NotificacionProvider } from './context/NotificacionContext';
import { useAtajos } from './hooks/useAtajos';
import { useTema } from './hooks/useTema';
import { useTamanoTexto } from './hooks/useTamanoTexto';
import estilos from './App.module.css';

const CLAVE_SIDEBAR = 'cafeto_sidebar_colapsado';

const TITULOS_POR_RUTA = {
    '/': 'Portada · Cafeto',
    '/login': 'Ingreso · Cafeto',
    '/inicio': 'Inicio · Cafeto',
    '/productos': 'Productos · Cafeto',
    '/stock': 'Stock · Cafeto',
    '/catalogo': 'Marcas y rubros · Cafeto',
    '/cajas': 'Cajas · Cafeto',
    '/reportes': 'Reportes · Cafeto',
    '/perfil': 'Mi perfil · Cafeto',
    '/usuarios': 'Mi perfil · Cafeto',
};

const obtenerTituloRuta = (pathname) => {
    const ruta = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
    if (TITULOS_POR_RUTA[ruta]) return TITULOS_POR_RUTA[ruta];
    if (ruta.startsWith('/productos/')) return 'Productos · Cafeto';
    return 'Cafeto · Sistema de gestión';
};

const leerSidebarGuardado = () => {
    try {
        return localStorage.getItem(CLAVE_SIDEBAR) === 'true';
    } catch {
        return false;
    }
};

function VigilanteSesion() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const alVencer = (evento) => {
            if (location.pathname === '/login') return;

            const rutaOrigen =
                evento?.detail?.desde ||
                `${location.pathname}${location.search || ''}${location.hash || ''}`;
            const destinoSeguro = normalizarRutaPostLogin(rutaOrigen) || '/inicio';

            guardarRutaPostLogin(destinoSeguro);
            limpiarSesion();
            navigate('/login', {
                replace: true,
                state: {
                    aviso: 'Tu turno expiró. Ingresá de nuevo para continuar donde estabas',
                    desde: destinoSeguro,
                    sesionExpirada: true,
                },
            });
        };
        window.addEventListener(EVENTO_SESION_VENCIDA, alVencer);
        return () => window.removeEventListener(EVENTO_SESION_VENCIDA, alVencer);
    }, [navigate, location.pathname, location.search, location.hash]);

    return null;
}

function EstructuraApp() {
    useTema();
    useTamanoTexto();

    const { pathname } = useLocation();
    const sesionActiva = haySesion();
    const esRutaPublica = pathname === '/' || pathname === '/login';
    const usaLayoutPrivado = sesionActiva && !esRutaPublica;
    const esPantallaCompleta = pathname === '/login';

    const [sidebarColapsado, setSidebarColapsado] = useState(leerSidebarGuardado);
    const [buscadorAbierto, setBuscadorAbierto] = useState(false);
    const [ayudaAbierta, setAyudaAbierta] = useState(false);
    const [guiaActiva, setGuiaActiva] = useState(false);
    const lienzoRef = useRef(null);

    const alternarSidebar = () => {
        setSidebarColapsado((prev) => {
            const nuevo = !prev;
            try {
                localStorage.setItem(CLAVE_SIDEBAR, String(nuevo));
            } catch {
                // Si el navegador bloquea localStorage, sigue funcionando en memoria.
            }
            return nuevo;
        });
    };

    const abrirAyuda = () => {
        setBuscadorAbierto(false);
        setAyudaAbierta(true);
    };

    useAtajos(
        {
            'ctrl+k': () => {
                setAyudaAbierta(false);
                setBuscadorAbierto((abierto) => !abierto);
            },
            f1: () => {
                setBuscadorAbierto(false);
                setAyudaAbierta((abierta) => !abierta);
            },
        },
        { activo: usaLayoutPrivado }
    );

    useEffect(() => {
        if (lienzoRef.current) {
            lienzoRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pathname]);

    useEffect(() => {
        document.title = obtenerTituloRuta(pathname);
    }, [pathname]);

    const contenidoRutas = (
        <LimiteError key={pathname}>
            <Suspense fallback={<Cargando texto="Cargando pantalla..." />}>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />

                    <Route element={<RutaProtegida />}>
                        <Route path="/inicio" element={<Main />} />
                        <Route path="/productos" element={<Productos />} />
                        <Route path="/productos/:id" element={<DetalleProducto />} />
                        <Route path="/stock" element={<StockOperativo />} />
                        <Route path="/catalogo" element={<CatalogoAbm />} />
                        <Route path="/cajas" element={<Cajas />} />
                        <Route path="/reportes" element={<Reportes />} />
                        <Route path="/usuarios" element={<Usuarios />} />
                        <Route path="/perfil" element={<Usuarios />} />
                    </Route>

                    <Route path="*" element={<NoEncontrada />} />
                </Routes>
            </Suspense>
        </LimiteError>
    );

    return (
        <>
            <VigilanteSesion />
            <a href="#contenido-principal" className={estilos.skipLink}>
                Saltar al contenido principal
            </a>

            {usaLayoutPrivado ? (
                <div className={estilos.shellApp} data-iris-shell="true">
                    <Sidebar
                        colapsado={sidebarColapsado}
                        onAlternarColapso={alternarSidebar}
                        onAbrirAyuda={abrirAyuda}
                    />
                    <div ref={lienzoRef} className={estilos.columnaPrincipal} data-iris-lienzo="true" data-iris-tour="lienzo">
                        <BarraEstado onAbrirBuscador={() => setBuscadorAbierto(true)} />
                        <main id="contenido-principal" tabIndex={-1} className={estilos.contenidoApp}>
                            {contenidoRutas}
                        </main>
                    </div>
                    <BuscadorRapido
                        abierto={buscadorAbierto}
                        onCerrar={() => setBuscadorAbierto(false)}
                        onAbrirAyuda={abrirAyuda}
                    />
                    <CentroAyuda
                        abierto={ayudaAbierta}
                        onCerrar={() => setAyudaAbierta(false)}
                        onIniciarGuia={() => setGuiaActiva(true)}
                    />
                    <GuiaInteractiva
                        activo={guiaActiva}
                        onCerrar={() => setGuiaActiva(false)}
                    />
                </div>
            ) : esPantallaCompleta ? (
                <main
                    id="contenido-principal"
                    tabIndex={-1}
                    className={estilos.contenidoCompleto}
                >
                    {contenidoRutas}
                </main>
            ) : (
                <div className={estilos.shellPublico} data-iris-shell="true">
                    <Navbar />
                    <div ref={lienzoRef} className={estilos.lienzoPublico} data-iris-lienzo="true">
                        <div className={estilos.superficiePublica}>
                            <main
                                id="contenido-principal"
                                tabIndex={-1}
                                className={estilos.contenido}
                            >
                                {contenidoRutas}
                            </main>
                        </div>
                        <Footer />
                    </div>
                </div>
            )}
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <NotificacionProvider>
                <EstructuraApp />
            </NotificacionProvider>
        </BrowserRouter>
    );
}

export default App;
