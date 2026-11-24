const pesos = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

const numeros = new Intl.NumberFormat('es-AR');

export const formatearPesos = (valor) => pesos.format(Number(valor) || 0);

export const formatearNumero = (valor) => numeros.format(Number(valor) || 0);

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
