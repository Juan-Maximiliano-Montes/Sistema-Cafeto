import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { haySesion } from '../../api/api';

function RutaProtegida() {
    const location = useLocation();

    if (!haySesion()) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ aviso: 'Primero tenés que iniciar sesión.', desde: location.pathname }}
            />
        );
    }

    return <Outlet />;
}

export default RutaProtegida;
