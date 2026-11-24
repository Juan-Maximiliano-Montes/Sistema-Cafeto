import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';
import Main from './components/Main/Main';
import Footer from './components/Footer/Footer';
import RutaProtegida from './components/RutaProtegida/RutaProtegida';

import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import Productos from './pages/Productos/Productos';
import DetalleProducto from './pages/DetalleProducto/DetalleProducto';
import Cajas from './pages/Cajas/Cajas';
import Usuarios from './pages/Usuarios/Usuarios';
import NoEncontrada from './pages/NoEncontrada/NoEncontrada';

import { EVENTO_SESION_VENCIDA } from './api/api';
import estilos from './App.module.css';

function VigilanteSesion() {
    const navigate = useNavigate();

    useEffect(() => {
        const alVencer = () => {
            navigate('/login', {
                replace: true,
                state: { aviso: 'Tu sesión venció o se abrió en otro dispositivo. Volvé a ingresar.' },
            });
        };
        window.addEventListener(EVENTO_SESION_VENCIDA, alVencer);
        return () => window.removeEventListener(EVENTO_SESION_VENCIDA, alVencer);
    }, [navigate]);

    return null;
}

function App() {
    return (
        <BrowserRouter>
            <VigilanteSesion />
            <a href="#contenido-principal" className={estilos.skipLink}>
                Saltar al contenido principal
            </a>
            <Navbar />
            <main id="contenido-principal" tabIndex={-1} className={estilos.contenido}>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />

                    <Route element={<RutaProtegida />}>
                        <Route path="/inicio" element={<Main />} />
                        <Route path="/productos" element={<Productos />} />
                        <Route path="/productos/:id" element={<DetalleProducto />} />
                        <Route path="/cajas" element={<Cajas />} />
                        <Route path="/usuarios" element={<Usuarios />} />
                    </Route>

                    <Route path="*" element={<NoEncontrada />} />
                </Routes>
            </main>
            <Footer />
        </BrowserRouter>
    );
}

export default App;
