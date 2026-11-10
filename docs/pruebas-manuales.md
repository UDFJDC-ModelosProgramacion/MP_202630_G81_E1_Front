# Pruebas manuales (HU30 y HU33)

Requisitos: back-end levantado, `npm run dev` y el navegador en `http://localhost:5173`.
Anotar fecha, resultado (OK / Falla) y observaciones al ejecutarlas.

## HU33 — Catálogo de mascotas (`/HU33.html`)

| # | Caso | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 1 | Ver el listado | Abrir `/HU33.html` | Tarjetas con nombre, especie, raza, edad, sexo, tamaño, estado y refugio | |
| 2 | Buscar y filtrar | Escribir una raza; elegir especie y estado | El listado y el contador se actualizan | |
| 3 | Sin coincidencias | Buscar «zzz» | «No encontramos mascotas con esos filtros.» y botón «Limpiar filtros» | |
| 4 | Sin mascotas | Con la base vacía, abrir el catálogo | «No hay mascotas disponibles por el momento.» | |
| 5 | Detalle | Pulsar «Ver detalle» en una tarjeta | Se muestran todos los datos de la mascota y un enlace para volver | |
| 6 | Id inexistente | Abrir `/HU33.html?id=99999` | «La mascota no fue encontrada.» sin botón «Reintentar» | |
| 7 | Back apagado | Detener el back y recargar | Mensaje de error y botón «Reintentar»; al levantarlo y reintentar, carga | |
| 8 | Teclado | Recorrer la página con Tab | Todos los controles se alcanzan y se ven con foco | |

## HU30 — Gestionar refugios (`/HU30.html`)

| # | Caso | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 1 | Registrar | Llenar todos los campos y guardar | «Refugio registrado correctamente.» y enlace «Editar este refugio» | |
| 2 | Campos vacíos | Guardar sin llenar | Un error bajo cada campo y no se llama al API | |
| 3 | Correo inválido | Escribir `abc` en correo | «Ingresa un correo válido…» | |
| 4 | Editar | Abrir `/HU30.html?id=1`, cambiar la ciudad, guardar | Datos precargados y «Refugio actualizado correctamente.» | |
| 5 | Id inexistente | Abrir `/HU30.html?id=99999` | «El refugio no fue encontrado.» y sin formulario | |
| 6 | Rechazo del API | Registrar un refugio que el back rechace | Se muestra el mensaje del back y se conservan los datos | |
| 7 | Back apagado | Detener el back y guardar | Mensaje de error; los datos escritos se conservan | |
| 8 | Teclado | Llenar el formulario solo con Tab y Enter | Se registra el refugio | |
