import { Link } from 'react-router-dom';
import { haySesion, URL_WEB_DJANGO } from '../../api/api';
import { useTema } from '../../hooks/useTema';
import BarraFlotante from '../../components/BarraFlotante/BarraFlotante';
import VistaModulos from '../../components/VistaModulos/VistaModulos';
import {
    IconoEscudo,
    IconoEstadoOk,
    IconoExterno,
    IconoLote,
    IconoTaza,
} from '../../components/Iconos/Iconos';
import fotoFachada from '../../assets/foto de fachada nocturna del local.jpg';
import isotipoBlanco from '../../assets/cafeto-isotipo-blanco.svg';
import isotipoNegro from '../../assets/cafeto-isotipo-negro.svg';
import estilos from './Landing.module.css';

const PILARES_OPERATIVOS = [
    {
        titulo: 'Productos y vencimientos al día',
        descripcion: 'Consultá precios de Cafetería y Minisúper, buscá por código de barras y mirá qué vence primero.',
        icono: <IconoLote size={24} />,
    },
    {
        titulo: 'Control de ajustes y alertas',
        descripcion: 'Detectá productos vencidos o con stock bajo y aprobá o rechazá ajustes pendientes con doble control.',
        icono: <IconoEscudo size={24} />,
    },
    {
        titulo: 'Pensado para el ritmo del turno',
        descripcion: 'Lectura cómoda en tema oscuro o claro, letras ampliables y estados claros con íconos y texto directo.',
        icono: <IconoTaza size={24} />,
    },
];

function Landing() {
    const sesionActiva = haySesion();
    const { esClaro } = useTema();
    const rutaPrincipal = sesionActiva ? '/inicio' : '/login';
    const textoPrincipal = sesionActiva ? 'Ir a mi panel' : 'Ingresar al turno';
    const isotipo = esClaro ? isotipoNegro : isotipoBlanco;

    return (
        <div className={estilos.pagina}>
            <section className={estilos.hero} aria-labelledby="titulo-hero">
                <div className={estilos.heroGrilla}>
                    <div className={estilos.heroTexto}>
                        <span className={estilos.etiqueta}>Sistema del equipo · Cafeto Las Lomitas</span>

                        <h1 id="titulo-hero" className={estilos.tituloHero}>
                            La herramienta diaria para organizar tu turno sin vueltas
                        </h1>

                        <p className={estilos.subtituloHero}>
                            La herramienta diaria para el equipo de mostrador, depósito y caja: consultá precios, revisá
                            qué vence primero, seguí las alertas de stock y chequeá los movimientos del día sin dar vueltas.
                        </p>

                        <div className={estilos.accionesHero}>
                            <Link to={rutaPrincipal} className={estilos.botonPrincipal}>
                                {textoPrincipal}
                            </Link>
                            <a href="#modulos-sistema" className={estilos.botonSecundario}>
                                Recorrer módulos
                            </a>
                        </div>
                    </div>

                    <figure className={estilos.heroFoto}>
                        <div className={estilos.marcoFachada}>
                            <img
                                src={fotoFachada}
                                alt="Fachada nocturna iluminada del local Cafeto Las Lomitas en Campo Quijano"
                                className={estilos.imagenFachada}
                            />
                            <div className={estilos.pildoraFoto}>
                                <span className={estilos.puntoEnLinea} aria-hidden="true">
                                    <IconoEstadoOk size={10} />
                                </span>
                                <span>En línea · Las Lomitas, Campo Quijano</span>
                            </div>
                        </div>
                        <figcaption className={estilos.pieFoto}>
                            <span className={estilos.pieFotoTitulo}>Las Lomitas · Campo Quijano</span>
                            <span className={estilos.pieFotoDetalle}>Cafetería, minisúper y control diario del mostrador</span>
                        </figcaption>
                    </figure>
                </div>
            </section>

            <section id="modulos-sistema" className={estilos.seccionDividida} aria-labelledby="titulo-modulos">
                <header className={estilos.encabezadoSeccion}>
                    <span className={estilos.etiqueta}>Recorrido interactivo</span>
                    <h2 id="titulo-modulos" className={estilos.tituloSeccion}>
                        Probá qué podés resolver en cada módulo
                    </h2>
                    <p className={estilos.bajadaSeccion}>
                        Elegí una pestaña y tocá los controles de muestra para ver cómo funciona cada parte del sistema.
                    </p>
                </header>

                <VistaModulos />
            </section>

            <section className={estilos.seccionDividida} aria-labelledby="titulo-pilares">
                <header className={estilos.encabezadoSeccion}>
                    <span className={estilos.etiqueta}>Trabajo diario</span>
                    <h2 id="titulo-pilares" className={estilos.tituloSeccion}>
                        Hecho para trabajar sin vueltas
                    </h2>
                </header>

                <div className={estilos.grillaPilares}>
                    {PILARES_OPERATIVOS.map((pilar) => (
                        <article key={pilar.titulo} className={estilos.pilar}>
                            <span className={estilos.iconoPilar}>{pilar.icono}</span>
                            <h3 className={estilos.tituloPilar}>{pilar.titulo}</h3>
                            <p className={estilos.textoPilar}>{pilar.descripcion}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className={estilos.franjaInstitucional} aria-labelledby="titulo-ubicacion">
                <div className={estilos.bloqueInstitucional}>
                    <img
                        src={isotipo}
                        alt="Isotipo oficial de Cafeto"
                        className={estilos.isotipo}
                        loading="lazy"
                    />
                    <div className={estilos.textoUbicacion}>
                        <span className={estilos.etiqueta}>Un solo lugar para el equipo</span>
                        <h2 id="titulo-ubicacion" className={estilos.tituloUbicacion}>
                            Cafeto Las Lomitas, Campo Quijano, Salta
                        </h2>
                        <p className={estilos.detalleUbicacion}>
                            ¿Necesitás emitir comprobantes, hacer arqueos de caja o dar de alta personal? Entrá al panel completo en otra pestaña.
                        </p>
                    </div>
                    <div className={estilos.accionesFinales}>
                        <Link to={rutaPrincipal} className={estilos.botonPrincipal}>
                            {textoPrincipal}
                        </Link>
                        <a
                            href={URL_WEB_DJANGO}
                            target="_blank"
                            rel="noreferrer"
                            className={estilos.enlacePanelWeb}
                        >
                            <span>Abrir panel completo de Cafeto</span>
                            <IconoExterno size={17} />
                        </a>
                    </div>
                </div>
            </section>

            <BarraFlotante />
        </div>
    );
}

export default Landing;
