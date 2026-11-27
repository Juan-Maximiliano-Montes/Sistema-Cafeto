import axios from 'axios';

const CLAVE_TOKEN = 'cafeto_token';
const CLAVE_USUARIO = 'cafeto_usuario';
const CLAVE_TUVO_SESION = 'cafeto_tuvo_sesion';
const CLAVE_RUTA_POST_LOGIN = 'cafeto_ruta_post_login';

let sesionVencidaNotificada = false;

export const EVENTO_SESION_VENCIDA = 'cafeto:sesion-vencida';

const URL_DJANGO_LOCAL = 'http://localhost:8000';
const SUFIJO_API_MOVIL = /\/api\/movil\/?$/i;
const sinBarraFinal = (url) => String(url || '').trim().replace(/\/+$/, '');

const API_URL_ENV = sinBarraFinal(import.meta.env.VITE_API_URL);
const DJANGO_WEB_ENV = sinBarraFinal(import.meta.env.VITE_DJANGO_WEB);

/**
 * Origen web de Django (imágenes /media/... y enlaces al panel completo).
 * Prioridad: VITE_DJANGO_WEB → derivado de VITE_API_URL (quitando /api/movil,
 * útil para el túnel HTTPS de Cloudflare en Vercel) → http://localhost:8000.
 */
const derivarOrigenDjango = (urlApi) => {
    if (!urlApi) return '';
    if (SUFIJO_API_MOVIL.test(urlApi)) return urlApi.replace(SUFIJO_API_MOVIL, '');
    try {
        return new URL(urlApi).origin;
    } catch {
        return ''; // URL relativa (p. ej. '/api/movil'): se usa el valor local por defecto.
    }
};

export const URL_WEB_DJANGO = DJANGO_WEB_ENV || derivarOrigenDjango(API_URL_ENV) || URL_DJANGO_LOCAL;

const USAR_PROXY = import.meta.env.VITE_USAR_PROXY === 'true';
export const URL_API_BASE = USAR_PROXY
    ? '/api/movil'
    : API_URL_ENV || `${URL_WEB_DJANGO}/api/movil`;

const apiClient = axios.create({
    baseURL: URL_API_BASE,
    timeout: 8000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const HOSTS_LOCALES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

const origenWebDjango = (() => {
    try {
        return new URL(URL_WEB_DJANGO);
    } catch {
        return null;
    }
})();

/**
 * Completa rutas de /media/ con el origen de Django. Si Django devuelve una URL
 * absoluta apuntando a localhost (o en http detrás del túnel HTTPS), se reescribe
 * al origen público configurado para que las fotos carguen desde Vercel.
 */
const resolverUrlMedia = (ruta) => {
    if (!ruta || typeof ruta !== 'string') return ruta;
    if (ruta.startsWith('data:') || ruta.startsWith('blob:')) return ruta;

    if (/^https?:\/\//i.test(ruta)) {
        if (USAR_PROXY || !origenWebDjango) return ruta;
        try {
            const url = new URL(ruta);
            const esLocal = HOSTS_LOCALES.has(url.hostname);
            const esMismoHost = url.host === origenWebDjango.host;
            const destinoEsLocal = HOSTS_LOCALES.has(origenWebDjango.hostname);
            if ((esLocal && !destinoEsLocal) || (esMismoHost && url.protocol !== origenWebDjango.protocol)) {
                return `${origenWebDjango.origin}${url.pathname}${url.search}${url.hash}`;
            }
        } catch {
            // URL mal formada: se devuelve tal cual.
        }
        return ruta;
    }

    if (USAR_PROXY) return ruta;
    return `${URL_WEB_DJANGO}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
};

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

export const tienePermiso = (usuario, codigo) =>
    Boolean(Array.isArray(usuario?.permisos) && usuario.permisos.includes(codigo));

export const esSesionVencida = () => sesionVencidaNotificada;

export const tuvoSesionPrevia = () => {
    try {
        return sessionStorage.getItem(CLAVE_TUVO_SESION) === '1';
    } catch {
        return false;
    }
};

export const limpiarSesion = () => {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
};

export const normalizarRutaPostLogin = (desde) => {
    let texto = '';
    if (typeof desde === 'string') {
        texto = desde.trim();
    } else if (desde && typeof desde === 'object' && typeof desde.pathname === 'string') {
        texto = `${desde.pathname}${desde.search || ''}${desde.hash || ''}`.trim();
    }

    if (!texto || !texto.startsWith('/') || texto.startsWith('//')) {
        return null;
    }

    const soloPath = texto.split('?')[0].split('#')[0];
    if (!soloPath || soloPath === '/' || soloPath === '/login') {
        return null;
    }

    return texto;
};

export const guardarRutaPostLogin = (desde) => {
    const ruta = normalizarRutaPostLogin(desde);
    if (!ruta) return;
    try {
        sessionStorage.setItem(CLAVE_RUTA_POST_LOGIN, ruta);
    } catch {
        // Si el navegador bloquea sessionStorage, continúa con location.state.
    }
};

export const obtenerRutaPostLogin = () => {
    try {
        return normalizarRutaPostLogin(sessionStorage.getItem(CLAVE_RUTA_POST_LOGIN));
    } catch {
        return null;
    }
};

export const limpiarRutaPostLogin = () => {
    try {
        sessionStorage.removeItem(CLAVE_RUTA_POST_LOGIN);
    } catch {
        // Ignora si sessionStorage no está disponible.
    }
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
            const pathnameActual = window.location.pathname || '/inicio';
            const rutaActual = `${pathnameActual}${window.location.search || ''}${window.location.hash || ''}`;
            const destino = normalizarRutaPostLogin(rutaActual) || '/inicio';
            if (!sesionVencidaNotificada && pathnameActual !== '/login') {
                sesionVencidaNotificada = true;
                guardarRutaPostLogin(destino);
                window.dispatchEvent(
                    new CustomEvent(EVENTO_SESION_VENCIDA, {
                        detail: {
                            desde: destino,
                        },
                    })
                );
            }
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

export const extraerErroresDeCampo = (error) => {
    const errores = error?.response?.data?.errores;
    if (!errores || typeof errores !== 'object') return null;

    const mapa = {};
    for (const [campo, detalle] of Object.entries(errores)) {
        const texto = primerTexto(detalle);
        if (texto) mapa[campo] = texto;
    }
    return Object.keys(mapa).length > 0 ? mapa : null;
};

export const mensajeDeError = (error, porDefecto = 'Algo salió mal. Probá de nuevo.') => {
    if (axios.isCancel(error)) return null;
    if (error.code === 'ECONNABORTED') {
        return 'El sistema central de Cafeto tardó demasiado en responder. Esperá unos segundos y probá de nuevo.';
    }
    const respuesta = error.response;
    const sinCuerpo = !respuesta?.data || (typeof respuesta.data === 'string' && !respuesta.data.trim());
    if (!respuesta || (respuesta.status >= 500 && sinCuerpo)) {
        return 'No pudimos conectarnos con el sistema central de Cafeto. Verificá tu conexión o intentá nuevamente en unos instantes.';
    }
    const texto = primerTexto(respuesta.data?.detail) || primerTexto(respuesta.data?.errores);
    if (texto) return texto;
    if (respuesta.status === 403) {
        return 'Tu perfil no tiene permiso para realizar esta acción.';
    }
    if (respuesta.status >= 500) {
        return 'El sistema central de Cafeto tuvo un inconveniente temporal. Intentá de nuevo en unos minutos.';
    }
    if (respuesta.status === 404) {
        return 'No encontramos la información solicitada en el sistema central de Cafeto.';
    }
    return porDefecto;
};

const extraerLista = (data) => {
    const lista = Array.isArray(data?.resultados)
        ? data.resultados
        : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data)
                ? data
                : [];
    return lista.filter((item) => item && typeof item === 'object');
};

export const loginUsuario = async (usuario, clave) => {
    try {
        const { data } = await apiClient.post('/sesion/', { usuario, clave });
        if (!data?.token) {
            throw new Error('El sistema central de Cafeto no pudo confirmar el inicio de sesión.');
        }
        sesionVencidaNotificada = false;
        localStorage.setItem(CLAVE_TOKEN, data.token);
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(data.usuario ?? null));
        try {
            sessionStorage.setItem(CLAVE_TUVO_SESION, '1');
        } catch {
            // Si el navegador bloquea sessionStorage, no interrumpe el login.
        }
        return data;
    } catch (error) {
        console.error('Error en el login:', error);
        const errorLanzado = new Error(
            error.isAxiosError
                ? mensajeDeError(error, 'No se pudo iniciar sesión.')
                : error.message
        );
        const erroresCampo = extraerErroresDeCampo(error);
        if (erroresCampo) errorLanzado.errores = erroresCampo;
        throw errorLanzado;
    }
};

export const logOutUsuario = async () => {
    try {
        if (haySesion()) {
            await apiClient.delete('/sesion/');
        }
    } catch (error) {
        console.warn('No se pudo cerrar la sesión remota; se cierra igual en este navegador.', error);
    } finally {
        sesionVencidaNotificada = false;
        limpiarRutaPostLogin();
        try {
            sessionStorage.removeItem(CLAVE_TUVO_SESION);
        } catch {
            // Ignora si sessionStorage no está disponible.
        }
        limpiarSesion();
    }
};

export const getRubrosCatalogo = async ({ seccion = 'CAFETERIA', signal } = {}) => {
    try {
        const { data } = await apiClient.get('/catalogo/rubros/', {
            params: { seccion },
            signal,
        });
        return {
            resultados: extraerLista(data),
            hayMas: Boolean(data?.hay_mas),
        };
    } catch (error) {
        if (!axios.isCancel(error)) console.error('Error al obtener rubros del catálogo:', error);
        throw error;
    }
};

export const getProductos = async ({ seccion = 'CAFETERIA', rubro = '', q = '', pagina = 1, signal } = {}) => {
    try {
        const { data } = await apiClient.get('/catalogo/productos/', {
            params: {
                seccion,
                rubro: rubro || undefined,
                q: q || undefined,
                pagina,
            },
            signal,
        });
        const resultados = extraerLista(data).map((item) => ({
            ...item,
            imagen: resolverUrlMedia(item?.imagen),
        }));
        return {
            resultados,
            hayMas: Boolean(data?.hay_mas),
        };
    } catch (error) {
        if (!axios.isCancel(error)) console.error('Error al obtener productos:', error);
        throw error;
    }
};

export const getProductosStock = async ({ q = '', codigo = '', pagina = 1, signal } = {}) => {
    try {
        const { data } = await apiClient.get('/stock/productos/', {
            params: {
                q: q || undefined,
                codigo: codigo || undefined,
                pagina,
            },
            signal,
        });
        const resultados = extraerLista(data).map((item) => ({
            ...item,
            imagen: resolverUrlMedia(item?.imagen),
        }));
        return {
            resultados,
            hayMas: Boolean(data?.hay_mas),
        };
    } catch (error) {
        if (!axios.isCancel(error)) console.error('Error al obtener productos de stock:', error);
        throw error;
    }
};

export const getLotesProducto = async (id, { signal } = {}) => {
    try {
        const { data } = await apiClient.get(`/stock/productos/${id}/lotes/`, { signal });
        return {
            resultados: extraerLista(data),
            hayMas: Boolean(data?.hay_mas),
        };
    } catch (error) {
        if (!axios.isCancel(error)) console.error('Error al obtener lotes del producto:', error);
        throw error;
    }
};

export const getMarcas = async ({ q = '', pagina = 1, signal } = {}) => {
    try {
        const { data } = await apiClient.get('/marcas/', {
            params: { q: q || undefined, pagina },
            signal,
        });
        return {
            resultados: extraerLista(data),
            hayMas: Boolean(data?.hay_mas),
        };
    } catch (error) {
        if (!axios.isCancel(error)) console.error('Error al obtener marcas:', error);
        throw error;
    }
};

export const crearMarca = async ({ nombre, descripcion = '' }) => {
    try {
        const { data } = await apiClient.post('/marcas/', { nombre, descripcion });
        return data;
    } catch (error) {
        console.error('Error al crear marca:', error);
        throw error;
    }
};

export const editarMarca = async (id, payload) => {
    try {
        const { data } = await apiClient.patch(`/marcas/${id}/`, payload);
        return data;
    } catch (error) {
        console.error('Error al editar marca:', error);
        throw error;
    }
};

export const eliminarMarca = async (id) => {
    try {
        await apiClient.delete(`/marcas/${id}/`);
        return true;
    } catch (error) {
        console.error('Error al eliminar marca:', error);
        throw error;
    }
};

export const getRubros = async ({ q = '', pagina = 1, signal } = {}) => {
    try {
        const { data } = await apiClient.get('/rubros/', {
            params: { q: q || undefined, pagina },
            signal,
        });
        return {
            resultados: extraerLista(data),
            hayMas: Boolean(data?.hay_mas),
        };
    } catch (error) {
        if (!axios.isCancel(error)) console.error('Error al obtener rubros:', error);
        throw error;
    }
};

export const crearRubro = async ({ nombre, descripcion = '', activo = true }) => {
    try {
        const { data } = await apiClient.post('/rubros/', { nombre, descripcion, activo });
        return data;
    } catch (error) {
        console.error('Error al crear rubro:', error);
        throw error;
    }
};

export const editarRubro = async (id, payload) => {
    try {
        const { data } = await apiClient.patch(`/rubros/${id}/`, payload);
        return data;
    } catch (error) {
        console.error('Error al editar rubro:', error);
        throw error;
    }
};

export const eliminarRubro = async (id) => {
    try {
        await apiClient.delete(`/rubros/${id}/`);
        return true;
    } catch (error) {
        console.error('Error al eliminar rubro:', error);
        throw error;
    }
};

export const getAlertasStock = async ({ tipo = 'TODAS', signal } = {}) => {
    try {
        const { data } = await apiClient.get('/stock/alertas/', {
            params: { tipo },
            signal,
        });
        return {
            resultados: extraerLista(data),
            hayMas: Boolean(data?.hay_mas),
        };
    } catch (error) {
        if (!axios.isCancel(error)) console.error('Error al obtener alertas de stock:', error);
        throw error;
    }
};

export const getAjustesStock = async ({ estado = 'PENDIENTE', signal } = {}) => {
    try {
        const { data } = await apiClient.get('/stock/ajustes/', {
            params: { estado },
            signal,
        });
        return {
            resultados: extraerLista(data),
            hayMas: Boolean(data?.hay_mas),
        };
    } catch (error) {
        if (!axios.isCancel(error)) console.error('Error al obtener ajustes de stock:', error);
        throw error;
    }
};

export const aprobarAjusteStock = async (id, observacion = '') => {
    try {
        const { data } = await apiClient.post(`/stock/ajustes/${id}/aprobar/`, { observacion });
        return data;
    } catch (error) {
        console.error('Error al aprobar ajuste de stock:', error);
        throw error;
    }
};

export const rechazarAjusteStock = async (id, observacion = '') => {
    try {
        const { data } = await apiClient.post(`/stock/ajustes/${id}/rechazar/`, { observacion });
        return data;
    } catch (error) {
        console.error('Error al rechazar ajuste de stock:', error);
        throw error;
    }
};

export const verificarSesion = async ({ signal } = {}) => {
    try {
        await apiClient.get('/panel/', { signal });
        return true;
    } catch (error) {
        if (!axios.isCancel(error)) console.error('No se pudo verificar la sesión:', error);
        throw error;
    }
};

export const getPanelDelDia = async ({ signal } = {}) => {
    try {
        const { data } = await apiClient.get('/panel/', { signal });
        return {
            indicadores: Array.isArray(data?.indicadores) ? data.indicadores : [],
            avisos: Array.isArray(data?.avisos) ? data.avisos : [],
        };
    } catch (error) {
        if (!axios.isCancel(error)) console.error('Error al obtener el panel del día:', error);
        throw error;
    }
};

export default apiClient;
