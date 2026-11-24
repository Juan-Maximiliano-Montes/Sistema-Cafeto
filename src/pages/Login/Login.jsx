import { useEffect, useId, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
    esSesionVencida,
    guardarRutaPostLogin,
    haySesion,
    limpiarRutaPostLogin,
    limpiarSesion,
    loginUsuario,
    normalizarRutaPostLogin,
    obtenerRutaPostLogin,
    URL_WEB_DJANGO,
} from '../../api/api';
import {
    IconoEstadoError,
    IconoEstadoInfo,
    IconoEstadoOk,
    IconoExterno,
} from '../../components/Iconos/Iconos';
import fotoFachada from '../../assets/foto de fachada nocturna del local.jpg';
import estilos from './Login.module.css';

const validarUsuarioODni = (valor) => {
    const limpio = String(valor ?? '').trim();
    if (!limpio) return 'Ingresá tu usuario o tu DNI.';
    if (limpio.length > 50) return 'Es demasiado largo para un usuario o DNI.';
    if (/^\d+$/.test(limpio) && (limpio.length < 6 || limpio.length > 12)) {
        return 'El DNI debe tener entre 6 y 12 dígitos.';
    }
    return true;
};

function Login() {
    const [errorAuth, setErrorAuth] = useState('');
    const [cargando, setCargando] = useState(false);
    const [verClave, setVerClave] = useState(false);
    const [modalClaveAbierto, setModalClaveAbierto] = useState(false);

    const dialogoClaveRef = useRef(null);
    const idTituloModal = useId();
    const idDescModal = useId();

    const navigate = useNavigate();
    const location = useLocation();
    const aviso = location.state?.aviso;
    const esAvisoOk = location.state?.tipoAviso === 'ok' || (typeof aviso === 'string' && aviso.startsWith('Cerraste'));
    const esSesionExpirada = Boolean(location.state?.sesionExpirada) || esSesionVencida();
    const rutaDesdeEstado = normalizarRutaPostLogin(location.state?.desde);
    const [teniaSesion] = useState(() => haySesion() && !esSesionExpirada);

    const {
        register,
        handleSubmit,
        setError,
        control,
        formState: { errors },
    } = useForm({
        defaultValues: { usuario: '', clave: '' },
        mode: 'onBlur',
        reValidateMode: 'onChange',
    });

    const [usuarioValor = '', claveValor = ''] = useWatch({
        control,
        name: ['usuario', 'clave'],
    });

    const formularioCompletoYValido =
        validarUsuarioODni(usuarioValor) === true &&
        String(claveValor).length > 0 &&
        !errors.usuario &&
        !errors.clave;
    const botonDeshabilitado = cargando || !formularioCompletoYValido;

    useEffect(() => {
        if (rutaDesdeEstado) {
            guardarRutaPostLogin(rutaDesdeEstado);
        }
    }, [rutaDesdeEstado]);

    useEffect(() => {
        if (esSesionExpirada && haySesion()) {
            limpiarSesion();
        }
    }, [esSesionExpirada]);

    useEffect(() => {
        const dialogo = dialogoClaveRef.current;
        if (!dialogo) return;
        if (modalClaveAbierto && !dialogo.open) dialogo.showModal();
        if (!modalClaveAbierto && dialogo.open) dialogo.close();
    }, [modalClaveAbierto]);

    if (teniaSesion) {
        return <Navigate to={rutaDesdeEstado || '/inicio'} replace />;
    }

    const onSubmit = async (data) => {
        try {
            setErrorAuth('');
            setCargando(true);
            await loginUsuario(data.usuario.trim(), data.clave);
            const destino =
                normalizarRutaPostLogin(location.state?.desde) ||
                obtenerRutaPostLogin() ||
                '/inicio';
            limpiarRutaPostLogin();
            navigate(destino, { replace: true });
        } catch (error) {
            if (error?.errores) {
                for (const [campo, mensaje] of Object.entries(error.errores)) {
                    if (campo === 'usuario' || campo === 'clave') {
                        setError(campo, { type: 'server', message: mensaje });
                    }
                }
            }
            setErrorAuth(error.message || 'No se pudo verificar tu usuario. Probá de nuevo.');
        } finally {
            setCargando(false);
        }
    };

    const alClickEnFondoModal = (evento) => {
        if (evento.target === dialogoClaveRef.current) {
            setModalClaveAbierto(false);
        }
    };

    const alCancelarModal = (evento) => {
        evento.preventDefault();
        setModalClaveAbierto(false);
    };

    return (
        <section className={estilos.pantalla} aria-labelledby="titulo-login">
            <div className={estilos.panelVisual}>
                <img
                    src={fotoFachada}
                    alt="Fachada iluminada de Cafeto Las Lomitas"
                    className={estilos.imagenFondo}
                />
                <div className={estilos.degradadoVisual} aria-hidden="true" />
                <div className={estilos.marca}>
                    <span className={estilos.etiquetaVisual}>Cafeto · Las Lomitas</span>
                    <p className={estilos.lema}>
                        Gestión de salón, minisúper y cajas en tiempo real.
                    </p>
                </div>
            </div>

            <div className={estilos.panelFormulario}>
                <div className={estilos.bloqueFormulario}>
                    <span className={estilos.etiqueta}>Acceso del equipo</span>
                    <h1 id="titulo-login" className={estilos.titulo}>Ingreso de turno</h1>
                    <p className={estilos.subtitulo}>Entrá con tu usuario operativo o tu DNI.</p>

                    {aviso && !errorAuth && (
                        <div
                            className={`${estilos.avisoEstado} ${esAvisoOk ? estilos.avisoOk : estilos.avisoInfo}`}
                            role="status"
                        >
                            <span className={estilos.iconoAviso} aria-hidden="true">
                                {esAvisoOk ? <IconoEstadoOk size={16} /> : <IconoEstadoInfo size={16} />}
                            </span>
                            <span>{aviso}</span>
                        </div>
                    )}

                    {errorAuth && (
                        <div className={estilos.errorGeneral} role="alert">
                            <span className={estilos.iconoError} aria-hidden="true">
                                <IconoEstadoError size={15} />
                            </span>
                            <span>{errorAuth}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className={estilos.formulario} noValidate>
                        <div className={estilos.grupoCampo}>
                            <label htmlFor="usuario" className={estilos.label}>Usuario o DNI</label>
                            <input
                                id="usuario"
                                type="text"
                                className={`${estilos.input} ${errors.usuario ? estilos.inputConError : ''}`}
                                placeholder="lopezm o 17235560"
                                autoFocus
                                autoComplete="username"
                                autoCapitalize="none"
                                spellCheck="false"
                                aria-invalid={errors.usuario ? 'true' : 'false'}
                                aria-describedby={errors.usuario ? 'error-usuario' : undefined}
                                disabled={cargando}
                                {...register('usuario', {
                                    validate: validarUsuarioODni,
                                })}
                            />
                            {errors.usuario && (
                                <p id="error-usuario" className={estilos.mensajeError} role="alert">
                                    <IconoEstadoError size={14} />
                                    <span>{errors.usuario.message}</span>
                                </p>
                            )}
                        </div>

                        <div className={estilos.grupoCampo}>
                            <label htmlFor="clave" className={estilos.label}>Contraseña</label>
                            <div className={estilos.campoClave}>
                                <input
                                    id="clave"
                                    type={verClave ? 'text' : 'password'}
                                    className={`${estilos.input} ${errors.clave ? estilos.inputConError : ''}`}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    aria-invalid={errors.clave ? 'true' : 'false'}
                                    aria-describedby={errors.clave ? 'error-clave' : undefined}
                                    disabled={cargando}
                                    {...register('clave', {
                                        required: 'Ingresá tu contraseña.',
                                    })}
                                />
                                <button
                                    type="button"
                                    className={estilos.botonVer}
                                    onClick={() => setVerClave((visible) => !visible)}
                                    aria-pressed={verClave}
                                >
                                    {verClave ? 'Ocultar' : 'Ver'}
                                </button>
                            </div>
                            {errors.clave && (
                                <p id="error-clave" className={estilos.mensajeError} role="alert">
                                    <IconoEstadoError size={14} />
                                    <span>{errors.clave.message}</span>
                                </p>
                            )}
                        </div>

                        <button type="submit" className={estilos.botonIngresar} disabled={botonDeshabilitado}>
                            {cargando ? 'Verificando tus datos...' : 'Ingresar al turno'}
                        </button>
                    </form>

                    <div className={estilos.bloqueAyuda}>
                        <button
                            type="button"
                            className={estilos.botonOlvido}
                            onClick={() => setModalClaveAbierto(true)}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                </div>
            </div>

            <dialog
                ref={dialogoClaveRef}
                className={estilos.dialogo}
                aria-labelledby={idTituloModal}
                aria-describedby={idDescModal}
                onClick={alClickEnFondoModal}
                onCancel={alCancelarModal}
            >
                <div className={estilos.cajaDialogo}>
                    <span className={estilos.etiqueta}>Ayuda para ingresar</span>
                    <h2 id={idTituloModal} className={estilos.tituloDialogo}>
                        ¿Olvidaste tu contraseña?
                    </h2>
                    <p id={idDescModal} className={estilos.textoDialogo}>
                        Por seguridad, el blanqueo de claves queda registrado en el sistema central de Cafeto. Seguí estos pasos:
                    </p>
                    <ol className={estilos.pasosDialogo}>
                        <li>Pedile a un administrador o encargado de turno que te genere una clave nueva en Equipo y permisos, dentro de Usuarios.</li>
                        <li>Si ya tenés correo asociado en el panel completo, también podés iniciar la recuperación desde esa pantalla de acceso.</li>
                        <li>Cuando recibas la clave provisoria, volvé acá e ingresá con tu usuario o DNI.</li>
                    </ol>
                    <div className={estilos.accionesDialogo}>
                        <a
                            href={`${URL_WEB_DJANGO}/login/`}
                            target="_blank"
                            rel="noreferrer"
                            className={estilos.enlaceDialogo}
                        >
                            <span>Ir al panel completo de Cafeto</span>
                            <IconoExterno size={16} />
                        </a>
                        <button
                            type="button"
                            className={estilos.botonCerrarDialogo}
                            onClick={() => setModalClaveAbierto(false)}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </dialog>
        </section>
    );
}

export default Login;
