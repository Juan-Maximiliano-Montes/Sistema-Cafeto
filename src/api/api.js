import axios from 'axios';

const CLAVE_TOKEN = 'cafeto_token';
const CLAVE_USUARIO = 'cafeto_usuario';

export const EVENTO_SESION_VENCIDA = 'cafeto:sesion-vencida';
export const URL_WEB_DJANGO = import.meta.env.VITE_DJANGO_WEB || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: '/api/movil',
    timeout: 8000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getToken = () => localStorage.getItem(CLAVE_TOKEN);

export const haySesion = () => Boolean(getToken());

export const getUsuarioActual = () => {
    try {
        const usuario = localStorage.getItem(CLAVE_USUARIO);
        return usuario ? JSON.parse(usuario) : null;
    } catch {
        return null;
    }
};

const limpiarSesion = () => {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
};

apiClient.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (respuesta) => respuesta,
    (error) => {
        const estado = error.response?.status;
        const esIngreso = (error.config?.url || '').startsWith('/sesion/');
        if (estado === 401 && !esIngreso && haySesion()) {
            limpiarSesion();
            window.dispatchEvent(new Event(EVENTO_SESION_VENCIDA));
        }
        return Promise.reject(error);
    }
);

const primerTexto = (valor) => {
    if (typeof valor === 'string') return valor;
    if (Array.isArray(valor)) return primerTexto(valor[0]);
    if (valor && typeof valor === 'object') return primerTexto(Object.values(valor)[0]);
    return null;
};

export const mensajeDeError = (error, porDefecto = 'Algo salió mal. Probá de nuevo.') => {
    if (axios.isCancel(error)) return null;
    if (error.code === 'ECONNABORTED') {
        return 'Django tardó demasiado en responder. Esperá unos segundos y probá de nuevo.';
    }
    const respuesta = error.response;
    const sinCuerpo = !respuesta?.data || (typeof respuesta.data === 'string' && !respuesta.data.trim());
    if (!respuesta || (respuesta.status >= 500 && sinCuerpo)) {
        return 'No me pude conectar con Django. Fijate que Docker esté levantado (docker compose up -d) y que http://localhost:8000 abra en el navegador.';
    }
    const texto = primerTexto(respuesta.data?.detail) || primerTexto(respuesta.data?.errores);
    if (texto) return texto;
    if (respuesta.status >= 500) {
        return `Django respondió con un error interno (${respuesta.status}). Mirá qué pasó con: docker compose logs web`;
    }
    if (respuesta.status === 404) {
        return 'Esa dirección no existe en la API de Django (404).';
    }
    return porDefecto;
};

export const loginUsuario = async (usuario, clave) => {
    try {
        const { data } = await apiClient.post('/sesion/', { usuario, clave });
        if (!data?.token) {
            throw new Error('Django no devolvió el token de la sesión.');
        }
        localStorage.setItem(CLAVE_TOKEN, data.token);
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(data.usuario));
        return data;
    } catch (error) {
        console.error('Error en el login contra Django:', error);
        throw new Error(error.isAxiosError
            ? mensajeDeError(error, 'No se pudo iniciar sesión.')
            : error.message);
    }
};

export const logOutUsuario = async () => {
    try {
        if (haySesion()) {
            await apiClient.delete('/sesion/');
        }
    } catch (error) {
        console.warn('No se pudo cerrar la sesión en Django; se cierra igual en este navegador.', error);
    } finally {
        limpiarSesion();
    }
};

export const getProductos = async ({ seccion = 'CAFETERIA', q = '', pagina = 1, signal } = {}) => {
    try {
        const { data } = await apiClient.get('/catalogo/productos/', {
            params: { seccion, q: q || undefined, pagina },
            signal,
        });
        return {
            resultados: Array.isArray(data?.resultados) ? data.resultados : [],
            hayMas: Boolean(data?.hay_mas),
        };
    } catch (error) {
        if (!axios.isCancel(error)) console.error('Error al obtener productos:', error);
        throw error;
    }
};

export const verificarSesion = async () => {
    try {
        await apiClient.get('/panel/');
        return true;
    } catch (error) {
        console.error('No se pudo verificar la sesión con Django:', error);
        throw error;
    }
};

export const getPanelDelDia = async () => {
    try {
        const { data } = await apiClient.get('/panel/');
        return {
            indicadores: Array.isArray(data?.indicadores) ? data.indicadores : [],
            avisos: Array.isArray(data?.avisos) ? data.avisos : [],
        };
    } catch (error) {
        console.error('Error al obtener el panel del día desde Django:', error);
        throw error;
    }
};

export default apiClient;
