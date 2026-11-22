# Huellitas — solicitudes de adopción

Interfaz frontend para las historias HU01–HU35. Cada historia tiene una página separada y comparte el estilo visual de Huellitas.

Los datos de HU01–HU08, HU18–HU23 se guardan en `localStorage` como demostración. Las historias HU24–HU29 consumen el API del back-end para gestionar reseñas, notificaciones y eventos médicos. HU30–HU35 permiten gestionar refugios, mascotas, veterinarios y seguimientos mediante el API.

El back-end se ejecuta en `http://localhost:8999/api`. Si corre en otra dirección, configurar la variable `VITE_API_URL` mediante el archivo `.env.local` o desde la terminal.

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

## HU06 — Consultar historias de éxito

Página `HU06.html` para consultar los relatos publicados de una mascota. Muestra título, descripción y fecha, además de estados para mascotas inexistentes o inactivas y mascotas sin historias.

## HU07 — Enviar y recibir mensajes

Página `HU07.html` para consultar la bandeja del adoptante y enviar mensajes asociados a una mascota. Permite editar o eliminar mensajes propios no leídos; los registros de demostración se asocian al adoptante Samuel.

## HU08 — Organizar mensajes

Página `HU08.html` para marcar mensajes propios como leídos o no leídos, individualmente o en grupo. No permite organizar mensajes de otro adoptante ni eliminar un mensaje ya leído.

## HU22 — Registrar actualizaciones de seguimiento

Página `HU22.html` para registrar actualizaciones relacionadas con una mascota o un adoptante durante el proceso de adopción.

- Permite seleccionar si la actualización corresponde a una mascota o un adoptante.
- Solicita el identificador correspondiente, título y descripción de la actualización.
- Valida los campos obligatorios y muestra mensajes de error si la información está incompleta.
- Genera automáticamente un identificador único y la fecha de registro.
- Muestra las actualizaciones registradas y permite consultar su historial desde HU23.

Las actualizaciones se almacenan en `localStorage` utilizando la clave `huellitas.actualizaciones`, compartida con HU23.

La interfaz utiliza la cabecera, navegación, menú hamburguesa y panel lateral común de Huellitas.

La lógica está en `src/workflows/HU22.js`, la interfaz en `src/pages/HU22.js`, los estilos en `src/HU22.css` y las pruebas en `tests/HU22.test.js` y `e2e/HU22.spec.ts`.

## HU23 — Consultar historial de actualizaciones

Página `HU23.html` para consultar las actualizaciones registradas previamente en HU22.

- Permite consultar todas las actualizaciones disponibles.
- Incluye filtros por tipo de registro, identificador de mascota e identificador de adoptante.
- Permite buscar una actualización mediante su identificador único.
- Muestra el título, descripción, fecha e información relacionada con cada actualización.
- Presenta mensajes cuando no existen registros o no se encuentra una actualización.

Los datos se consultan desde `localStorage`, utilizando la misma clave de almacenamiento de HU22.

La lógica está en `src/workflows/HU23.js`, la interfaz en `src/pages/HU23.js` y las pruebas en `tests/HU23.test.js` y `e2e/HU23.spec.ts`.

## HU24 — Publicar y editar reseñas

Página `HU24.html` para registrar y editar reseñas relacionadas con las mascotas y el proceso de adopción.

- Consulta las mascotas y adoptantes disponibles desde el back-end.
- Permite seleccionar una mascota, asociar un adoptante, ingresar una calificación entre 1 y 5, un comentario y la fecha de publicación.
- Valida los campos del formulario antes de enviar la información.
- Permite editar las reseñas registradas.
- Muestra mensajes de carga, éxito y error según la respuesta del API.

Endpoints utilizados:

- `GET {API}/mascotas`: consultar mascotas.
- `GET {API}/adoptantes`: consultar adoptantes.
- `GET {API}/resenas`: consultar reseñas registradas.
- `POST {API}/resenas`: registrar una reseña.
- `PUT {API}/resenas/{id}`: actualizar una reseña existente.

La lógica está en `src/workflows/HU24.js`, la interfaz en `src/pages/HU24.js` y las pruebas en `tests/HU24.test.js` y `e2e/HU24.spec.ts`.

## HU25 — Consultar reseñas

Página `HU25.html` para consultar las reseñas registradas en el sistema.

- Permite consultar todas las reseñas.
- Incluye filtros por identificador de mascota, adoptante y calificación.
- Permite consultar una reseña mediante su identificador.
- Muestra la información de cada reseña, su calificación, comentario y fecha.
- Presenta mensajes de error cuando no se encuentran resultados o falla la conexión con el back-end.

Endpoints utilizados:

- `GET {API}/resenas`
- `GET {API}/resenas/{id}`
- `GET {API}/resenas/mascota/{id}`
- `GET {API}/resenas/adoptante/{id}`
- `GET {API}/resenas/calificacion/{calificacion}`

La lógica está en `src/workflows/HU25.js`, la interfaz en `src/pages/HU25.js` y las pruebas unitarias en `tests/HU25.test.js`.

## HU26 — Generar notificaciones

Página `HU26.html` para registrar notificaciones relacionadas con las mascotas y los adoptantes.

- Permite ingresar el tipo de notificación, mensaje y fecha.
- Permite seleccionar el canal de comunicación: correo electrónico, SMS o notificación push.
- Consulta las mascotas y adoptantes disponibles desde el back-end.
- Valida los campos obligatorios antes de registrar la notificación.
- Muestra mensajes de éxito o error según la respuesta del servidor.

Endpoints utilizados:

- `GET {API}/mascotas`
- `GET {API}/adoptantes`
- `POST {API}/notificaciones`

La notificación queda registrada en el back-end. El registro no implica necesariamente el envío real de correos electrónicos, SMS o mensajes push.

La lógica está en `src/workflows/HU26.js`, la interfaz en `src/pages/HU26.js` y las pruebas en `tests/HU26.test.js` y `e2e/HU26.spec.ts`.

## HU27 — Gestionar notificaciones

Página `HU27.html` para consultar, editar y eliminar las notificaciones registradas en HU26.

- Permite consultar todas las notificaciones.
- Incluye filtros por canal de comunicación, mascota y adoptante.
- Permite modificar el tipo, mensaje, fecha y canal de una notificación.
- Permite eliminar notificaciones existentes.
- Muestra mensajes de confirmación y errores devueltos por el API.

Endpoints utilizados:

- `GET {API}/notificaciones`
- `GET {API}/notificaciones/canal/{canal}`
- `GET {API}/notificaciones/mascota/{id}`
- `GET {API}/notificaciones/adoptante/{id}`
- `PUT {API}/notificaciones/{id}`
- `DELETE {API}/notificaciones/{id}`

La lógica está en `src/workflows/HU27.js`, la interfaz en `src/pages/HU27.js` y las pruebas en `tests/HU27.test.js` y `e2e/HU27.spec.ts`.

## HU28 — Registrar eventos médicos

Página `HU28.html` para registrar y gestionar los eventos médicos asociados a las mascotas.

- Permite seleccionar una mascota registrada en el sistema.
- Solicita la fecha del evento, descripción, diagnóstico y tratamiento.
- Valida la información ingresada antes de enviar los datos.
- Permite consultar, editar y eliminar los eventos médicos registrados.
- Muestra mensajes de carga, éxito y error.

Endpoints utilizados:

- `GET {API}/mascotas`
- `GET {API}/eventos-medicos`
- `POST {API}/eventos-medicos`
- `PUT {API}/eventos-medicos/{id}`
- `DELETE {API}/eventos-medicos/{id}`

La lógica está en `src/workflows/HU28.js`, la interfaz en `src/pages/HU28.js` y las pruebas en `tests/HU28.test.js` y `e2e/HU28.spec.ts`.

## HU29 — Consultar historial médico

Página `HU29.html` para consultar el historial de eventos médicos registrados para una mascota.

- Permite seleccionar una mascota y consultar sus eventos médicos.
- Incluye búsqueda por diagnóstico.
- Permite consultar un evento médico mediante su identificador.
- Muestra la fecha, descripción, diagnóstico y tratamiento de cada evento.
- Presenta mensajes cuando no existen registros o no se encuentra el evento solicitado.

Endpoints utilizados:

- `GET {API}/mascotas`
- `GET {API}/eventos-medicos/mascota/{id}`
- `GET {API}/eventos-medicos/{id}`

La búsqueda por diagnóstico permite filtrar los resultados obtenidos.

La lógica está en `src/workflows/HU29.js`, la interfaz en `src/pages/HU29.js` y las pruebas en `tests/HU29.test.js` y `e2e/HU29.spec.ts`.

### Cómo ejecutar HU22–HU29

Para HU22 y HU23 no se necesita tener el back-end ejecutándose, debido a que utilizan almacenamiento local.

Para HU24–HU29 se debe levantar el back-end.

Desde el repositorio del back-end, utilizando PowerShell:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8999"
```

Desde el repositorio del frontend:

```powershell
npm install

$env:VITE_API_URL = "http://localhost:8999/api"

npm run dev
```

Abrir las historias desde el menú de navegación o mediante las siguientes direcciones:

| Historia | Dirección |
|---|---|
| HU22 | http://localhost:5173/HU22.html |
| HU23 | http://localhost:5173/HU23.html |
| HU24 | http://localhost:5173/HU24.html |
| HU25 | http://localhost:5173/HU25.html |
| HU26 | http://localhost:5173/HU26.html |
| HU27 | http://localhost:5173/HU27.html |
| HU28 | http://localhost:5173/HU28.html |
| HU29 | http://localhost:5173/HU29.html |

Si el puerto 5173 está ocupado, utilizar el puerto indicado por Vite en la terminal.

### Pruebas unitarias HU22–HU29

Las pruebas unitarias verifican la lógica de negocio, validación de datos, almacenamiento, construcción de peticiones HTTP y manejo de respuestas y errores.

Desde PowerShell:

```powershell
$env:VITE_API_URL = "http://localhost:8080/api"

npx vitest run tests/HU22.test.js tests/HU23.test.js tests/HU24.test.js tests/HU25.test.js tests/HU26.test.js tests/HU27.test.js tests/HU28.test.js tests/HU29.test.js --coverage --coverage.include="src/workflows/HU2[2-9].js"
```

La configuración del puerto 8080 se utiliza para mantener el comportamiento esperado por las pruebas unitarias que verifican las URL mediante peticiones simuladas.

Para ejecutar todas las pruebas unitarias del proyecto:

```powershell
npm run test:unit
```

Para visualizar el reporte de cobertura:

```powershell
Start-Process .\coverage\index.html
```

### Pruebas E2E HU22–HU29

Las pruebas E2E verifican el comportamiento de las interfaces desde el navegador, incluyendo formularios, validaciones, navegación y operaciones de las historias que cuentan con estas pruebas.

```powershell
npx playwright install chromium

npx playwright test 'HU2[2-9]'
```

Para visualizar las pruebas durante su ejecución:

```powershell
npx playwright test 'HU2[2-9]' --headed
```

Para consultar el reporte:

```powershell
npx playwright show-report
```

### Verificar la conexión con el back-end

Con el back-end ejecutándose en el puerto 8999:

```powershell
curl.exe -i http://localhost:8999/api/actualizaciones
curl.exe -i http://localhost:8999/api/resenas
curl.exe -i http://localhost:8999/api/notificaciones
curl.exe -i http://localhost:8999/api/eventos-medicos
```

También se puede comprobar la comunicación desde las herramientas de desarrollo del navegador:

1. Abrir una historia conectada al back-end.
2. Presionar F12 y seleccionar Network.
3. Seleccionar Fetch/XHR.
4. Realizar una consulta, registro, edición o eliminación.
5. Revisar Headers, Payload y Response.

Códigos HTTP esperados:

| Método | Operación | Código |
|---|---|---|
| GET | Consultar información | 200 OK |
| POST | Registrar información | 201 Created |
| PUT | Actualizar información | 200 OK |
| DELETE | Eliminar información | 204 No Content |

HU22 y HU23 todavía utilizan almacenamiento local, por lo que estas historias no generan peticiones HTTP hacia el API de actualizaciones.

### Resultados de pruebas y cobertura

Resultados obtenidos durante la validación local del 22/11/2026:

| Indicador | Resultado |
|---|---|
| Pruebas unitarias generales | 567/567 aprobadas |
| Archivos de pruebas unitarias | 37/37 aprobados |
| Pruebas unitarias HU22–HU29 | 251/251 aprobadas |
| Pruebas E2E HU22–HU29 | 41/41 aprobadas |
| Cobertura de sentencias | 100 % |
| Cobertura de ramas | 100 % |
| Cobertura de funciones | 100 % |
| Cobertura de líneas | 100 % |
| Compilación del frontend | Exitosa |

La cobertura corresponde a los módulos incluidos en la configuración de Vitest.

Las pruebas automatizadas pueden utilizar respuestas simuladas del API, por lo que se complementan con las pruebas manuales de integración con el back-end.

## HU33 — Catálogo de mascotas

Página `HU33.html` (código en `src/pages/HU33.js`, con la misma cabecera, navegación y panel lateral que las demás historias) que consulta `GET {API}/mascotas` del back-end y muestra las mascotas en tarjetas (nombre, especie, raza, edad, sexo, tamaño, estado y refugio). Incluye búsqueda por nombre o raza, filtros por especie y estado, mensajes de carga, error (con botón **Reintentar**) y un mensaje cuando no hay mascotas disponibles.

- La lista de especies no repite valores escritos con distinta mayúscula o tilde («Perro» y «perro» salen una sola vez y el filtro agrupa ambos), porque HU32 recibe la especie como texto libre.
- Mientras el catálogo carga, o si la carga falló, usar los filtros no reemplaza el mensaje de carga o de error.
- Una mascota sin estado ya no se muestra como «Disponible»; aparece como «Estado no registrado».

Cada tarjeta tiene un botón **Ver detalle** que abre `HU33.html?id={id}`, donde se consulta `GET {API}/mascotas/{id}` y se muestran todos los datos de la mascota, con un enlace al refugio (`HU31.html?id={refugio}`). Si el id no existe se muestra «La mascota no fue encontrada.».

La lógica está en `src/catalog/catalog.js`, que usa el cliente compartido `src/api-client.js` (por eso también muestra el mensaje que devuelve el API cuando rechaza una petición). Los estilos de tarjetas, estados y mensajes están en `src/catalog/catalog.css`, que también cargan HU31 y HU34 porque reutilizan esas clases.

### Cómo ejecutar HU33

1. Levantar el back-end (`mvnw.cmd spring-boot:run` o `java -jar`). Por defecto responde en `http://localhost:8999/api` (puerto fijado en el `pom.xml`).
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

## HU31 — Detalle de un refugio

Página `HU31.html`: escribir el número de un refugio (o abrir `http://localhost:5173/HU31.html?id=1`) para consultar `GET {API}/refugios/{id}`. Muestra nombre, ciudad, dirección, teléfono y correo, y la lista de mascotas registradas en ese refugio, cada una con un enlace a su detalle (`HU33.html?id=`). Si el refugio no tiene mascotas muestra «Este refugio no tiene mascotas registradas.»; si no existe muestra «El refugio no fue encontrado.».

## HU32 — Registrar una mascota

Página `HU32.html` con el formulario de registro (`POST {API}/mascotas`): nombre y especie obligatorios, edad no negativa, estado entre «Disponible», «En proceso de adopcion» y «Adoptado», y refugio opcional (si se indica, debe existir). También permite eliminar una mascota por su número (`DELETE {API}/mascotas/{id}`); si la mascota tiene seguimientos veterinarios se muestra el error que devuelve el API.

## HU34 — Registrar veterinarios de un refugio

Página `HU34.html`: formulario de registro (`POST {API}/veterinarios`) con nombre, teléfono, correo, especialidad, disponibilidad y el número del refugio al que queda asociado (si no existe se muestra un error). Muestra el listado de veterinarios registrados (`GET {API}/veterinarios`) y permite consultar uno por su número (`GET {API}/veterinarios/{id}`), con el mensaje «El veterinario no fue encontrado.» si no existe.

## HU35 — Programar y consultar seguimientos veterinarios

Página `HU35.html`: formulario para programar un seguimiento (`POST {API}/seguimientos`) con fecha de asignación obligatoria, próxima cita (no puede ser anterior a la asignación), observación, estado y los números de la mascota y del veterinario, que deben existir. Permite consultar los seguimientos de una mascota por su número, editarlos (`PUT`) y eliminarlos (`DELETE`); un seguimiento «Completado» no se puede modificar ni eliminar.

La lógica compartida del API está en `src/api-client.js` (cobertura del 100 %) y las utilidades de formularios en `src/admin-ui.js`. Cada historia tiene su lógica en `src/workflows/HUxx.js`, su página en `src/pages/HUxx.js`, y sus pruebas en `tests/HUxx.test.js` y `e2e/HUxx.spec.ts`.
