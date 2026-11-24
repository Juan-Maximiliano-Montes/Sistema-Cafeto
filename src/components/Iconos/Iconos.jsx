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
