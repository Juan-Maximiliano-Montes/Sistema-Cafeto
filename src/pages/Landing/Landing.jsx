import { Link } from 'react-router-dom';
import { haySesion, URL_WEB_DJANGO } from '../../api/api';
import BarraFlotante from '../../components/BarraFlotante/BarraFlotante';
import {
    IconoEstadoOk,
    IconoEstrella,
    IconoExterno,
    IconoMinisuper,
    IconoTaza,
} from '../../components/Iconos/Iconos';
import fotoFachada from '../../assets/foto de fachada nocturna del local.jpg';
import fotoTaza from '../../assets/taza_amarrilla_humeante.jpg';
import capturaSistema from '../../assets/captura-sistema-cafeto.png';
import isologoNegativo from '../../assets/cafeto-isologotipo-negativo.svg';
import isotipoBlanco from '../../assets/cafeto-isotipo-blanco.svg';
import estilos from './Landing.module.css';

const PILARES = [
    {
        titulo: 'Cafetería artesanal',
        descripcion: 'Café recién molido, bebidas calientes y frías, desayunos y panificados listos para disfrutar en salón o llevar.',
        icono: <IconoTaza size={28} />,
    },
    {
        titulo: 'Minisúper de paso',
        descripcion: 'Bebidas, lácteos, fiambres, golosinas y productos esenciales de góndola ordenados por rubro y stock real.',
        icono: <IconoMinisuper size={28} />,
    },
    {
        titulo: 'Club Cafeto y beneficios',
        descripcion: 'Promociones activas, ofertas visibles en el catálogo y atención ágil pensada para cada cliente del barrio.',
        icono: <IconoEstrella size={28} />,
    },
];

const BENEFICIOS_SISTEMA = [
    {
        titulo: 'Catálogo y stock al día',
        detalle: 'Consultá precios, ofertas y disponibilidad de cafetería y minisúper sin buscar planillas ni preguntar por radio.',
    },
    {
        titulo: 'Control de cajas',
        detalle: 'Mirá cuántas cajas están abiertas hoy, lo vendido en el turno y el estado general en una sola pantalla.',
    },
    {
        titulo: 'Avisos claros',
        detalle: 'Alertas fáciles de leer con íconos, texto directo y acceso al sistema web cuando hace falta resolver algo.',
    },
];

function Landing() {
    const sesionActiva = haySesion();
    const rutaPrincipal = sesionActiva ? '/inicio' : '/login';
    const textoPrincipal = sesionActiva ? 'Ir a mi panel' : 'Ingresar al sistema';

    return (
        <div className={estilos.pagina}>
            <section
                className={estilos.hero}
                style={{ '--foto-fachada': `url("${fotoFachada}")` }}
                aria-labelledby="titulo-hero"
            >
                <div className={estilos.heroGrilla}>
                    <div className={estilos.heroTexto}>
                        <div className={estilos.marcoMarca}>
                            <img
                                src={isologoNegativo}
                                alt="Cafeto Las Lomitas"
                                className={estilos.isologo}
                            />
                        </div>

                        <span className={estilos.etiqueta}>Las Lomitas · Campo Quijano</span>

                        <h1 id="titulo-hero" className={estilos.tituloHero}>
                            Tu pausa de café y compras de todos los días, más simple y organizada
                        </h1>

                        <p className={estilos.subtituloHero}>
                            Un espacio cálido que combina cafetería de especialidad y minisúper de cercanía,
                            respaldado por un sistema claro para que cada turno trabaje con tranquilidad.
                        </p>

                        <div className={estilos.accionesHero}>
                            <Link to={rutaPrincipal} className={estilos.botonPrincipal}>
                                {textoPrincipal}
                            </Link>
                            <a href="#conocer-cafeto" className={estilos.botonSecundario}>
                                Conocer Cafeto
                            </a>
                        </div>
                    </div>

                    <figure className={estilos.heroFoto}>
                        <img
                            src={fotoTaza}
                            alt="Taza amarilla humeante de café recién servido frente al local de Cafeto"
                            className={estilos.imagenTaza}
                        />
                        <figcaption className={estilos.pieFoto}>
                            <span className={estilos.pieFotoTitulo}>Café de verdad, atención cercana</span>
                            <span className={estilos.pieFotoDetalle}>Salón abierto y minisúper equipado todos los días</span>
                        </figcaption>
                    </figure>
                </div>
            </section>

            <section id="conocer-cafeto" className={estilos.seccion} aria-labelledby="titulo-pilares">
                <header className={estilos.encabezadoSeccion}>
                    <span className={estilos.etiqueta}>Nuestra propuesta</span>
                    <h2 id="titulo-pilares" className={estilos.tituloSeccion}>
                        Qué encontrás en Cafeto
                    </h2>
                    <p className={estilos.bajadaSeccion}>
                        Todo pensado para resolver el desayuno, la merienda o las compras rápidas en un solo lugar.
                    </p>
                </header>

                <div className={estilos.grillaPilares}>
                    {PILARES.map((pilar) => (
                        <article key={pilar.titulo} className={estilos.tarjetaPilar}>
                            <span className={estilos.iconoPilar}>{pilar.icono}</span>
                            <h3 className={estilos.tituloTarjeta}>{pilar.titulo}</h3>
                            <p className={estilos.textoTarjeta}>{pilar.descripcion}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className={estilos.seccionSistema} aria-labelledby="titulo-sistema">
                <div className={estilos.sistemaGrilla}>
                    <div className={estilos.marcoCaptura}>
                        <div className={estilos.barraVentana} aria-hidden="true">
                            <span className={estilos.puntoVentana} />
                            <span className={estilos.puntoVentana} />
                            <span className={estilos.puntoVentana} />
                            <span className={estilos.tituloVentana}>Sistema Cafeto · Vista operativa</span>
                        </div>
                        <img
                            src={capturaSistema}
                            alt="Captura de pantalla del Sistema Cafeto mostrando sus módulos de Cafetería, Minisúper y Caja"
                            className={estilos.imagenCaptura}
                            loading="lazy"
                        />
                    </div>

                    <div className={estilos.sistemaContenido}>
                        <span className={estilos.etiqueta}>Herramienta del equipo</span>
                        <h2 id="titulo-sistema" className={estilos.tituloSeccion}>
                            El sistema por dentro
                        </h2>
                        <p className={estilos.bajadaSistema}>
                            Conectado en vivo con la base central de Django para que el personal consulte precios,
                            cajas y permisos desde cualquier pantalla sin complicaciones.
                        </p>

                        <ul className={estilos.listaBeneficios}>
                            {BENEFICIOS_SISTEMA.map((beneficio) => (
                                <li key={beneficio.titulo} className={estilos.beneficio}>
                                    <span className={estilos.iconoOk} aria-hidden="true">
                                        <IconoEstadoOk size={16} />
                                    </span>
                                    <div>
                                        <strong className={estilos.tituloBeneficio}>{beneficio.titulo}</strong>
                                        <p className={estilos.detalleBeneficio}>{beneficio.detalle}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className={estilos.accionFinal}>
                            <Link to={rutaPrincipal} className={estilos.botonPrincipal}>
                                {textoPrincipal}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className={estilos.seccionUbicacion} aria-labelledby="titulo-ubicacion">
                <div className={estilos.tarjetaUbicacion}>
                    <img
                        src={isotipoBlanco}
                        alt="Isotipo oficial de Cafeto"
                        className={estilos.isotipo}
                        loading="lazy"
                    />
                    <div className={estilos.textoUbicacion}>
                        <span className={estilos.etiqueta}>Dónde estamos</span>
                        <h2 id="titulo-ubicacion" className={estilos.tituloUbicacion}>
                            Las Lomitas, Campo Quijano, Salta
                        </h2>
                        <p className={estilos.detalleUbicacion}>
                            Portal de la Quebrada del Toro. Atención en salón, mostrador de minisúper y gestión web centralizada.
                        </p>
                    </div>
                    <a
                        href={URL_WEB_DJANGO}
                        target="_blank"
                        rel="noreferrer"
                        className={estilos.enlaceDjango}
                    >
                        <span>Ir al sistema web en Django</span>
                        <IconoExterno size={17} />
                    </a>
                </div>
            </section>

            <BarraFlotante />
        </div>
    );
}

export default Landing;
