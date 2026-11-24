import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {
    esSesionVencida,
    haySesion,
    normalizarRutaPostLogin,
    tuvoSesionPrevia,
} from '../../api/api';

function RutaProtegida() {
    const location = useLocation();

    if (!haySesion() || esSesionVencida()) {
        const rutaActual = `${location.pathname}${location.search || ''}${location.hash || ''}`;
        const destinoSeguro = normalizarRutaPostLogin(rutaActual) || '/inicio';
        const aviso =
            esSesionVencida() || tuvoSesionPrevia()
                ? 'Tu turno expiró. Ingresá de nuevo para continuar donde estabas'
                : 'Primero tenés que iniciar sesión.';

        return (
            <Navigate
                to="/login"
                replace
                state={{
                    aviso,
                    desde: destinoSeguro,
                    sesionExpirada: esSesionVencida(),
                }}
            />
        );
    }

    return <Outlet />;
}

export default RutaProtegida;
