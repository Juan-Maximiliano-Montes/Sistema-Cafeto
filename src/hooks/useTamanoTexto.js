import { useEffect, useState } from 'react';

const CLAVE_TAMANO = 'cafeto_tamano_texto';

const leerPreferencia = () => {
    try {
        return localStorage.getItem(CLAVE_TAMANO) === 'grande';
    } catch {
        return false;
    }
};

export function useTamanoTexto() {
    const [esGrande, setEsGrande] = useState(leerPreferencia);

    useEffect(() => {
        document.documentElement.style.fontSize = esGrande ? '118%' : '100%';
        try {
            localStorage.setItem(CLAVE_TAMANO, esGrande ? 'grande' : 'normal');
        } catch {
            // Si el navegador bloquea localStorage, la preferencia sigue viva en la sesión actual.
        }
    }, [esGrande]);

    const alternarTamano = () => setEsGrande((previo) => !previo);

    return { esGrande, alternarTamano };
}
