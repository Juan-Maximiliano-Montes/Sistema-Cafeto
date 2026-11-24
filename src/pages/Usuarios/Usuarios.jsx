import { useEffect, useState } from 'react';
import { getUsuarioActual, mensajeDeError, URL_WEB_DJANGO, verificarSesion } from '../../api/api';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina';
import AvisoError from '../../components/AvisoError/AvisoError';
import { BarraCarga } from '../../components/BarraCarga/BarraCarga';
import Tooltip from '../../components/Tooltip/Tooltip';
import {
    IconoEstadoError,
    IconoEstadoInfo,
    IconoEstadoOk,
    IconoExterno,
} from '../../components/Iconos/Iconos';
import estilos from './Usuarios.module.css';

const NOMBRES_PERMISOS = {
    ver_productos: 'Ver productos',
    ver_stock: 'Ver stock',
    contar_stock: 'Contar stock',
    registrar_merma: 'Registrar mermas',
    registrar_traspaso: 'Registrar traspasos',
    registrar_produccion: 'Registrar producción',
    autorizar_ajustes: 'Autorizar ajustes',
    imprimir_ofertas: 'Imprimir ofertas',
    registrar_compra: 'Recibir compras',
    ver_ventas: 'Ver ventas',
    ver_caja: 'Ver caja',
    gestionar_ordenes: 'Gestionar órdenes',
    ver_egresos: 'Ver egresos',
    ver_auditoria: 'Ver auditoría',
    ver_reportes: 'Ver reportes',
    ver_marcas: 'Ver marcas',
    crear_marca: 'Crear marcas',
    editar_marca: 'Editar marcas',
    eliminar_marca: 'Eliminar marcas',
    ver_rubros: 'Ver rubros',
    crear_rubro: 'Crear rubros',
    editar_rubro: 'Editar rubros',
    eliminar_rubro: 'Eliminar rubros',
};

const nombrePermiso = (codigo) =>
    NOMBRES_PERMISOS[codigo] || codigo.replaceAll('_', ' ').replace(/^\w/, (letra) => letra.toUpperCase());

const tipoDeCuenta = (usuario) => {
    if (usuario.es_titular) return 'Titular del negocio';
    if (usuario.es_administrador) return 'Administración';
    return 'Personal operativo';
};

function Usuarios() {
    const usuario = getUsuarioActual();
    const [verificando, setVerificando] = useState(true);
    const [error, setError] = useState(null);

    const [intento, setIntento] = useState(0);

    useEffect(() => {
        let vigente = true;

        async function comprobarSesion() {
            try {
                setVerificando(true);
                setError(null);
                await verificarSesion();
            } catch (err) {
                if (vigente) setError(mensajeDeError(err, 'No se pudo verificar tu sesión con Django.'));
            } finally {
                if (vigente) setVerificando(false);
            }
        }

        comprobarSesion();
        return () => {
            vigente = false;
        };
    }, [intento]);

    if (!usuario) {
        return (
            <AvisoError
                titulo="No hay datos de la sesión"
                mensaje="No encontramos tus datos en este navegador. Cerrá la sesión y volvé a ingresar."
            />
        );
    }

    const permisos = Array.isArray(usuario.permisos) ? usuario.permisos : [];

    let estadoSesion = {
        texto: 'Verificada con Django',
        clase: estilos.activo,
        icono: <IconoEstadoOk size={13} />,
        ayuda: 'Tu sesión actual está confirmada por el servidor Django.',
    };
    if (verificando) {
        estadoSesion = {
            texto: 'Verificando...',
            clase: estilos.neutro,
            icono: <IconoEstadoInfo size={13} />,
            ayuda: 'Consultando con Django el estado de tu sesión.',
        };
    } else if (error) {
        estadoSesion = {
            texto: 'Sin verificar',
            clase: estilos.inactivo,
            icono: <IconoEstadoError size={13} />,
            ayuda: 'No pudimos confirmar tu sesión en este momento.',
        };
    }

    return (
        <section>
            <BarraCarga activa={verificando} etiqueta="Verificando sesión con Django" />

            <EncabezadoPagina
                volverA="/inicio"
                textoVolver="Volver al inicio"
                etiqueta="Personal de salón"
                titulo="Usuarios"
                subtitulo="Tu perfil dentro del Sistema Cafeto y lo que tenés habilitado desde esta app."
            />

            {error && (
                <div className={estilos.separado}>
                    <AvisoError
                        titulo="No pudimos confirmar tu sesión"
                        mensaje={error}
                        onReintentar={() => setIntento((n) => n + 1)}
                        reintentando={verificando}
                    />
                </div>
            )}

            <div className={estilos.tablaContenedor}>
                <table className={estilos.tabla}>
                    <thead>
                        <tr>
                            <th scope="col">Nombre y apellido</th>
                            <th scope="col">Perfil asignado</th>
                            <th scope="col">Tipo de cuenta</th>
                            <th scope="col">Estado</th>
                            <th scope="col">Sesión</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className={estilos.nombreUsuario}>
                                <span className={estilos.avatar} aria-hidden="true">
                                    {`${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase()}
                                </span>
                                {usuario.nombre} {usuario.apellido}
                            </td>
                            <td>
                                <span className={estilos.badgePerfil}>{usuario.perfil || 'Personal operativo'}</span>
                            </td>
                            <td>{tipoDeCuenta(usuario)}</td>
                            <td>
                                <Tooltip esEtiqueta texto="Tu usuario está habilitado para ingresar y operar.">
                                    <span className={`${estilos.badge} ${estilos.activo}`}>
                                        <IconoEstadoOk size={13} />
                                        <span>Activo</span>
                                    </span>
                                </Tooltip>
                            </td>
                            <td>
                                <Tooltip esEtiqueta texto={estadoSesion.ayuda}>
                                    <span className={`${estilos.badge} ${estadoSesion.clase}`}>
                                        {estadoSesion.icono}
                                        <span>{estadoSesion.texto}</span>
                                    </span>
                                </Tooltip>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className={estilos.paneles}>
                <article className={estilos.panel}>
                    <h2 className={estilos.tituloPanel}>Lo que podés hacer desde la app</h2>
                    {permisos.length > 0 ? (
                        <ul className={estilos.listaPermisos}>
                            {permisos.map((codigo) => (
                                <li key={codigo} className={estilos.permiso}>{nombrePermiso(codigo)}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className={estilos.texto}>Tu perfil todavía no tiene tareas habilitadas para la app.</p>
                    )}
                </article>

                <article className={estilos.panel}>
                    <h2 className={estilos.tituloPanel}>Altas, bajas y contraseñas</h2>
                    <p className={estilos.texto}>
                        Crear usuarios, darlos de baja o restablecer una contraseña se hace desde la web del sistema,
                        en Seguridad › Usuarios, porque queda asentado en el registro de actividad.
                    </p>
                    {usuario.es_administrador && (
                        <a href={`${URL_WEB_DJANGO}/usuarios/`} target="_blank" rel="noreferrer" className={estilos.enlace}>
                            <span>Ir a la gestión de usuarios</span>
                            <IconoExterno size={16} />
                        </a>
                    )}
                </article>
            </div>
        </section>
    );
}

export default Usuarios;
