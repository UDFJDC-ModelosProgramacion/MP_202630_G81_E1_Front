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

## HU09 — Registrar adoptante

Formulario para que una persona se registre como adoptante. Envía los datos (nombre, correo, teléfono, ciudad y dirección) al backend con `POST /api/adoptantes`, muestra los errores de validación del formulario y los que devuelve la API (por ejemplo, un correo ya registrado) y, al terminar, confirma el registro y guarda el número de adoptante en el navegador.

### Cómo ejecutarla

1. Levanta el backend (`MP_202630_G81_E1_Back`) en `http://localhost:8080`. La URL base de la API está en `src/adoptante.js` (`API_BASE_URL`).
2. En este repositorio:

```sh
npm install
npm run dev
```

3. Abre `http://localhost:5173/HU09.html` (también está el enlace «Registro» en la navegación de la página).

### Pruebas

```sh
npm run test:unit
```

La lógica de HU09 está en `src/adoptante.js` y sus pruebas en `tests/adoptante.test.js` (cobertura del 100 %). La interfaz está en `registro-adoptante.html` y `src/registro-adoptante.js`.
