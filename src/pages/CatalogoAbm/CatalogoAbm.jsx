import { useEffect, useId, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
    crearMarca,
    crearRubro,
    editarMarca,
    editarRubro,
    eliminarMarca,
    eliminarRubro,
    extraerErroresDeCampo,
    getMarcas,
    getRubros,
    getUsuarioActual,
    mensajeDeError,
    tienePermiso,
} from '../../api/api';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina';
import AvisoError from '../../components/AvisoError/AvisoError';
import { BarraCarga } from '../../components/BarraCarga/BarraCarga';
import BarraFlotante from '../../components/BarraFlotante/BarraFlotante';
import Confirmacion from '../../components/Confirmacion/Confirmacion';
import {
    IconoActualizar,
    IconoBuscar,
    IconoCerrar,
    IconoEditar,
    IconoEliminar,
    IconoEstadoAlerta,
    IconoEstadoError,
    IconoEstadoInfo,
    IconoEstadoOk,
    IconoEtiqueta,
    IconoMas,
} from '../../components/Iconos/Iconos';
import { formatearNumero } from '../../utils/formato';
import estilos from './CatalogoAbm.module.css';

function CatalogoAbm() {
    const usuario = getUsuarioActual();

    const permisosMarca = {
        ver: tienePermiso(usuario, 'ver_marcas'),
        crear: tienePermiso(usuario, 'crear_marca'),
        editar: tienePermiso(usuario, 'editar_marca'),
        eliminar: tienePermiso(usuario, 'eliminar_marca'),
    };
    const permisosRubro = {
        ver: tienePermiso(usuario, 'ver_rubros'),
        crear: tienePermiso(usuario, 'crear_rubro'),
        editar: tienePermiso(usuario, 'editar_rubro'),
        eliminar: tienePermiso(usuario, 'eliminar_rubro'),
    };

    const [pestana, setPestana] = useState(permisosMarca.ver || !permisosRubro.ver ? 'MARCAS' : 'RUBROS');
    const [busqueda, setBusqueda] = useState('');
    const [consulta, setConsulta] = useState('');
    const [items, setItems] = useState([]);
    const [pagina, setPagina] = useState(1);
    const [hayMas, setHayMas] = useState(false);
    const [cargando, setCargando] = useState(permisosMarca.ver || permisosRubro.ver);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [errorCarga, setErrorCarga] = useState(null);
    const [intento, setIntento] = useState(0);
    const [conteos, setConteos] = useState({ MARCAS: null, RUBROS: null });

    const [avisoExito, setAvisoExito] = useState('');
    const [errorOperacion, setErrorOperacion] = useState('');
    const [cambiandoEstadoId, setCambiandoEstadoId] = useState(null);

    const [panelAbierto, setPanelAbierto] = useState(false);
    const [editando, setEditando] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [errorFormulario, setErrorFormulario] = useState('');

    const [objetivoEliminar, setObjetivoEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    const dialogoRef = useRef(null);
    const idTituloPanel = useId();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        control,
        formState: { errors },
    } = useForm({
        defaultValues: { nombre: '', descripcion: '', activo: true },
        mode: 'onBlur',
        reValidateMode: 'onChange',
    });

    const activoWatch = useWatch({ control, name: 'activo', defaultValue: true });

    const esMarcas = pestana === 'MARCAS';
    const permisosActuales = esMarcas ? permisosMarca : permisosRubro;
    const nombreEntidad = esMarcas ? 'marca' : 'rubro';
    const puedeEscribirAlgo = permisosActuales.crear || permisosActuales.editar || permisosActuales.eliminar;

    useEffect(() => {
        const espera = setTimeout(() => setConsulta(busqueda.trim()), 300);
        return () => clearTimeout(espera);
    }, [busqueda]);

    useEffect(() => {
        const dialogo = dialogoRef.current;
        if (!dialogo) return;
        if (panelAbierto && !dialogo.open) dialogo.showModal();
        if (!panelAbierto && dialogo.open) dialogo.close();
    }, [panelAbierto]);

    useEffect(() => {
        const controlador = new AbortController();

        async function precargarConteoInactivo() {
            const claveInactiva = esMarcas ? 'RUBROS' : 'MARCAS';
            const puedeVerInactiva = esMarcas ? permisosRubro.ver : permisosMarca.ver;
            if (!puedeVerInactiva) return;

            try {
                const fetcher = esMarcas ? getRubros : getMarcas;
                const datos = await fetcher({ q: '', pagina: 1, signal: controlador.signal });
                const lista = Array.isArray(datos?.resultados) ? datos.resultados.filter(Boolean) : [];
                if (!controlador.signal.aborted) {
                    setConteos((prev) => ({
                        ...prev,
                        [claveInactiva]: { cantidad: lista.length, hayMas: Boolean(datos?.hayMas) },
                    }));
                }
            } catch {
                // El conteo secundario es informativo y no bloquea la vista.
            }
        }

        precargarConteoInactivo();
        return () => controlador.abort();
    }, [esMarcas, intento, permisosMarca.ver, permisosRubro.ver]);

    useEffect(() => {
        if (!permisosActuales.ver) {
            return undefined;
        }

        const controlador = new AbortController();

        async function cargarLista() {
            try {
                setCargando(true);
                setErrorCarga(null);
                const fetcher = esMarcas ? getMarcas : getRubros;
                const datos = await fetcher({ q: consulta, pagina: 1, signal: controlador.signal });
                const lista = Array.isArray(datos?.resultados) ? datos.resultados.filter(Boolean) : [];
                if (!controlador.signal.aborted) {
                    setItems(lista);
                    setHayMas(Boolean(datos?.hayMas));
                    setPagina(1);
                    if (!consulta) {
                        setConteos((prev) => ({
                            ...prev,
                            [esMarcas ? 'MARCAS' : 'RUBROS']: {
                                cantidad: lista.length,
                                hayMas: Boolean(datos?.hayMas),
                            },
                        }));
                    }
                }
            } catch (err) {
                const mensaje = mensajeDeError(err, `No pudimos cargar ${esMarcas ? 'las marcas' : 'los rubros'}.`);
                if (mensaje && !controlador.signal.aborted) setErrorCarga(mensaje);
            } finally {
                if (!controlador.signal.aborted) setCargando(false);
            }
        }

        cargarLista();
        return () => controlador.abort();
    }, [esMarcas, consulta, intento, permisosActuales.ver]);

    const cambiarPestana = (nueva) => {
        if (nueva === pestana) return;
        setPestana(nueva);
        setItems([]);
        setBusqueda('');
        setConsulta('');
        setErrorCarga(null);
        setErrorOperacion('');
        setAvisoExito('');
    };

    const cargarMas = async () => {
        try {
            setCargandoMas(true);
            setErrorOperacion('');
            const siguiente = pagina + 1;
            const fetcher = esMarcas ? getMarcas : getRubros;
            const datos = await fetcher({ q: consulta, pagina: siguiente });
            const nuevos = Array.isArray(datos?.resultados) ? datos.resultados.filter(Boolean) : [];
            setItems((previos) => {
                const actualizados = [...(Array.isArray(previos) ? previos : []), ...nuevos];
                if (!consulta) {
                    setConteos((prev) => ({
                        ...prev,
                        [esMarcas ? 'MARCAS' : 'RUBROS']: {
                            cantidad: actualizados.length,
                            hayMas: Boolean(datos?.hayMas),
                        },
                    }));
                }
                return actualizados;
            });
            setHayMas(Boolean(datos?.hayMas));
            setPagina(siguiente);
        } catch (err) {
            setErrorOperacion(mensajeDeError(err, 'No pudimos traer más registros.'));
        } finally {
            setCargandoMas(false);
        }
    };

    const abrirCrear = (nombreInicial = '') => {
        setEditando(null);
        setErrorFormulario('');
        setErrorOperacion('');
        reset({
            nombre: typeof nombreInicial === 'string' ? nombreInicial : '',
            descripcion: '',
            activo: true,
        });
        setPanelAbierto(true);
    };

    const abrirEditar = (item) => {
        setEditando(item);
        setErrorFormulario('');
        setErrorOperacion('');
        reset({
            nombre: item.nombre || '',
            descripcion: item.descripcion || '',
            activo: item.activo !== false,
        });
        setPanelAbierto(true);
    };

    const cerrarPanel = () => {
        if (guardando) return;
        setPanelAbierto(false);
    };

    const alternarEstadoRubro = async (rubro) => {
        if (esMarcas || !permisosRubro.editar || cambiandoEstadoId === rubro.id) return;

        const estadoPrevio = Boolean(rubro.activo);
        const nuevoEstado = !estadoPrevio;

        setCambiandoEstadoId(rubro.id);
        setErrorOperacion('');
        setAvisoExito('');
        setItems((previos) =>
            previos.map((r) => (r.id === rubro.id ? { ...r, activo: nuevoEstado } : r))
        );

        try {
            const actualizado = await editarRubro(rubro.id, { activo: nuevoEstado });
            if (actualizado?.id != null) {
                setItems((previos) =>
                    (Array.isArray(previos) ? previos : []).map((r) => (r.id === actualizado.id ? actualizado : r))
                );
            }
            setAvisoExito(
                actualizado?.activo
                    ? `Activaste el rubro "${actualizado?.nombre || rubro.nombre}".`
                    : `Pausaste el rubro "${actualizado?.nombre || rubro.nombre}".`
            );
        } catch (err) {
            setItems((previos) =>
                (Array.isArray(previos) ? previos : []).map((r) => (r.id === rubro.id ? { ...r, activo: estadoPrevio } : r))
            );
            setErrorOperacion(
                err?.response?.data?.detail ||
                mensajeDeError(err, `No pudimos cambiar el estado de "${rubro.nombre}".`)
            );
        } finally {
            setCambiandoEstadoId(null);
        }
    };

    const alGuardar = async (datosForm) => {
        try {
            setGuardando(true);
            setErrorFormulario('');
            setErrorOperacion('');
            setAvisoExito('');

            const nombre = String(datosForm?.nombre ?? '').trim();
            const descripcion = String(datosForm?.descripcion ?? '').trim();
            const claveTab = esMarcas ? 'MARCAS' : 'RUBROS';

            if (esMarcas) {
                if (editando) {
                    const actualizada = await editarMarca(editando.id, { nombre, descripcion });
                    if (actualizada?.id != null) {
                        setItems((previos) =>
                            (Array.isArray(previos) ? previos : []).map((m) => (m.id === actualizada.id ? actualizada : m))
                        );
                    }
                    setAvisoExito(`Actualizaste la marca "${actualizada?.nombre || nombre}".`);
                } else {
                    const creada = await crearMarca({ nombre, descripcion });
                    if (creada) {
                        setItems((previos) => [creada, ...(Array.isArray(previos) ? previos : [])]);
                    }
                    setConteos((prev) =>
                        prev[claveTab]
                            ? { ...prev, [claveTab]: { ...prev[claveTab], cantidad: prev[claveTab].cantidad + 1 } }
                            : prev
                    );
                    setAvisoExito(`Creaste la marca "${creada?.nombre || nombre}".`);
                }
            } else if (editando) {
                const actualizado = await editarRubro(editando.id, {
                    nombre,
                    descripcion,
                    activo: Boolean(datosForm?.activo),
                });
                if (actualizado?.id != null) {
                    setItems((previos) =>
                        (Array.isArray(previos) ? previos : []).map((r) => (r.id === actualizado.id ? actualizado : r))
                    );
                }
                setAvisoExito(`Actualizaste el rubro "${actualizado?.nombre || nombre}".`);
            } else {
                const creado = await crearRubro({
                    nombre,
                    descripcion,
                    activo: Boolean(datosForm?.activo),
                });
                if (creado) {
                    setItems((previos) => [creado, ...(Array.isArray(previos) ? previos : [])]);
                }
                setConteos((prev) =>
                    prev[claveTab]
                        ? { ...prev, [claveTab]: { ...prev[claveTab], cantidad: prev[claveTab].cantidad + 1 } }
                        : prev
                );
                setAvisoExito(`Creaste el rubro "${creado?.nombre || nombre}".`);
            }

            setPanelAbierto(false);
        } catch (err) {
            const erroresCampo = extraerErroresDeCampo(err);
            if (erroresCampo) {
                for (const [campo, mensaje] of Object.entries(erroresCampo)) {
                    if (campo === 'nombre' || campo === 'descripcion' || campo === 'activo') {
                        setError(campo, { type: 'server', message: mensaje });
                    } else {
                        setErrorFormulario(mensaje);
                    }
                }
            } else {
                setErrorFormulario(mensajeDeError(err, `No se pudo guardar ${esMarcas ? 'la marca' : 'el rubro'}.`));
            }
        } finally {
            setGuardando(false);
        }
    };

    const confirmarEliminacion = async () => {
        if (!objetivoEliminar) return;

        try {
            setEliminando(true);
            setErrorOperacion('');
            setAvisoExito('');

            if (esMarcas) {
                await eliminarMarca(objetivoEliminar.id);
            } else {
                await eliminarRubro(objetivoEliminar.id);
            }

            const claveTab = esMarcas ? 'MARCAS' : 'RUBROS';
            setItems((previos) => previos.filter((item) => item.id !== objetivoEliminar.id));
            setConteos((prev) =>
                prev[claveTab]
                    ? {
                        ...prev,
                        [claveTab]: {
                            ...prev[claveTab],
                            cantidad: Math.max(0, prev[claveTab].cantidad - 1),
                        },
                    }
                    : prev
            );
            setAvisoExito(`Diste de baja ${esMarcas ? 'la marca' : 'el rubro'} "${objetivoEliminar.nombre}".`);
            setObjetivoEliminar(null);
        } catch (err) {
            const detalleServidor = err?.response?.data?.detail;
            const mensaje = detalleServidor || mensajeDeError(err, 'No pudimos dar de baja este registro.');
            setErrorOperacion(mensaje);
            setObjetivoEliminar(null);
        } finally {
            setEliminando(false);
        }
    };

    const textoConteo = (clave) => {
        const dato = conteos[clave];
        if (!dato) return null;
        return `${formatearNumero(dato.cantidad)}${dato.hayMas ? '+' : ''}`;
    };

    return (
        <section className={estilos.pagina}>
            <BarraCarga activa={cargando || cargandoMas || guardando || eliminando} etiqueta="Actualizando catálogo" />

            <EncabezadoPagina
                compacto
                etiqueta="Organización del catálogo"
                titulo="Marcas y rubros"
                subtitulo="Consultá, creá o actualizá las marcas y rubros que ordenan los productos de Cafeto."
            >
                <button
                    type="button"
                    className={estilos.botonSecundario}
                    onClick={() => setIntento((n) => n + 1)}
                    disabled={cargando || !permisosActuales.ver}
                >
                    <IconoActualizar size={17} />
                    <span>Actualizar</span>
                </button>
                {permisosActuales.crear && (
                    <button type="button" className={estilos.botonPrincipal} onClick={() => abrirCrear('')}>
                        <IconoMas size={18} />
                        <span>{esMarcas ? 'Nueva marca' : 'Nuevo rubro'}</span>
                    </button>
                )}
            </EncabezadoPagina>

            <div className={estilos.barraSuperior}>
                <div className={estilos.pestanas} role="tablist" aria-label="Tipo de catálogo">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={esMarcas}
                        className={`${estilos.pestana} ${esMarcas ? estilos.pestanaActiva : ''}`}
                        onClick={() => cambiarPestana('MARCAS')}
                    >
                        <IconoEtiqueta size={17} />
                        <span>Marcas</span>
                        {permisosMarca.ver && textoConteo('MARCAS') && (
                            <span className={estilos.conteo}>{textoConteo('MARCAS')}</span>
                        )}
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={!esMarcas}
                        className={`${estilos.pestana} ${!esMarcas ? estilos.pestanaActiva : ''}`}
                        onClick={() => cambiarPestana('RUBROS')}
                    >
                        <IconoEtiqueta size={17} />
                        <span>Rubros</span>
                        {permisosRubro.ver && textoConteo('RUBROS') && (
                            <span className={estilos.conteo}>{textoConteo('RUBROS')}</span>
                        )}
                    </button>
                </div>

                {permisosActuales.ver && (
                    <div className={estilos.barraBusqueda}>
                        <input
                            type="search"
                            className={estilos.inputBusqueda}
                            placeholder={`Buscar ${esMarcas ? 'marcas' : 'rubros'} por nombre...`}
                            aria-label={`Buscar ${esMarcas ? 'marcas' : 'rubros'}`}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                        {busqueda && (
                            <button
                                type="button"
                                className={estilos.limpiar}
                                onClick={() => setBusqueda('')}
                                aria-label="Limpiar búsqueda"
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}
            </div>

            {permisosActuales.ver && !puedeEscribirAlgo && (
                <div className={estilos.avisoSoloLectura} role="status">
                    <IconoEstadoInfo size={16} />
                    <span>
                        Modo solo consulta: tu perfil puede ver {esMarcas ? 'marcas' : 'rubros'}, pero no crearlos ni modificarlos.
                    </span>
                </div>
            )}

            {avisoExito && (
                <div className={estilos.avisoExito} role="status">
                    <IconoEstadoOk size={17} />
                    <span>{avisoExito}</span>
                </div>
            )}

            {errorOperacion && (
                <div className={estilos.avisoConflicto} role="alert">
                    <IconoEstadoAlerta size={18} />
                    <div className={estilos.textoConflicto}>
                        <strong>No pudimos completar la operación</strong>
                        <p>{errorOperacion}</p>
                    </div>
                    <button
                        type="button"
                        className={estilos.cerrarAviso}
                        onClick={() => setErrorOperacion('')}
                        aria-label="Cerrar aviso"
                    >
                        <IconoCerrar size={16} />
                    </button>
                </div>
            )}

            {!permisosActuales.ver ? (
                <div className={estilos.sinPermiso} role="status">
                    <IconoEstadoInfo size={20} />
                    <div>
                        <strong>Sin permiso para ver {esMarcas ? 'marcas' : 'rubros'}</strong>
                        <p>
                            Tu perfil actual no incluye acceso a esta sección. Si lo necesitás para tu turno, podés pedirlo en administración.
                        </p>
                    </div>
                </div>
            ) : errorCarga ? (
                <AvisoError
                    titulo={`No pudimos cargar ${esMarcas ? 'las marcas' : 'los rubros'}`}
                    mensaje={errorCarga}
                    onReintentar={() => setIntento((n) => n + 1)}
                />
            ) : cargando && items.length === 0 ? (
                <div className={estilos.esqueletoLista} aria-busy="true">
                    <div className={estilos.filaEsqueleto} />
                    <div className={estilos.filaEsqueleto} />
                    <div className={estilos.filaEsqueleto} />
                </div>
            ) : items.length === 0 ? (
                <div className={estilos.vacio}>
                    <span className={estilos.vacioIcono} aria-hidden="true">
                        <IconoBuscar size={26} />
                    </span>
                    <p>
                        {consulta
                            ? `No encontramos ${esMarcas ? 'marcas' : 'rubros'} que coincidan con "${consulta}".`
                            : `Todavía no hay ${esMarcas ? 'marcas' : 'rubros'} cargados.`}
                    </p>
                    <div className={estilos.accionesVacio}>
                        {consulta && (
                            <button
                                type="button"
                                className={estilos.botonSecundario}
                                onClick={() => {
                                    setBusqueda('');
                                    setConsulta('');
                                }}
                            >
                                Limpiar búsqueda
                            </button>
                        )}
                        {permisosActuales.crear && (
                            <button
                                type="button"
                                className={estilos.botonPrincipal}
                                onClick={() => abrirCrear(consulta)}
                            >
                                <IconoMas size={17} />
                                <span>
                                    {consulta
                                        ? `Crear "${consulta}"`
                                        : esMarcas
                                            ? 'Crear primera marca'
                                            : 'Crear primer rubro'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className={`${estilos.tablaContenedor} ${cargando ? estilos.actualizando : ''}`}>
                        <table className={estilos.tabla}>
                            <thead>
                                <tr>
                                    <th scope="col">Nombre</th>
                                    <th scope="col">Descripción</th>
                                    {!esMarcas && <th scope="col">Estado</th>}
                                    {(permisosActuales.editar || permisosActuales.eliminar) && (
                                        <th scope="col" className={estilos.colAcciones}>Acciones</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td className={estilos.celdaNombre}>{item.nombre}</td>
                                        <td className={estilos.celdaDesc}>
                                            {item.descripcion || <span className={estilos.sinDesc}>—</span>}
                                        </td>
                                        {!esMarcas && (
                                            <td>
                                                {permisosRubro.editar ? (
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={Boolean(item.activo)}
                                                        aria-label={`${item.nombre}: ${item.activo ? 'Activo' : 'Pausado'}. Tocá para cambiar`}
                                                        disabled={cambiandoEstadoId === item.id}
                                                        onClick={() => alternarEstadoRubro(item)}
                                                        className={`${estilos.switchBadge} ${
                                                            item.activo ? estilos.badgeOk : estilos.badgeInactivo
                                                        }`}
                                                    >
                                                        {item.activo ? <IconoEstadoOk size={13} /> : <IconoEstadoAlerta size={13} />}
                                                        <span>
                                                            {cambiandoEstadoId === item.id
                                                                ? 'Guardando...'
                                                                : item.activo
                                                                    ? 'Activo'
                                                                    : 'Pausado'}
                                                        </span>
                                                    </button>
                                                ) : (
                                                    <span
                                                        className={`${estilos.badge} ${item.activo ? estilos.badgeOk : estilos.badgeInactivo}`}
                                                    >
                                                        {item.activo ? <IconoEstadoOk size={13} /> : <IconoEstadoAlerta size={13} />}
                                                        <span>{item.activo ? 'Activo' : 'Pausado'}</span>
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        {(permisosActuales.editar || permisosActuales.eliminar) && (
                                            <td className={estilos.celdaAcciones}>
                                                {permisosActuales.editar && (
                                                    <button
                                                        type="button"
                                                        className={estilos.botonFila}
                                                        onClick={() => abrirEditar(item)}
                                                        aria-label={`Editar ${item.nombre}`}
                                                    >
                                                        <IconoEditar size={15} />
                                                        <span>Editar</span>
                                                    </button>
                                                )}
                                                {permisosActuales.eliminar && (
                                                    <button
                                                        type="button"
                                                        className={`${estilos.botonFila} ${estilos.botonFilaPeligro}`}
                                                        onClick={() => setObjetivoEliminar(item)}
                                                        aria-label={`Eliminar ${item.nombre}`}
                                                    >
                                                        <IconoEliminar size={15} />
                                                        <span>Eliminar</span>
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {hayMas && (
                        <div className={estilos.cargarMas}>
                            <button
                                type="button"
                                className={estilos.botonSecundario}
                                onClick={cargarMas}
                                disabled={cargandoMas}
                            >
                                {cargandoMas ? 'Trayendo más...' : 'Cargar más'}
                            </button>
                        </div>
                    )}
                </>
            )}

            <dialog
                ref={dialogoRef}
                className={estilos.panelLateral}
                aria-labelledby={idTituloPanel}
                onCancel={(e) => {
                    e.preventDefault();
                    cerrarPanel();
                }}
                onClick={(e) => {
                    if (e.target === dialogoRef.current) cerrarPanel();
                }}
            >
                <div className={estilos.cajaPanel}>
                    <header className={estilos.cabeceraPanel}>
                        <div>
                            <span className={estilos.etiquetaPanel}>
                                {editando
                                    ? `Editar ${nombreEntidad}`
                                    : esMarcas
                                        ? 'Nueva marca'
                                        : 'Nuevo rubro'}
                            </span>
                            <h2 id={idTituloPanel} className={estilos.tituloPanel}>
                                {editando ? editando.nombre : esMarcas ? 'Cargar marca' : 'Cargar rubro'}
                            </h2>
                        </div>
                        <button
                            type="button"
                            className={estilos.botonCerrar}
                            onClick={cerrarPanel}
                            disabled={guardando}
                            aria-label="Cerrar panel"
                        >
                            <IconoCerrar size={18} />
                        </button>
                    </header>

                    {errorFormulario && (
                        <div className={estilos.errorForm} role="alert">
                            <IconoEstadoError size={16} />
                            <span>{errorFormulario}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(alGuardar)} className={estilos.formulario} noValidate>
                        <div className={estilos.campo}>
                            <label htmlFor="abm-nombre" className={estilos.label}>
                                Nombre <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="abm-nombre"
                                type="text"
                                className={`${estilos.input} ${errors.nombre ? estilos.inputError : ''}`}
                                placeholder={esMarcas ? 'Ej. La Virginia' : 'Ej. Panificados artesanales'}
                                aria-invalid={errors.nombre ? 'true' : 'false'}
                                aria-describedby={errors.nombre ? 'error-abm-nombre' : undefined}
                                disabled={guardando}
                                {...register('nombre', {
                                    validate: (valor) => valor.trim() !== '' || `Ingresá el nombre ${esMarcas ? 'de la marca' : 'del rubro'}.`,
                                    maxLength: { value: 100, message: 'No puede superar los 100 caracteres.' },
                                })}
                            />
                            {errors.nombre && (
                                <p id="error-abm-nombre" className={estilos.mensajeError} role="alert">
                                    <IconoEstadoError size={14} />
                                    <span>{errors.nombre.message}</span>
                                </p>
                            )}
                        </div>

                        <div className={estilos.campo}>
                            <label htmlFor="abm-descripcion" className={estilos.label}>
                                Descripción (opcional)
                            </label>
                            <textarea
                                id="abm-descripcion"
                                rows={3}
                                className={`${estilos.textarea} ${errors.descripcion ? estilos.inputError : ''}`}
                                placeholder="Referencia breve para el equipo..."
                                aria-invalid={errors.descripcion ? 'true' : 'false'}
                                aria-describedby={errors.descripcion ? 'error-abm-desc' : undefined}
                                disabled={guardando}
                                {...register('descripcion', {
                                    maxLength: { value: 300, message: 'No puede superar los 300 caracteres.' },
                                })}
                            />
                            {errors.descripcion && (
                                <p id="error-abm-desc" className={estilos.mensajeError} role="alert">
                                    <IconoEstadoError size={14} />
                                    <span>{errors.descripcion.message}</span>
                                </p>
                            )}
                        </div>

                        {!esMarcas && (
                            <div className={estilos.campoToggle}>
                                <label htmlFor="abm-activo" className={estilos.toggleLabel}>
                                    <input
                                        id="abm-activo"
                                        type="checkbox"
                                        className={estilos.checkbox}
                                        disabled={guardando}
                                        {...register('activo')}
                                    />
                                    <span>
                                        <strong>Se ofrece al cargar productos</strong>
                                        <small>
                                            {activoWatch
                                                ? 'Estado actual: Sí, activo en el catálogo.'
                                                : 'Estado actual: No, pausado para nuevos productos.'}
                                        </small>
                                    </span>
                                </label>
                            </div>
                        )}

                        <div className={estilos.accionesForm}>
                            <button
                                type="button"
                                className={estilos.botonSecundario}
                                onClick={cerrarPanel}
                                disabled={guardando}
                            >
                                Cancelar
                            </button>
                            <button type="submit" className={estilos.botonPrincipal} disabled={guardando}>
                                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : `Crear ${nombreEntidad}`}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>

            <Confirmacion
                abierta={Boolean(objetivoEliminar)}
                titulo={`¿Eliminás ${esMarcas ? 'la marca' : 'el rubro'} "${objetivoEliminar?.nombre || ''}"?`}
                mensaje={
                    esMarcas
                        ? 'Se dará de baja esta marca si no tiene productos vigentes asociados.'
                        : 'Se dará de baja este rubro si no tiene productos vigentes asociados.'
                }
                textoConfirmar={eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                textoCancelar="Cancelar"
                onConfirmar={confirmarEliminacion}
                onCancelar={() => setObjetivoEliminar(null)}
                ocupado={eliminando}
                peligro
            />

            <BarraFlotante />
        </section>
    );
}

export default CatalogoAbm;
