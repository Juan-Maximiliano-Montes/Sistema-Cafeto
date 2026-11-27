import { tienePermiso } from '../api/api';

export const esAdminOTitular = (usuario) =>
    Boolean(usuario?.es_titular || usuario?.es_administrador);

/**
 * Fuente única de verdad para visibilidad de módulos según el perfil efectivo.
 * Si el usuario no tiene permiso para un área, no se dibuja el acceso en el
 * Rail, Inicio, Notch ni en la paleta Ctrl+K (fiel a seguridad/menu.py de Django).
 */
export const puedeVerModulo = (usuario, ruta) => {
    if (!usuario) return false;
    if (esAdminOTitular(usuario)) return true;

    switch (ruta) {
        case '/inicio':
        case '/productos':
        case '/perfil':
        case '/usuarios':
            return true;
        case '/stock':
            return tienePermiso(usuario, 'ver_stock') || tienePermiso(usuario, 'autorizar_ajustes');
        case '/catalogo':
            return tienePermiso(usuario, 'ver_marcas') || tienePermiso(usuario, 'ver_rubros');
        case '/cajas':
            return tienePermiso(usuario, 'ver_caja') || tienePermiso(usuario, 'ver_ventas');
        case '/reportes':
            return tienePermiso(usuario, 'ver_reportes');
        default:
            return true;
    }
};
