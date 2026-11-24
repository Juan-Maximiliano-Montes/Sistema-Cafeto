const pesos = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const numeros = new Intl.NumberFormat('es-AR');

const formatoFecha = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const formatoFechaHora = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

export const formatearPesos = (valor) => pesos.format(Number(valor) || 0);

export const formatearNumero = (valor) => numeros.format(Number(valor) || 0);

export const formatearFecha = (valor) => {
    if (!valor) return '—';
    const texto = String(valor).trim();
    const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
    if (soloFecha) {
        return `${soloFecha[3]}/${soloFecha[2]}/${soloFecha[1]}`;
    }
    const fecha = new Date(texto);
    if (Number.isNaN(fecha.getTime())) return texto;
    return formatoFecha.format(fecha);
};

export const formatearFechaHora = (valor) => {
    if (!valor) return '—';
    const texto = String(valor).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        return formatearFecha(texto);
    }
    const fecha = new Date(texto);
    if (Number.isNaN(fecha.getTime())) return texto;
    return formatoFechaHora.format(fecha);
};

export const normalizar = (texto) =>
    String(texto ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();

export const saludoSegunHora = (fecha = new Date()) => {
    const hora = fecha.getHours();
    if (hora >= 6 && hora < 13) return 'Buen día';
    if (hora >= 13 && hora < 20) return 'Buenas tardes';
    return 'Buenas noches';
};

const UNIDADES_MAPA = {
    UNIDAD: 'u.',
    UNIDADES: 'u.',
    U: 'u.',
    'U.': 'u.',
    UN: 'u.',
    'UN.': 'u.',
    UNI: 'u.',
    KG: 'kg',
    KILO: 'kg',
    KILOS: 'kg',
    KILOGRAMO: 'kg',
    KILOGRAMOS: 'kg',
    G: 'g',
    GR: 'g',
    GRAMO: 'g',
    GRAMOS: 'g',
    L: 'L',
    LT: 'L',
    LTS: 'L',
    LITRO: 'L',
    LITROS: 'L',
    ML: 'ml',
    MILILITRO: 'ml',
    MILILITROS: 'ml',
    CC: 'cc',
    PAQ: 'paq.',
    PAQUETE: 'paq.',
    PAQUETES: 'paq.',
    CAJA: 'cajas',
    CAJAS: 'cajas',
    DOCENA: 'doc.',
    DOCENAS: 'doc.',
};

export const formatearUnidad = (unidad) => {
    if (!unidad) return '';
    const limpio = String(unidad).trim();
    if (!limpio) return '';
    const clave = limpio.toUpperCase();
    return UNIDADES_MAPA[clave] || limpio.toLowerCase();
};

export const formatearCantidad = (valor, unidad) => {
    const numero = formatearNumero(valor);
    const unidadFormateada = formatearUnidad(unidad);
    return unidadFormateada ? `${numero} ${unidadFormateada}` : numero;
};
