import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { haySesion, loginUsuario } from '../../api/api';
import { IconoEstadoAlerta, IconoEstadoError, IconoVolver } from '../../components/Iconos/Iconos';
import estilos from './Login.module.css';

import fotoFachada from '../../assets/foto de fachada nocturna del local.jpg';
import isologoNegativo from '../../assets/cafeto-isologotipo-negativo.svg';

function Login() {
    const [errorAuth, setErrorAuth] = useState('');
    const [cargando, setCargando] = useState(false);
    const [verClave, setVerClave] = useState(false);
    const [teniaSesion] = useState(haySesion);

    const navigate = useNavigate();
    const location = useLocation();
    const aviso = location.state?.aviso;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ defaultValues: { usuario: '', clave: '' } });

    if (teniaSesion) {
        return <Navigate to="/inicio" replace />;
    }

    const onSubmit = async (data) => {
        try {
            setErrorAuth('');
            setCargando(true);
            await loginUsuario(data.usuario.trim(), data.clave);
            navigate(location.state?.desde || '/inicio', { replace: true });
        } catch (error) {
            setErrorAuth(error.message || 'No se pudo verificar tu usuario. Probá de nuevo.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <section className={estilos.pantalla}>
            <div className={estilos.panelVisual} style={{ '--foto-login': `url("${fotoFachada}")` }}>
                <div className={estilos.marca}>
                    <img src={isologoNegativo} alt="Cafeto Las Lomitas" className={estilos.isologo} />
                    <p className={estilos.lema}>Gestión integral de salón, minisúper y cajas en tiempo real</p>
                </div>
            </div>

            <div className={estilos.panelFormulario}>
                <div className={estilos.tarjeta}>
                    <Link to="/" className={estilos.volver}>
                        <IconoVolver size={16} />
                        <span>Volver a la portada</span>
                    </Link>

                    <span className={estilos.etiqueta}>Acceso del equipo</span>
                    <h1 className={estilos.titulo}>Ingreso de turno</h1>
                    <p className={estilos.subtitulo}>Entrá con tu usuario operativo o tu DNI.</p>

                    {aviso && !errorAuth && (
                        <div className={estilos.avisoInfo} role="status">
                            <span className={estilos.iconoAviso} aria-hidden="true">
                                <IconoEstadoAlerta size={16} />
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
                                autoComplete="username"
                                autoCapitalize="none"
                                spellCheck="false"
                                aria-invalid={errors.usuario ? 'true' : 'false'}
                                aria-describedby={errors.usuario ? 'error-usuario' : undefined}
                                disabled={cargando}
                                {...register('usuario', {
                                    validate: (valor) => valor.trim() !== '' || 'Ingresá tu usuario o tu DNI.',
                                    maxLength: { value: 50, message: 'Es demasiado largo para un usuario o DNI.' },
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

                        <button type="submit" className={estilos.botonIngresar} disabled={cargando}>
                            {cargando ? 'Verificando con Django...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <p className={estilos.ayuda}>
                        ¿Te olvidaste la contraseña? Pedile al administrador que te la restablezca.
                    </p>
                </div>
            </div>
        </section>
    );
}

export default Login;
