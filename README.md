# Sistema Cafeto

## Descripción
Sistema Cafeto es una plataforma integral diseñada para optimizar la gestión combinada de cafetería y minisúper, agilizando la atención al cliente y el control de inventarios.

![Vista previa del sistema](./src/assets/captura-sistema-cafeto.png)

## Tecnologías utilizadas

| Requisito de la consigna | Cómo se cumple |
|---|---|
| **React** (SPA) | React 19 con componentes funcionales y hooks; carga diferida de páginas con `lazy` + `Suspense`. |
| **Vite** | Servidor de desarrollo y build de producción (`npm run dev` / `npm run build`). |
| **React Router DOM** | Rutas estáticas (`/`, `/login`, `/inicio`, `/productos`, `/catalogo`, `/stock`...) y dinámicas (`/productos/:id`), rutas protegidas y página 404. |
| **React Hook Form** | Formularios validados en Login y en el ABM de Catálogo (requeridos, longitudes máximas, errores del servidor por campo). |
| **CRUD completo** | Marcas y Rubros en `CatalogoAbm` (alta, lectura, edición y baja); lectura y detalle de productos en `Productos` y `DetalleProducto`. |
| **Bootstrap 5 + CSS personalizado** | Bootstrap aporta grilla (`container`, `row`, `col-*`), `table` / `table-responsive`, `form-control`, `form-select`, `form-check-input`, `btn`, `badge`, `alert`, `navbar` y utilidades; la identidad visual (sistema "Cafeto × iRiS", tema oscuro/claro y diseño responsivo) vive en tokens CSS (`src/index.css`) y CSS Modules por componente. |
| **Axios** | Cliente único en `src/api/api.js` con interceptores (token y sesión vencida). |

### Cómo conviven Bootstrap y el diseño propio

- `src/styles/bootstrap.css` importa `bootstrap/dist/css/bootstrap.min.css` dentro de una **capa CSS** (`@layer bootstrap`). Las reglas sin capa (tokens de `index.css` y CSS Modules) siempre ganan, así Bootstrap nunca pisa colores, bordes ni el foco accesible.
- `src/index.css` mapea las variables de Bootstrap (`--bs-body-bg`, `--bs-body-color`, `--bs-border-color`, `--bs-link-color`, `--bs-table-*`, etc.) a los tokens `--cf-*` en **ambos temas**, neutraliza el *Reboot* en elementos sueltos (títulos, párrafos, listas) y elimina el halo azul de foco de Bootstrap.

## Integrantes
- Aramayo, Camila Anahí
- Espinosa, Facundo Gabriel
- Montes, Juan Maximiliano
- Roldán, Ariel Guevara

## Cómo levantar el sistema completo

El frontend (React + Vite) no tiene datos propios: todo lo pide a la API `/api/movil/` del backend en Django (**Proyecto-Sistema-Cafeto**), que corre en Docker. Por eso hay que asegurarse de que **el backend esté corriendo antes de usar el frontend**.

### 1. Backend (Django en Docker)

Primero verificá que el servicio de Docker esté encendido (en Linux: `sudo systemctl start docker`; en Windows/macOS: abrir Docker Desktop).

- **Si los contenedores ya fueron creados antes**, podés iniciarlos desde cualquier carpeta por su nombre:

```bash
docker start cafeto_db cafeto_web
docker ps                            # cafeto_db y cafeto_web deben figurar "Up"
```

- **Si es la primera vez** (o tras actualizar el backend), desde la carpeta local del repositorio de Django (por ejemplo `../Proyecto-Sistema-Cafeto`):

```bash
docker compose up -d db web          # solo la base y Django (más liviano)
docker compose ps                    # cafeto_db y cafeto_web tienen que figurar "Up" / "running"
```

Comprobá que `http://localhost:8000` responda en el navegador. Para apagarlos luego: `docker stop cafeto_db cafeto_web` (o `docker compose stop` desde la carpeta de Django).

### 2. Frontend (este repositorio)

```bash
npm install      # obligatorio la primera vez (o cuando cambian dependencias)
npm run dev      # levanta el servidor en http://localhost:5173
```

Se ingresa con el **mismo usuario (o DNI) y contraseña** del sistema web de Django.

### Conexión con la API (CORS y proxy opcional)

La API (`/api/movil/`) ya está configurada en Django y exenta de CSRF y del login web.
- **Por defecto**, `src/api/api.js` se conecta directo por CORS a `http://localhost:8000/api/movil`. Si Django corre en otra dirección, creá un archivo `.env.local` con:
  - `VITE_DJANGO_WEB=http://otra-ip:8000` (o `VITE_API_URL=http://otra-ip:8000/api/movil`).
- **Proxy opcional de Vite**: si preferís evitar CORS y que Vite reenvíe `/api` y `/media` hacia Django, agregá en `.env.local`:
  - `VITE_USAR_PROXY=true`
  - `CAFETO_DJANGO_URL=http://127.0.0.1:8000` (opcional, ese es el valor por defecto).

## Despliegue en Vercel y conexión en vivo con túnel Cloudflare

La app pública se compila en Vercel y, para la demostración, consume el backend de Django **que corre en Docker en la notebook** a través de un túnel HTTPS gratuito de Cloudflare (`cloudflared`). El flujo local (`http://localhost:8000`) no cambia.

### Variables de entorno

Ver `.env.example`. En local no hace falta ninguna; en Vercel (**Project → Settings → Environment Variables**):

| Variable | Valor en la demo | Para qué sirve |
|---|---|---|
| `VITE_DJANGO_WEB` | `https://<subdominio>.trycloudflare.com` | Origen de Django: API, fotos `/media/` y enlaces al panel completo. |
| `VITE_API_URL` | *(opcional)* `https://<subdominio>.trycloudflare.com/api/movil` | Si se define sola, `VITE_DJANGO_WEB` se deriva quitando `/api/movil`. |

> Vite incrusta estas variables **al compilar**: después de cambiarlas hay que hacer **Redeploy** en Vercel.

`vercel.json` reescribe todas las rutas a `index.html`, así recargar `/productos/15` o `/catalogo` no da 404.

### Pasos para la presentación

1. Levantar el backend: `docker start cafeto_db cafeto_web` y comprobar `http://localhost:8000`.
2. Abrir el túnel (requiere `cloudflared`, se instala una vez con `winget install --id Cloudflare.cloudflared`):

   ```bash
   npm run tunel            # Windows: verifica Django, abre el túnel e imprime la URL
   # Linux/macOS:  cloudflared tunnel --url http://localhost:8000
   ```

3. En el `settings.py` del backend (y reiniciar `cafeto_web`):

   ```python
   CORS_ALLOWED_ORIGINS += ["https://<tu-proyecto>.vercel.app"]
   ALLOWED_HOSTS += [".trycloudflare.com"]
   CSRF_TRUSTED_ORIGINS += ["https://<subdominio>.trycloudflare.com"]  # sólo para el panel web
   ```

4. Cargar `VITE_DJANGO_WEB` en Vercel con la URL del túnel y hacer **Redeploy**. La URL del túnel cambia cada vez que se reinicia, así que los pasos 3 y 4 se repiten en cada demo.

## Cómo está organizado

| Carpeta / archivo | Qué hace |
|---|---|
| `src/api/api.js` | Único lugar que habla con Django (instancia de Axios, token, manejo de sesión vencida y mensajes de error). |
| `src/components/` | Piezas reutilizables: Sidebar, BarraEstado, BuscadorRapido, Navbar, Footer, Main, Tarjeta, Confirmacion, Tooltip, Paginacion, EncabezadoPagina, Cargando, AvisoError, LimiteError, RutaProtegida, Iconos. |
| `src/pages/` | Una carpeta por pantalla: Landing, Login, Productos, DetalleProducto, StockOperativo, CatalogoAbm, Cajas, Reportes, Usuarios (Mi perfil), NoEncontrada. |
| `src/hooks/` | Hooks globales de preferencias (`useTema`, `useTamanoTexto`). |
| `src/utils/` | Formato de pesos y números (`formato.js`), clasificación de avisos (`avisos.js`) y scroll (`desplazamiento.js`). |
| `src/index.css` | Paleta oficial de Cafeto, tokens CSS (tema oscuro y claro) y puente de variables Bootstrap → Cafeto. |
| `src/styles/bootstrap.css` | Importa Bootstrap 5 dentro de `@layer bootstrap`. |
| `vercel.json` | Reescritura SPA para que las rutas de React Router funcionen al recargar. |
| `scripts/iniciar-tunel.ps1` | Abre el túnel Cloudflare hacia Django local e imprime la configuración para Vercel y CORS. |

### Decisiones importantes

- **Token**: Django firma un token al iniciar sesión y lo espera en cada pedido como `Authorization: Token <token>`. Lo agrega un *interceptor* de Axios.
- **Sesión vencida**: si Django responde `401` (el token venció o se inició sesión en otro dispositivo), el interceptor limpia la sesión, guarda la ruta actual y redirige al login con un aviso.
- **Cerrar sesión** pide confirmación y además revoca el token en Django (`DELETE /api/movil/sesion/`), no solo lo borra del navegador.
- **Rutas protegidas**: `RutaProtegida` envuelve las páginas internas; sin sesión manda al login y, después de entrar, devuelve a la página que se quería ver.
- **Productos y Catálogo**: búsqueda con debounce contra Django, paginación y ABM de marcas y rubros según permisos del perfil.
- **Cajas y Usuarios**: la API móvil muestra el panel del día (`/api/movil/panel/`) y el perfil/permisos propios; abrir, arquear y cerrar caja, y el ABM de usuarios, se hacen desde la web de Django, que es donde quedan auditados.

## Comandos útiles

- `npm run dev`: servidor de desarrollo (`http://localhost:5173`).
- `npm run lint`: revisa el código con `oxlint`.
- `npm run build` y `npm run preview`: versión de producción (`http://localhost:4173`, el proxy también funciona en `preview`).
- `npm run tunel`: túnel HTTPS de Cloudflare hacia `http://localhost:8000` para la demo en Vercel (Windows).
