# Huellitas — solicitudes de adopción

Interfaz frontend para las historias HU01–HU17, HU18–HU21, HU30 y HU33. Cada historia tiene una página separada y comparte el estilo visual de Huellitas.

HU01–HU08 y HU09–HU17 consultan y actualizan los registros del backend. La portada de HU18 consulta mascotas y fotografías del backend; el formulario de solicitud y HU19–HU21 conservan almacenamiento local de demostración. HU01 comparte los datos de mascotas con el catálogo HU33.

## Tecnologías

Vite, HTML5, CSS3, JavaScript (ES6+), Tailwind CSS, Vitest (pruebas unitarias), Playwright (pruebas de integración/e2e), Jenkins y SonarQube (calidad).

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

## Calidad (Jenkins y SonarQube)

El pipeline está en `Jenkinsfile` y el análisis en `sonar-project.properties`. Jenkins y SonarQube se levantan en local con `docker compose up -d` (Jenkins en `http://localhost:8081`, SonarQube en `http://localhost:9000`).

## Añadir una historia

Usa el identificador `HUxx` en todos los archivos de la historia: crea `HUxx.html`, `src/pages/HUxx.js`, y sus pruebas `tests/HUxx.test.js` y `e2e/HUxx.spec.ts`. Si la historia tiene lógica de dominio, ubícala en `src/workflows/HUxx.js`. Vite agrega automáticamente al build todos los `HU*.html`; registra la historia en `src/story-navigation.js` para que aparezca en la navegación común.

## HU01 — Galería de fotos

Página `HU01.html` que consulta `GET {API}/mascotas` y `GET {API}/mascotas/{id}/fotografias`. Muestra únicamente las mascotas y fotografías registradas en el backend, colocando primero la fotografía principal.

## HU02 — Gestionar fotografías

Página `HU02.html` para agregar, editar y eliminar fotos por mascota, marcar una imagen principal y sincronizar los cambios con la galería HU01. Usa las rutas `/mascotas/{id}/fotografias` del API.

## HU03 — Registrar eventos de vida

Página `HU03.html` para registrar y editar eventos de nacimiento, vacunación, enfermedad, adopción o muerte. Rechaza tipos no permitidos, fechas inválidas o futuras y sincroniza los registros con HU04 mediante `/mascotas/{id}/eventos-vida`.

## HU04 — Consultar línea de tiempo

Página `HU04.html` que combina eventos de vida, adopciones y retornos consultados al backend, los ordena cronológicamente y permite filtrar por tipo y rango de fechas. Acepta `?mascota=<id>`.

## HU05 — Publicar historias de éxito

Página `HU05.html` para crear, editar y eliminar historias con título y descripción usando `/mascotas/{id}/historias-exito`. Solo permite publicar o editar historias de mascotas activas.

## HU06 — Consultar historias de éxito

Página `HU06.html` para consultar en el backend los relatos publicados de una mascota. Muestra título, descripción y fecha, además de estados para mascotas inexistentes o inactivas y mascotas sin historias.

## HU07 — Enviar y recibir mensajes

Página `HU07.html` para consultar la bandeja del adoptante y enviar mensajes asociados a una mascota usando `/adoptantes/{id}/mensajes`. Permite editar o eliminar mensajes propios no leídos. El ID de adoptante se obtiene del registro realizado en HU09.

## HU08 — Organizar mensajes

Página `HU08.html` para marcar mensajes del backend como leídos o no leídos, individualmente o en grupo. No permite organizar mensajes de otro adoptante ni eliminar un mensaje ya leído.

Para HU01–HU08, inicia el backend en `http://localhost:8080` (o configura `VITE_API_URL` como se describe en HU33). HU07 y HU08 requieren registrar primero un adoptante desde HU09 en el mismo navegador para asociar la bandeja con su ID real.

## HU33 — Catálogo de mascotas

Página `HU33.html` que consulta `GET {API}/mascotas` del back-end y muestra las mascotas en tarjetas (nombre, especie, raza, edad, sexo, tamaño, estado y refugio). Incluye búsqueda por nombre o raza, filtros por especie y estado, mensajes de carga, error (con botón **Reintentar**) y un mensaje cuando no hay mascotas disponibles.

Cada tarjeta tiene un botón **Ver detalle** que abre `HU33.html?id={id}`, donde se consulta `GET {API}/mascotas/{id}` y se muestran todos los datos de la mascota. Si el id no existe se muestra «La mascota no fue encontrada.».

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

## HU30 — Gestionar refugios

Página `HU30.html` para registrar y editar los datos de contacto de un refugio (nombre, ciudad, dirección, teléfono, correo y descripción).

- **Registrar:** abrir `http://localhost:5173/HU30.html`, llenar el formulario y guardar (`POST {API}/refugios`). Todos los campos son obligatorios y el correo se valida; los errores aparecen bajo cada campo.
- **Editar:** abrir `http://localhost:5173/HU30.html?id=1` (o escribir el número en «Editar un refugio existente»). Se carga el refugio con `GET {API}/refugios/{id}` y se guarda con `PUT {API}/refugios/{id}`. Si el id no existe se muestra «El refugio no fue encontrado.».
- Mensajes de carga, éxito y error (incluidos los que devuelve el API), errores accesibles y uso completo con teclado.

La lógica está en `src/workflows/HU30.js` (cobertura del 100 %), la interfaz en `src/pages/HU30.js` y las pruebas en `tests/HU30.test.js` y `e2e/HU30.spec.ts`. Las pruebas manuales de HU30 y HU33 están en [`docs/pruebas-manuales.md`](docs/pruebas-manuales.md).

## Video
https://www.youtube.com/watch?v=lZHhNKTwbAk

HU30-HU35 consumen el API del back-end (por defecto http://localhost:8999/api).
