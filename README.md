# Huellitas — solicitudes de adopción

Interfaz frontend para las historias HU01–HU05, HU18–HU21 y HU30–HU35. Cada historia tiene una página separada y comparte el estilo visual de Huellitas.

Los datos de HU01–HU05 y HU18–HU21 se guardan en `localStorage` como demostración; no se conectan a un backend. HU01 presenta la galería fotográfica; HU30–HU35 (refugios, mascotas, veterinarios y seguimientos) consumen el API del back-end. El API se espera en `http://localhost:8080/api`; si corre en otra dirección, crear un archivo `.env.local` con `VITE_API_URL=http://servidor:puerto/api`.

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

Página `HU33.html` (código en `src/pages/HU33.js`, con la misma cabecera, navegación y panel lateral que las demás historias) que consulta `GET {API}/mascotas` del back-end y muestra las mascotas en tarjetas (nombre, especie, raza, edad, sexo, tamaño, estado y refugio). Incluye búsqueda por nombre o raza, filtros por especie y estado, mensajes de carga, error (con botón **Reintentar**) y un mensaje cuando no hay mascotas disponibles.

- La lista de especies no repite valores escritos con distinta mayúscula o tilde («Perro» y «perro» salen una sola vez y el filtro agrupa ambos), porque HU32 recibe la especie como texto libre.
- Mientras el catálogo carga, o si la carga falló, usar los filtros no reemplaza el mensaje de carga o de error.
- Una mascota sin estado ya no se muestra como «Disponible»; aparece como «Estado no registrado».

Cada tarjeta tiene un botón **Ver detalle** que abre `HU33.html?id={id}`, donde se consulta `GET {API}/mascotas/{id}` y se muestran todos los datos de la mascota, con un enlace al refugio (`HU31.html?id={refugio}`). Si el id no existe se muestra «La mascota no fue encontrada.».

La lógica está en `src/catalog/catalog.js`, que usa el cliente compartido `src/api-client.js` (por eso también muestra el mensaje que devuelve el API cuando rechaza una petición). Los estilos de tarjetas, estados y mensajes están en `src/catalog/catalog.css`, que también cargan HU31 y HU34 porque reutilizan esas clases.

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

La lógica está en `src/workflows/HU30.js` (cobertura del 100 %), la interfaz en `src/pages/HU30.js` y las pruebas en `tests/HU30.test.js` y `e2e/HU30.spec.ts`. Las pruebas manuales de HU30–HU35 están en [`docs/pruebas-manuales.md`](docs/pruebas-manuales.md).

## HU31 — Detalle de un refugio

Página `HU31.html`: escribir el número de un refugio (o abrir `http://localhost:5173/HU31.html?id=1`) para consultar `GET {API}/refugios/{id}`. Muestra nombre, ciudad, dirección, teléfono y correo, y la lista de mascotas registradas en ese refugio, cada una con un enlace a su detalle (`HU33.html?id=`). Si el refugio no tiene mascotas muestra «Este refugio no tiene mascotas registradas.»; si no existe muestra «El refugio no fue encontrado.».

## HU32 — Registrar una mascota

Página `HU32.html` con el formulario de registro (`POST {API}/mascotas`): nombre y especie obligatorios, edad no negativa, estado entre «Disponible», «En proceso de adopcion» y «Adoptado», y refugio opcional (si se indica, debe existir). También permite eliminar una mascota por su número (`DELETE {API}/mascotas/{id}`); si la mascota tiene seguimientos veterinarios se muestra el error que devuelve el API.

## HU34 — Registrar veterinarios de un refugio

Página `HU34.html`: formulario de registro (`POST {API}/veterinarios`) con nombre, teléfono, correo, especialidad, disponibilidad y el número del refugio al que queda asociado (si no existe se muestra un error). Muestra el listado de veterinarios registrados (`GET {API}/veterinarios`) y permite consultar uno por su número (`GET {API}/veterinarios/{id}`), con el mensaje «El veterinario no fue encontrado.» si no existe.

## HU35 — Programar y consultar seguimientos veterinarios

Página `HU35.html`: formulario para programar un seguimiento (`POST {API}/seguimientos`) con fecha de asignación obligatoria, próxima cita (no puede ser anterior a la asignación), observación, estado y los números de la mascota y del veterinario, que deben existir. Permite consultar los seguimientos de una mascota por su número, editarlos (`PUT`) y eliminarlos (`DELETE`); un seguimiento «Completado» no se puede modificar ni eliminar.

La lógica compartida del API está en `src/api-client.js` (cobertura del 100 %) y las utilidades de formularios en `src/admin-ui.js`. Cada historia tiene su lógica en `src/workflows/HUxx.js`, su página en `src/pages/HUxx.js`, y sus pruebas en `tests/HUxx.test.js` y `e2e/HUxx.spec.ts`.

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
