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

const CATALOGO_PERMISOS = {
    ver_productos: { etiqueta: 'Ver productos y código de barras', categoria: 'Stock', enApp: true },
    ver_stock: { etiqueta: 'Ver alertas de stock y vencimientos', categoria: 'Stock', enApp: true },
    autorizar_ajustes: { etiqueta: 'Autorizar ajustes de stock', categoria: 'Stock', enApp: true },
    contar_stock: { etiqueta: 'Contar stock', categoria: 'Stock', enApp: false },
    registrar_merma: { etiqueta: 'Registrar mermas', categoria: 'Stock', enApp: false },
    registrar_traspaso: { etiqueta: 'Registrar traspasos', categoria: 'Stock', enApp: false },
    registrar_produccion: { etiqueta: 'Registrar producción', categoria: 'Stock', enApp: false },

    ver_marcas: { etiqueta: 'Ver marcas', categoria: 'Catálogo', enApp: true },
    crear_marca: { etiqueta: 'Crear marcas', categoria: 'Catálogo', enApp: true },
    editar_marca: { etiqueta: 'Editar marcas', categoria: 'Catálogo', enApp: true },
    eliminar_marca: { etiqueta: 'Eliminar marcas', categoria: 'Catálogo', enApp: true },
    ver_rubros: { etiqueta: 'Ver rubros', categoria: 'Catálogo', enApp: true },
    crear_rubro: { etiqueta: 'Crear rubros', categoria: 'Catálogo', enApp: true },
    editar_rubro: { etiqueta: 'Editar rubros', categoria: 'Catálogo', enApp: true },
    eliminar_rubro: { etiqueta: 'Eliminar rubros', categoria: 'Catálogo', enApp: true },
    imprimir_ofertas: { etiqueta: 'Imprimir ofertas', categoria: 'Catálogo', enApp: false },

    ver_ventas: { etiqueta: 'Ver ventas del día', categoria: 'Ventas y Caja', enApp: true },
    ver_caja: { etiqueta: 'Ver estado de caja', categoria: 'Ventas y Caja', enApp: true },

    gestionar_ordenes: { etiqueta: 'Gestionar órdenes', categoria: 'Compras', enApp: false },
    registrar_compra: { etiqueta: 'Recibir compras', categoria: 'Compras', enApp: false },

    ver_reportes: { etiqueta: 'Ver reportes e indicadores', categoria: 'Administración', enApp: true },
    ver_egresos: { etiqueta: 'Ver egresos', categoria: 'Administración', enApp: false },
    ver_auditoria: { etiqueta: 'Ver auditoría', categoria: 'Administración', enApp: false },
};

const ORDEN_CATEGORIAS = ['Stock', 'Catálogo', 'Ventas y Caja', 'Compras', 'Administración', 'Otros'];

const describirPermiso = (codigo) => {
    const clave = typeof codigo === 'string' ? codigo : String(codigo ?? '');
    if (CATALOGO_PERMISOS[clave]) {
        return CATALOGO_PERMISOS[clave];
    }
    return {
        etiqueta: clave
            ? clave.replaceAll('_', ' ').replace(/^\w/, (letra) => letra.toUpperCase())
            : 'Permiso operativo',
        categoria: 'Otros',
        enApp: false,
    };
};

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
        const controlador = new AbortController();

        async function comprobarSesion() {
            try {
                setVerificando(true);
                setError(null);
                await verificarSesion({ signal: controlador.signal });
            } catch (err) {
                if (!controlador.signal.aborted) {
                    setError(mensajeDeError(err, 'No se pudo verificar tu sesión actual.'));
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setVerificando(false);
                }
            }
        }

        comprobarSesion();
        return () => controlador.abort();
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
    const grupos = ORDEN_CATEGORIAS
        .map((categoria) => ({
            categoria,
            items: permisos
                .map((codigo) => ({ codigo, ...describirPermiso(codigo) }))
                .filter((item) => item.categoria === categoria),
        }))
        .filter((grupo) => grupo.items.length > 0);

    const columnaIzquierda = [];
    const columnaDerecha = [];
    let pesoIzquierda = 0;
    let pesoDerecha = 0;
    for (const grupo of grupos) {
        const pesoGrupo = grupo.items.length + 2;
        if (pesoIzquierda <= pesoDerecha) {
            columnaIzquierda.push(grupo);
            pesoIzquierda += pesoGrupo;
        } else {
            columnaDerecha.push(grupo);
            pesoDerecha += pesoGrupo;
        }
    }

    let estadoSesion = {
        texto: 'Sesión activa',
        clase: estilos.activo,
        icono: <IconoEstadoOk size={13} />,
        ayuda: 'Tu cuenta está habilitada y la sesión actual fue confirmada por el sistema central.',
    };
    if (verificando) {
        estadoSesion = {
            texto: 'Verificando...',
            clase: estilos.neutro,
            icono: <IconoEstadoInfo size={13} />,
            ayuda: 'Verificando el estado de tu sesión.',
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
        <section className={estilos.pagina}>
            <BarraCarga activa={verificando} etiqueta="Verificando sesión..." />

            <EncabezadoPagina
                compacto
                etiqueta="Tu cuenta en Cafeto"
                titulo="Mi perfil"
                subtitulo="Tu rol asignado y el detalle de lo que podés operar desde esta aplicación y en el panel completo."
            />

            {error && (
                <AvisoError
                    titulo="No pudimos confirmar tu sesión"
                    mensaje={error}
                    onReintentar={() => setIntento((n) => n + 1)}
                    reintentando={verificando}
                />
            )}

            <div className={estilos.fichaCuenta}>
                <div className={estilos.datosPersona}>
                    <span className={estilos.avatar} aria-hidden="true">
                        {`${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase() || 'CF'}
                    </span>
                    <div>
                        <h2 className={estilos.nombreCompleto}>
                            {usuario.nombre} {usuario.apellido}
                        </h2>
                        <div className={estilos.metaCuenta}>
                            <span className={estilos.badgePerfil}>{usuario.perfil || 'Personal operativo'}</span>
                            <span className={estilos.tipoCuenta}>{tipoDeCuenta(usuario)}</span>
                        </div>
                    </div>
                </div>

                <Tooltip esEtiqueta texto={estadoSesion.ayuda}>
                    <span className={`${estilos.badge} ${estadoSesion.clase}`}>
                        {estadoSesion.icono}
                        <span>{estadoSesion.texto}</span>
                    </span>
                </Tooltip>
            </div>

            <section className={estilos.bloquePermisos} aria-labelledby="titulo-permisos">
                <div className={estilos.cabeceraPermisos}>
                    <div>
                        <h2 id="titulo-permisos" className={estilos.tituloPanel}>
                            Permisos habilitados
                        </h2>
                        <p className={estilos.bajadaPermisos}>
                            Distinguimos qué tareas resolvés directamente en esta app y cuáles requieren el panel completo.
                        </p>
                    </div>
                    <div className={estilos.leyenda}>
                        <span className={`${estilos.etiquetaAlcance} ${estilos.alcanceApp}`}>
                            <IconoEstadoOk size={12} />
                            <span>En esta app</span>
                        </span>
                        <span className={`${estilos.etiquetaAlcance} ${estilos.alcanceWeb}`}>
                            <IconoEstadoInfo size={12} />
                            <span>Panel completo</span>
                        </span>
                    </div>
                </div>

                {grupos.length > 0 ? (
                    <div className={estilos.grillaGrupos}>
                        <div className={estilos.columnaGrupos}>
                            {columnaIzquierda.map((grupo) => (
                                <article key={grupo.categoria} className={estilos.grupo}>
                                    <h3 className={estilos.tituloGrupo}>{grupo.categoria}</h3>
                                    <ul className={estilos.listaPermisos}>
                                        {grupo.items.map((permiso) => (
                                            <li key={permiso.codigo} className={estilos.itemPermiso}>
                                                <span className={estilos.nombrePermiso}>{permiso.etiqueta}</span>
                                                <span
                                                    className={`${estilos.etiquetaAlcance} ${
                                                        permiso.enApp ? estilos.alcanceApp : estilos.alcanceWeb
                                                    }`}
                                                >
                                                    {permiso.enApp ? <IconoEstadoOk size={12} /> : <IconoEstadoInfo size={12} />}
                                                    <span>{permiso.enApp ? 'En esta app' : 'Panel completo'}</span>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            ))}
                        </div>
                        <div className={estilos.columnaGrupos}>
                            {columnaDerecha.map((grupo) => (
                                <article key={grupo.categoria} className={estilos.grupo}>
                                    <h3 className={estilos.tituloGrupo}>{grupo.categoria}</h3>
                                    <ul className={estilos.listaPermisos}>
                                        {grupo.items.map((permiso) => (
                                            <li key={permiso.codigo} className={estilos.itemPermiso}>
                                                <span className={estilos.nombrePermiso}>{permiso.etiqueta}</span>
                                                <span
                                                    className={`${estilos.etiquetaAlcance} ${
                                                        permiso.enApp ? estilos.alcanceApp : estilos.alcanceWeb
                                                    }`}
                                                >
                                                    {permiso.enApp ? <IconoEstadoOk size={12} /> : <IconoEstadoInfo size={12} />}
                                                    <span>{permiso.enApp ? 'En esta app' : 'Panel completo'}</span>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className={estilos.texto}>Tu perfil todavía no tiene tareas habilitadas.</p>
                )}
            </section>

            <section className={estilos.bloqueAdministracion} aria-labelledby="titulo-admin">
                <div>
                    <h2 id="titulo-admin" className={estilos.tituloPanel}>
                        Altas, bajas y contraseñas
                    </h2>
                    <p className={estilos.texto}>
                        Crear usuarios, darlos de baja o restablecer una contraseña se realiza desde el panel completo del sistema,
                        en Equipo y permisos, dentro de Usuarios, para que quede asentado en el registro de actividad.
                    </p>
                </div>
                {usuario.es_administrador && (
                    <a href={`${URL_WEB_DJANGO}/usuarios/`} target="_blank" rel="noreferrer" className={estilos.enlace}>
                        <span>Ir a la gestión de usuarios</span>
                        <IconoExterno size={16} />
                    </a>
                )}
            </section>
        </section>
    );
}

export default Usuarios;
