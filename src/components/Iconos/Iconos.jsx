const crearProps = (size = 28) => ({
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
});

export function IconoTaza({ size = 28 }) {
    return (
        <svg {...crearProps(size)}>
            <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
            <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
            <path d="M8 2.5c0 1 1 1.5 1 2.5S8 6.5 8 6.5M12 2.5c0 1 1 1.5 1 2.5s-1 1.5-1 1.5" />
            <path d="M3 21.5h14" />
        </svg>
    );
}

export function IconoCaja({ size = 28 }) {
    return (
        <svg {...crearProps(size)}>
            <rect x="3" y="10" width="18" height="10" rx="2" />
            <path d="M6 10V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5" />
            <path d="M9 7h6M7 14h2M11 14h2M15 14h2M7 17h10" />
        </svg>
    );
}

export function IconoUsuarios({ size = 28 }) {
    return (
        <svg {...crearProps(size)}>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
            <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.5A6.5 6.5 0 0 1 21.5 20" />
        </svg>
    );
}

export function IconoEstadoOk({ size = 14 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.4}>
            <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
        </svg>
    );
}

export function IconoEstadoError({ size = 14 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.4}>
            <path d="M6 6l12 12M18 6 6 18" />
        </svg>
    );
}

export function IconoEstadoAlerta({ size = 14 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.1}>
            <path d="M10.3 3.9 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9.5v4.5M12 17h.01" />
        </svg>
    );
}

export function IconoEstadoInfo({ size = 14 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.1}>
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 11.2v5.3M12 7.8h.01" />
        </svg>
    );
}

export function IconoVolver({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.2}>
            <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
    );
}

export function IconoActualizar({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.1}>
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
        </svg>
    );
}

export function IconoSubir({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.2}>
            <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
    );
}

export function IconoChevron({ size = 16 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.2}>
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

export function IconoExterno({ size = 16 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.1}>
            <path d="M14 4h6v6" />
            <path d="M10 14 20 4" />
            <path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
        </svg>
    );
}

export function IconoFiltro({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2}>
            <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
    );
}

export function IconoMinisuper({ size = 28 }) {
    return (
        <svg {...crearProps(size)}>
            <path d="M5 10h14l-1.4 8.5a2 2 0 0 1-2 1.7H8.4a2 2 0 0 1-2-1.7L5 10Z" />
            <path d="M8.5 10 10.5 4.5M15.5 10 13.5 4.5M3.5 10h17" />
            <path d="M10 14v3M14 14v3" />
        </svg>
    );
}

export function IconoEstrella({ size = 28 }) {
    return (
        <svg {...crearProps(size)}>
            <path d="m12 3.2 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3.2Z" />
        </svg>
    );
}

export function IconoReportes({ size = 28 }) {
    return (
        <svg {...crearProps(size)}>
            <path d="M4 19.5h16" />
            <rect x="6" y="12" width="3" height="5.5" rx="0.8" />
            <rect x="10.5" y="7.5" width="3" height="10" rx="0.8" />
            <rect x="15" y="4.5" width="3" height="13" rx="0.8" />
        </svg>
    );
}

export function IconoFlechaIzquierda({ size = 20 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.2}>
            <path d="m15 18-6-6 6-6" />
        </svg>
    );
}

export function IconoFlechaDerecha({ size = 20 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.2}>
            <path d="m9 6 6 6-6 6" />
        </svg>
    );
}

export function IconoPausa({ size = 16 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.2}>
            <rect x="6.5" y="5" width="3.5" height="14" rx="1" />
            <rect x="14" y="5" width="3.5" height="14" rx="1" />
        </svg>
    );
}

export function IconoReproducir({ size = 16 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.2}>
            <path d="m7 5 11 7-11 7V5Z" />
        </svg>
    );
}

export function IconoBuscar({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.1}>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.2 4.2" />
        </svg>
    );
}

export function IconoSol({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
    );
}

export function IconoLuna({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2}>
            <path d="M20.2 14.5A8.5 8.5 0 0 1 9.5 3.8a8.5 8.5 0 1 0 10.7 10.7Z" />
        </svg>
    );
}

export function IconoCampana({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2}>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8.5-3 8.5h18S18 15 18 8Z" />
            <path d="M13.7 20a2 2 0 0 1-3.4 0" />
        </svg>
    );
}

export function IconoStock({ size = 28 }) {
    return (
        <svg {...crearProps(size)}>
            <path d="M3.5 7.5 12 3l8.5 4.5-8.5 4.5-8.5-4.5Z" />
            <path d="M3.5 12 12 16.5l8.5-4.5" />
            <path d="M3.5 16.5 12 21l8.5-4.5" />
        </svg>
    );
}

export function IconoEtiqueta({ size = 28 }) {
    return (
        <svg {...crearProps(size)}>
            <path d="M4 12.2V5.5A1.5 1.5 0 0 1 5.5 4h6.7a1.5 1.5 0 0 1 1.06.44l6.3 6.3a1.5 1.5 0 0 1 0 2.12l-6.7 6.7a1.5 1.5 0 0 1-2.12 0l-6.3-6.3A1.5 1.5 0 0 1 4 12.2Z" />
            <circle cx="8.5" cy="8.5" r="1.2" />
        </svg>
    );
}

export function IconoGrilla({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2}>
            <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
            <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
            <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
            <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
        </svg>
    );
}

export function IconoLista({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2}>
            <path d="M9 6h11M9 12h11M9 18h11" />
            <circle cx="4.5" cy="6" r="1" fill="currentColor" />
            <circle cx="4.5" cy="12" r="1" fill="currentColor" />
            <circle cx="4.5" cy="18" r="1" fill="currentColor" />
        </svg>
    );
}

export function IconoEditar({ size = 17 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2}>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
    );
}

export function IconoEliminar({ size = 17 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2}>
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14" />
            <path d="M10 11v6M14 11v6" />
        </svg>
    );
}

export function IconoMas({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.2}>
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

export function IconoCerrar({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.2}>
            <path d="M6 6l12 12M18 6 6 18" />
        </svg>
    );
}

export function IconoCodigoBarras({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2}>
            <path d="M4 6v12M8 6v12M11 6v12M15 6v12M18 6v12M20 6v12" />
        </svg>
    );
}

export function IconoEscudo({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2}>
            <path d="M12 3 4.5 6v6c0 4.6 3.2 8.2 7.5 9.2 4.3-1 7.5-4.6 7.5-9.2V6L12 3Z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}

export function IconoLote({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2}>
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M8 3v4M16 3v4M4 10h16" />
            <path d="M8.5 14h3M8.5 17h7" />
        </svg>
    );
}

export function IconoInicio({ size = 20 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2}>
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V20a1 1 0 0 0 1 1h4.5v-5.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V21H18a1 1 0 0 0 1-1V9.5" />
        </svg>
    );
}

export function IconoSalir({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
        </svg>
    );
}

export function IconoColapsar({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.2}>
            <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" />
        </svg>
    );
}

export function IconoExpandir({ size = 18 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.2}>
            <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />
        </svg>
    );
}

export function IconoMenuMas({ size = 20 }) {
    return (
        <svg {...crearProps(size)} strokeWidth={2.2}>
            <circle cx="5" cy="12" r="1.2" fill="currentColor" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" />
            <circle cx="19" cy="12" r="1.2" fill="currentColor" />
        </svg>
    );
}
