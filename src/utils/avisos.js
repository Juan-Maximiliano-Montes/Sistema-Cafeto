import { URL_WEB_DJANGO } from '../api/api';
import { normalizar } from './formato';

const PALABRAS_PANEL_COMPLETO = ['pago', 'deuda', 'cierre', 'banco', 'sugerencia', 'orden', 'seguridad'];
const PALABRAS_STOCK = ['lote', 'minimo', 'stock', 'merma', 'venc'];

export function clasificarDestinoAviso(aviso) {
    const texto = normalizar(aviso?.texto || '');
    const destino = String(aviso?.destino || '').toUpperCase();

    if (PALABRAS_PANEL_COMPLETO.some((palabra) => texto.includes(palabra))) {
        return {
            tipo: 'externo',
            href: URL_WEB_DJANGO,
            etiqueta: 'Resolver en el panel completo',
        };
    }

    if (destino === 'AJUSTES' || texto.includes('ajuste') || texto.includes('autorizaci')) {
        return {
            tipo: 'interno',
            to: '/stock',
            state: { pestana: 'AUTORIZACIONES' },
            etiqueta: 'Revisar autorizaciones',
        };
    }

    if (destino === 'STOCK' || PALABRAS_STOCK.some((palabra) => texto.includes(palabra))) {
        return {
            tipo: 'interno',
            to: '/stock',
            state: { pestana: 'ALERTAS' },
            etiqueta: 'Ver alertas de stock',
        };
    }

    if (destino === 'WEB') {
        return {
            tipo: 'externo',
            href: URL_WEB_DJANGO,
            etiqueta: 'Resolver en el panel completo',
        };
    }

    return null;
}
