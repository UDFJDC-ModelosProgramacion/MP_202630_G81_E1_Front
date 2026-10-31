# Huellitas — solicitudes de adopción

Interfaz frontend para las historias HU01–HU05, HU18–HU21 y HU33. Cada historia tiene una página separada y comparte el estilo visual de Huellitas.

Los datos de HU01–HU05 y HU18–HU21 se guardan en `localStorage` como demostración; no se conectan a un backend. HU01 presenta la galería fotográfica y HU33 conserva la integración del catálogo con el API.

## Desarrollo

```sh
npm install
npm run dev
```

## Pruebas

```sh
npm run test:unit
npm run test:e2e
```

Las pruebas unitarias están separadas por historia (`tests/HUxx.test.js`) y las pruebas de navegador usan `e2e/HUxx.spec.ts`. Vitest exige 100 % de sentencias, ramas, funciones y líneas para los módulos de lógica.

## Añadir una historia

Usa el identificador `HUxx` en todos los archivos de la historia: crea `HUxx.html`, `src/pages/HUxx.js`, y sus pruebas `tests/HUxx.test.js` y `e2e/HUxx.spec.ts`. Si la historia tiene lógica de dominio, ubícala en `src/workflows/HUxx.js`. Vite agrega automáticamente al build todos los `HU*.html`; registra la historia en `src/story-navigation.js` para que aparezca en la navegación común.

## HU01 — Galería de fotos

Página `HU01.html` que presenta las fotos por mascota, coloca primero la fotografía principal y muestra estados para mascotas sin fotos o no encontradas. La galería se abre desde las historias de adopción y permite pasar entre mascotas.

## HU02 — Gestionar fotografías

Página `HU02.html` para agregar, editar y eliminar fotos por mascota, marcar una imagen principal y sincronizar los cambios con la galería HU01. Los cambios se guardan localmente.

## HU03 — Registrar eventos de vida

Página `HU03.html` para registrar y editar eventos de nacimiento, vacunación, enfermedad, adopción o muerte. Rechaza tipos no permitidos, fechas inválidas o futuras y sincroniza los registros con HU04.

## HU04 — Consultar línea de tiempo

Página `HU04.html` que combina eventos y registros de adopción/devolución, los ordena cronológicamente y permite filtrar por tipo y rango de fechas. Acepta `?mascota=<id>` y muestra un error si no existe la mascota.

## HU05 — Publicar historias de éxito

Página `HU05.html` para crear, editar y eliminar historias con título y descripción. Solo permite publicar o editar historias cuyo registro de mascota no esté marcado como inactivo o retirado.

## HU33 — Catálogo de mascotas

Página `HU33.html` que consulta `GET {API}/mascotas` del back-end y muestra las mascotas en tarjetas (nombre, especie, raza, edad, sexo, tamaño, estado y refugio). Incluye búsqueda por nombre o raza, filtros por especie y estado, mensajes de carga, error (con botón **Reintentar**) y lista vacía.

### Cómo ejecutar HU33

1. Levantar el back-end (`mvnw.cmd spring-boot:run` o `java -jar`). Por defecto responde en `http://localhost:8080/api`.
2. En este repo:

```sh
npm install
npm run dev
```

3. Abrir `http://localhost:5173/HU33.html`.

Si el back corre en otra dirección, crear un archivo `.env.local` con `VITE_API_URL=http://servidor:puerto/api`.

### Pruebas de HU33

```sh
npm run test:unit   # Vitest, cobertura 100 % de src/catalog/catalog.js
npm run test:e2e    # Playwright, el API se simula con page.route (no necesita el back)
```

## HU09–HU17 — Adoptantes, vacunas y notificaciones

Historias conectadas al back-end (`MP_202630_G81_E1_Back`). La URL base de la API se define en `src/api/client.js` (por defecto `http://localhost:8080/api`; se cambia con `VITE_API_URL` en `.env.local`). Cada historia usa su identificador en todos sus archivos: `HUxx.html`, `src/pages/HUxx.js`, `src/workflows/HUxx.js`, `tests/HUxx.test.js` y `e2e/HUxx.spec.ts`.

| Historia | Página | Qué hace | Endpoints |
| :--- | :--- | :--- | :--- |
| HU09 | `HU09.html` | Registrar adoptante; guarda su id en el navegador | `POST /adoptantes` |
| HU10 | `HU10.html` | Consultar y editar el perfil del adoptante registrado | `GET`/`PUT /adoptantes/{id}` |
| HU11 | `HU11.html` | Listar adoptantes y ver el detalle | `GET /adoptantes`, `GET /adoptantes/{id}` |
| HU12 | `HU12.html` | Consultar el catálogo de vacunas y su detalle | `GET /vacunas`, `GET /vacunas/{id}` |
| HU13 | `HU13.html` | Crear, editar y eliminar vacunas (con confirmación) | `POST`/`PUT`/`DELETE /vacunas` |
| HU14 | `HU14.html` | Registrar la vacunación de una mascota | `POST /registros-vacunacion` |
| HU15 | `HU15.html` | Consultar el historial de vacunación de una mascota | `GET /registros-vacunacion` |
| HU16 | `HU16.html` | Editar o eliminar un registro de vacunación | `PUT`/`DELETE /registros-vacunacion/{id}` |
| HU17 | `HU17.html` | Consultar las notificaciones del adoptante | `GET /notificaciones/adoptante/{id}` |

### Cómo ejecutarlas

1. Levantar el back-end en `http://localhost:8080`.
2. En este repo: `npm install` y `npm run dev`.
3. Abrir `http://localhost:5173/HU09.html` y registrarse. HU10 y HU17 usan el id guardado por HU09; HU14 a HU16 necesitan que existan mascotas y vacunas (HU13).

### Pruebas

```sh
npm run test:unit   # Vitest, cobertura 100 % de src/api/client.js y src/workflows/HU*.js
npm run test:e2e    # Playwright, el API se simula con page.route (no necesita el back)
```
