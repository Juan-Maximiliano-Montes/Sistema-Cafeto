import { useRef, useState } from 'react';
import {
    IconoActualizar,
    IconoCaja,
    IconoCampana,
    IconoCodigoBarras,
    IconoEstadoAlerta,
    IconoEstadoError,
    IconoEstadoOk,
    IconoEtiqueta,
    IconoLote,
    IconoStock,
    IconoTaza,
} from '../Iconos/Iconos';
import estilos from './VistaModulos.module.css';

const PESTAÑAS_POR_DEFECTO = [
    {
        id: 'catalogo-stock',
        titulo: 'Productos y vencimientos',
        icono: IconoTaza,
        etiqueta: 'Mostrador y depósito',
        resumen: 'Consultá precios vigentes, ofertas y vencimientos por orden de salida sin perder tiempo.',
        acciones: [
            'Buscá productos por nombre o leyendo el código de barras.',
            'Filtrá al instante entre Cafetería, Minisúper o Stock interno.',
            'Revisá qué lote vence primero para sacarlo antes en el mostrador.',
        ],
        vistaPrevia: {
            cabecera: 'Stock interno · Búsqueda operativa',
            tipo: 'catalogo',
        },
    },
    {
        id: 'alertas-autorizaciones',
        titulo: 'Alertas y autorizaciones',
        icono: IconoStock,
        etiqueta: 'Control de turno',
        resumen: 'Detectá productos vencidos o con stock bajo y resolvé ajustes pendientes con doble control.',
        acciones: [
            'Filtrá alertas de stock bajo, sin stock, por vencer o vencidos.',
            'Controlá cada renglón del ajuste: teórico, contado y diferencia.',
            'Aprobá o rechazá con observación obligatoria para auditoría.',
        ],
        vistaPrevia: {
            cabecera: 'Stock · Alertas y autorizaciones',
            tipo: 'stock',
        },
    },
    {
        id: 'marcas-rubros',
        titulo: 'Marcas y rubros',
        icono: IconoEtiqueta,
        etiqueta: 'Organización del catálogo',
        resumen: 'Creá, editá o activá marcas y rubros del negocio directamente desde el navegador.',
        acciones: [
            'Alta y edición ágil con validación de campos al instante.',
            'Activá o pausá rubros en un clic según se ofrezcan al cargar productos.',
            'Baja protegida: avisa si todavía hay productos vigentes asociados.',
        ],
        vistaPrevia: {
            cabecera: 'Catálogo · Marcas y rubros',
            tipo: 'abm',
        },
    },
    {
        id: 'cajas-reportes',
        titulo: 'Cajas y reportes',
        icono: IconoCaja,
        etiqueta: 'Seguimiento del día',
        resumen: 'Mirá cuántas cajas están abiertas, lo recaudado en el turno y la radiografía del catálogo.',
        acciones: [
            'Estado en vivo de cajas registradoras e indicadores del día.',
            'Avisos del turno priorizados entre urgentes y de atención.',
            'Distribución por rubro, rango de precios y cobertura de stock.',
        ],
        vistaPrevia: {
            cabecera: 'Cajas y reportes · Resumen del turno',
            tipo: 'reportes',
        },
    },
];

const PRODUCTOS_DEMO = [
    {
        codigo: '7790895001234',
        categoria: 'Minisúper · Lácteos',
        nombre: 'Yogur entero bebible 1 L',
        stock: 'Stock: 18 u. (mínimo 6)',
        lote: 'Lote #L-2409 · Sale primero',
        detalleLote: 'Vence en 5 días · 6 u.',
    },
    {
        codigo: '7791234005678',
        categoria: 'Cafetería · Insumos',
        nombre: 'Leche entera larga vida 1 L',
        stock: 'Stock: 24 u. (mínimo 10)',
        lote: 'Lote #L-2514 · Sale primero',
        detalleLote: 'Vence en 11 días · 12 u.',
    },
];

function PreviewCatalogo() {
    const [indiceDemo, setIndiceDemo] = useState(0);
    const [escaneado, setEscaneado] = useState(false);

    const producto = PRODUCTOS_DEMO[indiceDemo];

    const simularEscaneo = () => {
        if (!escaneado) {
            setEscaneado(true);
            return;
        }
        setIndiceDemo((prev) => (prev + 1) % PRODUCTOS_DEMO.length);
    };

    return (
        <div className={estilos.maqueta}>
            <div className={estilos.maquetaBarra}>
                <button
                    type="button"
                    className={estilos.maquetaBtnPrimario}
                    onClick={simularEscaneo}
                >
                    <IconoCodigoBarras size={15} />
                    <span>{escaneado ? 'Escanear otro código' : 'Simular escaneo de código'}</span>
                </button>
                {escaneado ? (
                    <span className={estilos.maquetaPill}>
                        <IconoCodigoBarras size={14} />
                        <span>{producto.codigo}</span>
                    </span>
                ) : (
                    <span className={estilos.maquetaTag}>Mostrador · Leche y lácteos</span>
                )}
            </div>

            <div className={estilos.maquetaLista}>
                <div className={estilos.maquetaFila}>
                    <div>
                        <strong>{producto.nombre}</strong>
                        <span>{producto.categoria} · {producto.stock}</span>
                    </div>
                    <span className={estilos.maquetaBadgeOk}>
                        <IconoEstadoOk size={13} />
                        <span>Disponible</span>
                    </span>
                </div>

                {escaneado ? (
                    <div className={`${estilos.maquetaFila} ${estilos.maquetaAnimada}`}>
                        <div>
                            <strong>{producto.lote}</strong>
                            <span>{producto.detalleLote}</span>
                        </div>
                        <span className={estilos.maquetaBadgeAviso}>
                            <IconoLote size={13} />
                            <span>Qué vence primero</span>
                        </span>
                    </div>
                ) : (
                    <p className={estilos.maquetaSugerencia}>
                        Tocá &quot;Simular escaneo de código&quot; para ver el lote más próximo a vencer.
                    </p>
                )}
            </div>
        </div>
    );
}

function PreviewStock() {
    const [estadoDemo, setEstadoDemo] = useState('PENDIENTE');

    return (
        <div className={estilos.maqueta}>
            <div className={estilos.maquetaBarra}>
                <span className={estilos.maquetaBadgeError}>
                    <IconoEstadoError size={13} />
                    <span>Vencido · 1 lote</span>
                </span>
                <span className={estilos.maquetaBadgeAviso}>
                    <IconoEstadoAlerta size={13} />
                    <span>Stock bajo · 3</span>
                </span>
            </div>

            <div className={estilos.maquetaAjuste}>
                <div className={estilos.maquetaAjusteCabecera}>
                    <strong>Ajuste por conteo #48</strong>
                    <span>Cargado por encargado de turno</span>
                </div>
                <p className={estilos.maquetaDetalle}>
                    Café en grano 1 kg: teórico 12 · contado 11 · diferencia -1
                </p>

                {estadoDemo === 'PENDIENTE' ? (
                    <div className={estilos.maquetaBotones}>
                        <button
                            type="button"
                            className={estilos.maquetaBtnPrimario}
                            onClick={() => setEstadoDemo('APROBADO')}
                        >
                            Aprobar con nota
                        </button>
                        <button
                            type="button"
                            className={estilos.maquetaBtnSecundario}
                            onClick={() => setEstadoDemo('RECHAZADO')}
                        >
                            Rechazar
                        </button>
                    </div>
                ) : (
                    <div className={`${estilos.maquetaResultado} ${estilos.maquetaAnimada}`}>
                        <span
                            className={
                                estadoDemo === 'APROBADO' ? estilos.maquetaBadgeOk : estilos.maquetaBadgeError
                            }
                        >
                            {estadoDemo === 'APROBADO' ? <IconoEstadoOk size={13} /> : <IconoEstadoError size={13} />}
                            <span>{estadoDemo === 'APROBADO' ? '✓ Aprobado' : '✕ Rechazado'}</span>
                        </span>
                        <button
                            type="button"
                            className={estilos.maquetaBtnReiniciar}
                            onClick={() => setEstadoDemo('PENDIENTE')}
                        >
                            <IconoActualizar size={14} />
                            <span>Reiniciar demo</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function PreviewAbm() {
    const [rubros, setRubros] = useState([
        { id: 1, nombre: 'Panificados artesanales', activo: true },
        { id: 2, nombre: 'Infusiones de especialidad', activo: true },
    ]);

    const alternarRubro = (id) => {
        setRubros((lista) =>
            lista.map((r) => (r.id === id ? { ...r, activo: !r.activo } : r))
        );
    };

    const activos = rubros.filter((r) => r.activo).length;

    return (
        <div className={estilos.maqueta}>
            <div className={estilos.maquetaBarra}>
                <span className={estilos.maquetaTag}>
                    {activos} de {rubros.length} activos · Tocá para cambiar
                </span>
            </div>
            <div className={estilos.maquetaLista}>
                {rubros.map((rubro) => (
                    <div key={rubro.id} className={estilos.maquetaFila}>
                        <div>
                            <strong>{rubro.nombre}</strong>
                            <span>
                                {rubro.activo
                                    ? 'Se ofrece al cargar productos'
                                    : 'Pausado para nuevos productos'}
                            </span>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={rubro.activo}
                            onClick={() => alternarRubro(rubro.id)}
                            className={`${estilos.maquetaSwitch} ${
                                rubro.activo ? estilos.maquetaBadgeOk : estilos.maquetaBadgeAviso
                            }`}
                        >
                            {rubro.activo ? <IconoEstadoOk size={13} /> : <IconoEstadoAlerta size={13} />}
                            <span>{rubro.activo ? 'Activo' : 'Pausado'}</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PreviewReportes() {
    return (
        <div className={estilos.maqueta}>
            <div className={estilos.maquetaMetricas}>
                <div className={estilos.maquetaMetrica}>
                    <span>Cajas abiertas</span>
                    <strong>2 activas</strong>
                </div>
                <div className={estilos.maquetaMetrica}>
                    <span>Avisos del turno</span>
                    <strong>
                        <IconoCampana size={15} /> 4 para revisar
                    </strong>
                </div>
            </div>
            <div className={estilos.maquetaBarras}>
                <div className={estilos.maquetaBarraDato}>
                    <div className={estilos.maquetaBarraTexto}>
                        <span>Cafetería</span>
                        <strong>68%</strong>
                    </div>
                    <div className={estilos.maquetaPista}>
                        <span className={estilos.maquetaRelleno70} />
                    </div>
                </div>
                <div className={estilos.maquetaBarraDato}>
                    <div className={estilos.maquetaBarraTexto}>
                        <span>Minisúper</span>
                        <strong>88%</strong>
                    </div>
                    <div className={estilos.maquetaPista}>
                        <span className={estilos.maquetaRelleno90} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ContenidoPreview({ modulo }) {
    if (modulo.imagen) {
        return (
            <div className={estilos.marcoCaptura}>
                <img src={modulo.imagen} alt={modulo.altImagen || modulo.titulo} className={estilos.captura} />
            </div>
        );
    }

    const tipo = modulo.vistaPrevia?.tipo;
    if (tipo === 'catalogo') return <PreviewCatalogo />;
    if (tipo === 'stock') return <PreviewStock />;
    if (tipo === 'abm') return <PreviewAbm />;
    return <PreviewReportes />;
}

function VistaModulos({ modulos = PESTAÑAS_POR_DEFECTO }) {
    const [activaId, setActivaId] = useState(modulos[0]?.id);
    const botonesRef = useRef([]);

    const indiceActual = Math.max(0, modulos.findIndex((m) => m.id === activaId));
    const moduloActivo = modulos[indiceActual] || modulos[0];

    const seleccionarPorIndice = (nuevoIndice) => {
        const total = modulos.length;
        const indiceSeguro = ((nuevoIndice % total) + total) % total;
        setActivaId(modulos[indiceSeguro].id);
        botonesRef.current[indiceSeguro]?.focus();
    };

    const manejarTeclado = (evento, indice) => {
        if (evento.key === 'ArrowRight') {
            evento.preventDefault();
            seleccionarPorIndice(indice + 1);
        } else if (evento.key === 'ArrowLeft') {
            evento.preventDefault();
            seleccionarPorIndice(indice - 1);
        } else if (evento.key === 'Home') {
            evento.preventDefault();
            seleccionarPorIndice(0);
        } else if (evento.key === 'End') {
            evento.preventDefault();
            seleccionarPorIndice(modulos.length - 1);
        }
    };

    if (!moduloActivo) return null;

    return (
        <div className={estilos.contenedor}>
            <div className={estilos.pestanas} role="tablist" aria-label="Módulos operativos de Cafeto">
                {modulos.map((modulo, indice) => {
                    const seleccionada = modulo.id === moduloActivo.id;
                    const Icono = modulo.icono;
                    return (
                        <button
                            key={modulo.id}
                            ref={(el) => {
                                botonesRef.current[indice] = el;
                            }}
                            type="button"
                            role="tab"
                            id={`tab-${modulo.id}`}
                            aria-selected={seleccionada}
                            aria-controls={`panel-${modulo.id}`}
                            tabIndex={seleccionada ? 0 : -1}
                            className={`${estilos.pestana} ${seleccionada ? estilos.pestanaActiva : ''}`}
                            onClick={() => setActivaId(modulo.id)}
                            onKeyDown={(e) => manejarTeclado(e, indice)}
                        >
                            {Icono && <Icono size={18} />}
                            <span>{modulo.titulo}</span>
                        </button>
                    );
                })}
            </div>

            <div
                key={moduloActivo.id}
                role="tabpanel"
                id={`panel-${moduloActivo.id}`}
                aria-labelledby={`tab-${moduloActivo.id}`}
                className={estilos.panel}
            >
                <div className={estilos.columnaInfo}>
                    <span className={estilos.etiquetaPanel}>{moduloActivo.etiqueta}</span>
                    <h3 className={estilos.tituloPanel}>{moduloActivo.titulo}</h3>
                    <p className={estilos.resumenPanel}>{moduloActivo.resumen}</p>
                    <ul className={estilos.listaAcciones}>
                        {moduloActivo.acciones.map((accion) => (
                            <li key={accion} className={estilos.itemAccion}>
                                <span className={estilos.iconoOk} aria-hidden="true">
                                    <IconoEstadoOk size={14} />
                                </span>
                                <span>{accion}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={estilos.columnaPreview}>
                    <span className={estilos.cabeceraPreview}>
                        {moduloActivo.vistaPrevia?.cabecera || moduloActivo.titulo}
                    </span>
                    <ContenidoPreview modulo={moduloActivo} />
                </div>
            </div>
        </div>
    );
}

export default VistaModulos;
