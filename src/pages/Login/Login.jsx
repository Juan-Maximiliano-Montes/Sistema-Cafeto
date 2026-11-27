import { useEffect, useId, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import CampoFormulario from '../../components/CampoFormulario/CampoFormulario';
import Tooltip from '../../components/Tooltip/Tooltip';
import { useNotificacion } from '../../hooks/useNotificacion';
import { useTamanoTexto } from '../../hooks/useTamanoTexto';
import { useTema } from '../../hooks/useTema';
import { navegarConTransicion } from '../../utils/transicion';
import {
    IconoEstadoAlerta,
    IconoEstadoError,
    IconoEstadoInfo,
    IconoEstadoOk,
    IconoExterno,
    IconoLuna,
    IconoSol,
} from '../../components/Iconos/Iconos';
import fotoFachada from '../../assets/cafeto-fachada.jpg';
import iconoAmbar from '../../assets/cafeto-icono-ambar.svg';
import logoNegativo from '../../assets/cafeto-horizontal-negativo.svg';
import logoPositivo from '../../assets/cafeto-horizontal-positivo.svg';
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
    const [bloqMayus, setBloqMayus] = useState(false);
    const [modalClaveAbierto, setModalClaveAbierto] = useState(false);

    const dialogoClaveRef = useRef(null);
    const idTituloModal = useId();
    const idDescModal = useId();

    const navigate = useNavigate();
    const location = useLocation();
    const { notificar } = useNotificacion();
    const { esClaro, alternarTema } = useTema();
    const { esGrande, alternarTamano } = useTamanoTexto();
    const logoActual = esClaro ? logoPositivo : logoNegativo;

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
        formState: { errors, touchedFields },
    } = useForm({
        defaultValues: { usuario: '', clave: '' },
        mode: 'onBlur',
        reValidateMode: 'onChange',
    });

    const [usuarioValor = '', claveValor = ''] = useWatch({
        control,
        name: ['usuario', 'clave'],
    });

    const usuarioValido = validarUsuarioODni(usuarioValor) === true;
    const claveValida = String(claveValor).length > 0;
    const formularioCompletoYValido =
        usuarioValido && claveValida && !errors.usuario && !errors.clave;
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

    const detectarBloqMayus = (evento) => {
        if (typeof evento.getModifierState === 'function') {
            setBloqMayus(evento.getModifierState('CapsLock'));
        }
    };

    const onSubmit = async (data) => {
        try {
            setErrorAuth('');
            setCargando(true);
            const sesion = await loginUsuario(data.usuario.trim(), data.clave);
            const nombreUsuario = sesion?.usuario?.nombre;
            notificar({
                texto: nombreUsuario
                    ? `¡Bienvenido/a, ${nombreUsuario}! Turno iniciado en Cafeto.`
                    : 'Turno iniciado correctamente en Cafeto.',
                tono: 'exito',
            });
            const destino =
                normalizarRutaPostLogin(location.state?.desde) ||
                obtenerRutaPostLogin() ||
                '/inicio';
            limpiarRutaPostLogin();
            navegarConTransicion(navigate, destino, { replace: true });
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
        <section className={estilos.pantalla} data-iris-login="true" aria-labelledby="titulo-login">
            <div className={estilos.panelVisual}>
                <img
                    src={fotoFachada}
                    alt="Fachada iluminada de Cafeto Las Lomitas"
                    className={estilos.imagenFondo}
                />
                <div className={estilos.degradadoVisual} aria-hidden="true" />

                <div className={estilos.notchWrap}>
                    <div className={estilos.notch}>
                        <img src={iconoAmbar} alt="" className={estilos.notchLogo} aria-hidden="true" />
                        <span className={estilos.notchDot} aria-hidden="true" />
                        <span className={estilos.notchTexto}>Ruta 51 Km. 17 · Campo Quijano · Cafeto</span>
                    </div>
                </div>

                <div className={estilos.pieFoto}>
                    <span className={estilos.etiquetaVisual}>Salón · Stock · Cajas en tiempo real</span>
                    <p className={estilos.marcaFoto}>Cafeto Las Lomitas</p>
                </div>
            </div>

            <div className={estilos.panelFormulario}>
                <header className={estilos.cabeceraPanel}>
                    <Tooltip texto="Volver a la portada" posicion="abajo">
                        <Link
                            to="/"
                            onClick={(e) => {
                                e.preventDefault();
                                navegarConTransicion(navigate, '/');
                            }}
                            className={estilos.enlaceLogo}
                            aria-label="Cafeto Las Lomitas, volver a la portada"
                        >
                            <img src={logoActual} alt="Cafeto Las Lomitas" className={estilos.logo} />
                        </Link>
                    </Tooltip>

                    <div className={estilos.controlesTop}>
                        <Tooltip
                            texto={esGrande ? 'Volver al tamaño normal' : 'Agrandar letras'}
                            posicion="abajo"
                        >
                            <button
                                type="button"
                                className={`${estilos.pillControl} ${esGrande ? estilos.pillControlActivo : ''}`}
                                onClick={alternarTamano}
                                aria-pressed={esGrande}
                            >
                                <span>{esGrande ? 'A- Normal' : 'A+ Agrandar'}</span>
                            </button>
                        </Tooltip>

                        <Tooltip
                            texto={esClaro ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
                            posicion="abajo"
                        >
                            <button
                                type="button"
                                className={estilos.pillControl}
                                onClick={alternarTema}
                                aria-pressed={esClaro}
                            >
                                {esClaro ? <IconoLuna size={15} /> : <IconoSol size={15} />}
                                <span>{esClaro ? 'Oscuro' : 'Claro'}</span>
                            </button>
                        </Tooltip>
                    </div>
                </header>

                <div className={estilos.bloqueFormulario}>
                    <h1 id="titulo-login" className={estilos.titulo}>¡Hola!</h1>
                    <p className={estilos.subtitulo}>Ingresá con tu usuario operativo o tu DNI.</p>

                    {aviso && !errorAuth && (
                        <div
                            className={`alert ${estilos.avisoEstado} ${esAvisoOk ? estilos.avisoOk : estilos.avisoInfo}`}
                            role="status"
                        >
                            <span className={estilos.iconoAviso} aria-hidden="true">
                                {esAvisoOk ? <IconoEstadoOk size={16} /> : <IconoEstadoInfo size={16} />}
                            </span>
                            <span>{aviso}</span>
                        </div>
                    )}

                    {errorAuth && (
                        <div className={`alert ${estilos.errorGeneral}`} role="alert">
                            <span className={estilos.iconoError} aria-hidden="true">
                                <IconoEstadoError size={15} />
                            </span>
                            <span>{errorAuth}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className={estilos.formulario} noValidate>
                        <CampoFormulario
                            id="usuario"
                            etiqueta="DNI o usuario"
                            requerido
                            ayudaTooltip="Podés usar tu nombre de usuario (ej. lopezm) o tu DNI sin puntos."
                            error={errors.usuario?.message || ''}
                            valido={Boolean(touchedFields.usuario && usuarioValido && !errors.usuario)}
                        >
                            <input
                                id="usuario"
                                type="text"
                                className={`form-control ${estilos.input} ${errors.usuario ? estilos.inputConError : ''}`}
                                placeholder="lopezm o 17235560"
                                autoFocus
                                autoComplete="username"
                                autoCapitalize="none"
                                spellCheck="false"
                                aria-invalid={errors.usuario ? 'true' : 'false'}
                                aria-describedby={errors.usuario ? 'usuario-error' : undefined}
                                disabled={cargando}
                                {...register('usuario', {
                                    validate: validarUsuarioODni,
                                })}
                            />
                        </CampoFormulario>

                        <CampoFormulario
                            id="clave"
                            etiqueta="Contraseña"
                            requerido
                            error={errors.clave?.message || ''}
                            valido={Boolean(touchedFields.clave && claveValida && !errors.clave)}
                        >
                            <div className={estilos.campoClave}>
                                <input
                                    id="clave"
                                    type={verClave ? 'text' : 'password'}
                                    className={`form-control ${estilos.input} ${errors.clave ? estilos.inputConError : ''}`}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    aria-invalid={errors.clave ? 'true' : 'false'}
                                    aria-describedby={errors.clave ? 'clave-error' : undefined}
                                    disabled={cargando}
                                    onKeyUp={detectarBloqMayus}
                                    onKeyDown={detectarBloqMayus}
                                    {...register('clave', {
                                        required: 'Ingresá tu contraseña.',
                                    })}
                                />
                                <Tooltip
                                    texto={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    posicion="arriba"
                                >
                                    <button
                                        type="button"
                                        className={`btn ${estilos.botonVer}`}
                                        onClick={() => setVerClave((visible) => !visible)}
                                        aria-pressed={verClave}
                                    >
                                        {verClave ? 'Ocultar' : 'Ver'}
                                    </button>
                                </Tooltip>
                            </div>
                        </CampoFormulario>

                        {bloqMayus && (
                            <div className={estilos.avisoMayus} role="status">
                                <IconoEstadoAlerta size={15} />
                                <span>Tenés activado Bloq Mayús.</span>
                            </div>
                        )}

                        <button type="submit" className={`btn ${estilos.botonIngresar}`} disabled={botonDeshabilitado}>
                            {cargando ? 'Verificando tus datos...' : 'Ingresar al turno'}
                        </button>
                    </form>

                    <div className={estilos.bloqueAyuda}>
                        <button
                            type="button"
                            className={`btn ${estilos.botonOlvido}`}
                            onClick={() => setModalClaveAbierto(true)}
                        >
                            ¿Te olvidaste la clave?
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
                        ¿Te olvidaste la clave?
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
