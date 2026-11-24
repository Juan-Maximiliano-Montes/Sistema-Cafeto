import { useEffect, useState } from 'react';

const CLAVE_TEMA = 'cafeto_tema';
const EVENTO_TEMA = 'cafeto:tema-cambio';

const normalizarTema = (valor) => (valor === 'claro' ? 'claro' : 'oscuro');

const leerTemaGuardado = () => {
    try {
        return normalizarTema(localStorage.getItem(CLAVE_TEMA));
    } catch {
        return 'oscuro';
    }
};

const aplicarTemaAlDocumento = (tema) => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-tema', tema);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute('content', tema === 'claro' ? '#F4F1EA' : '#121128');
    }
};

aplicarTemaAlDocumento(leerTemaGuardado());

export function useTema() {
    const [tema, setTema] = useState(leerTemaGuardado);

    useEffect(() => {
        aplicarTemaAlDocumento(tema);

        const alCambiarTema = (evento) => {
            if (evento?.detail && evento.detail !== tema) {
                setTema(normalizarTema(evento.detail));
            }
        };

        const alCambiarStorage = (evento) => {
            if (evento.key === CLAVE_TEMA) {
                setTema(normalizarTema(evento.newValue));
            }
        };

        window.addEventListener(EVENTO_TEMA, alCambiarTema);
        window.addEventListener('storage', alCambiarStorage);
        return () => {
            window.removeEventListener(EVENTO_TEMA, alCambiarTema);
            window.removeEventListener('storage', alCambiarStorage);
        };
    }, [tema]);

    const establecerTema = (nuevoTema) => {
        const valido = normalizarTema(nuevoTema);
        aplicarTemaAlDocumento(valido);
        try {
            localStorage.setItem(CLAVE_TEMA, valido);
        } catch {
            // Si el navegador bloquea localStorage, la preferencia sigue viva en esta sesión.
        }
        setTema(valido);
        window.dispatchEvent(new CustomEvent(EVENTO_TEMA, { detail: valido }));
    };

    const alternarTema = () => {
        establecerTema(tema === 'claro' ? 'oscuro' : 'claro');
    };

    return {
        tema,
        esClaro: tema === 'claro',
        alternarTema,
        establecerTema,
    };
}
