import { useEffect, useState } from 'react';

const CLAVE_TAMANO = 'cafeto_tamano_texto';
const EVENTO_TAMANO = 'cafeto:tamano-cambio';

const leerPreferencia = () => {
    try {
        return localStorage.getItem(CLAVE_TAMANO) === 'grande';
    } catch {
        return false;
    }
};

const aplicarTamanoAlDocumento = (esGrande) => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.fontSize = esGrande ? '118%' : '100%';
};

aplicarTamanoAlDocumento(leerPreferencia());

export function useTamanoTexto() {
    const [esGrande, setEsGrande] = useState(leerPreferencia);

    useEffect(() => {
        aplicarTamanoAlDocumento(esGrande);

        const alCambiarTamano = (evento) => {
            if (typeof evento?.detail === 'boolean' && evento.detail !== esGrande) {
                setEsGrande(evento.detail);
            }
        };

        const alCambiarStorage = (evento) => {
            if (evento.key === CLAVE_TAMANO) {
                setEsGrande(evento.newValue === 'grande');
            }
        };

        window.addEventListener(EVENTO_TAMANO, alCambiarTamano);
        window.addEventListener('storage', alCambiarStorage);
        return () => {
            window.removeEventListener(EVENTO_TAMANO, alCambiarTamano);
            window.removeEventListener('storage', alCambiarStorage);
        };
    }, [esGrande]);

    const alternarTamano = () => {
        const nuevo = !esGrande;
        aplicarTamanoAlDocumento(nuevo);
        try {
            localStorage.setItem(CLAVE_TAMANO, nuevo ? 'grande' : 'normal');
        } catch {
            // Si el navegador bloquea localStorage, la preferencia sigue viva en la sesión actual.
        }
        setEsGrande(nuevo);
        window.dispatchEvent(new CustomEvent(EVENTO_TAMANO, { detail: nuevo }));
    };

    return { esGrande, alternarTamano };
}
