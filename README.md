# Sistema Cafeto

## Descripción
Sistema Cafeto es una plataforma integral diseñada para optimizar la gestión combinada de cafetería y minisúper, agilizando la atención al cliente y el control de inventarios.

![Vista previa del sistema](./src/assets/captura-sistema-cafeto.png)

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

## Cómo está organizado

| Carpeta / archivo | Qué hace |
|---|---|
| `src/api/api.js` | Único lugar que habla con Django (instancia de Axios, token, manejo de sesión vencida y mensajes de error). |
| `src/components/` | Piezas reutilizables: Sidebar, BarraEstado, BuscadorRapido, Navbar, Footer, Main, Tarjeta, Confirmacion, Tooltip, Paginacion, EncabezadoPagina, Cargando, AvisoError, LimiteError, RutaProtegida, Iconos. |
| `src/pages/` | Una carpeta por pantalla: Landing, Login, Productos, DetalleProducto, StockOperativo, CatalogoAbm, Cajas, Reportes, Usuarios (Mi perfil), NoEncontrada. |
| `src/hooks/` | Hooks globales de preferencias (`useTema`, `useTamanoTexto`). |
| `src/utils/` | Formato de pesos y números (`formato.js`), clasificación de avisos (`avisos.js`) y scroll (`desplazamiento.js`). |
| `src/index.css` | Paleta oficial de Cafeto y tokens CSS (tema oscuro y claro). |

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
