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

## HU31 — Detalle de un refugio (`/HU31.html`)

| # | Caso | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 1 | Consultar | Escribir el número de un refugio y consultar | Nombre, ciudad, dirección, teléfono y correo del refugio | |
| 2 | Mascotas del refugio | Revisar la sección «Mascotas del refugio» | Listado de las mascotas de ese refugio, con enlace a su detalle | |
| 3 | Sin mascotas | Consultar un refugio sin mascotas | «Este refugio no tiene mascotas registradas.» | |
| 4 | Id inexistente | Abrir `/HU31.html?id=99999` | «El refugio no fue encontrado.» sin botón «Reintentar» | |
| 5 | Número inválido | Escribir `abc` y consultar | «Ingresa el número del refugio.» | |
| 6 | Back apagado | Detener el back y consultar | Mensaje de error y botón «Reintentar» | |

## HU32 — Registrar una mascota (`/HU32.html`)

| # | Caso | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 1 | Registrar | Llenar nombre, especie y estado y registrar | «Mascota … registrada correctamente.» y aparece en el catálogo | |
| 2 | Obligatorios | Registrar sin nombre, especie ni estado | Un error bajo cada campo y no se llama al API | |
| 3 | Edad negativa | Escribir `-2` en la edad | «La edad no puede ser negativa.» | |
| 4 | Refugio inexistente | Indicar un número de refugio que no existe | «El refugio indicado no existe.» | |
| 5 | Eliminar | Escribir el número de una mascota sin seguimientos y confirmar | «Mascota eliminada correctamente.» | |
| 6 | Eliminar con seguimientos | Eliminar una mascota con seguimientos veterinarios | Mensaje de error del API; la mascota no se elimina | |

## HU34 — Registrar veterinarios (`/HU34.html`)

| # | Caso | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 1 | Registrar | Llenar todos los campos con un refugio existente | «Veterinario … registrado correctamente.» y aparece en el listado | |
| 2 | Campos vacíos | Registrar sin llenar | Un error bajo cada campo y no se llama al API | |
| 3 | Refugio inexistente | Indicar un refugio que no existe | «El refugio indicado no existe.» | |
| 4 | Listado | Abrir la página | Lista de veterinarios registrados (o «Aún no hay veterinarios registrados.») | |
| 5 | Consultar | Escribir el número de un veterinario | Sus datos completos | |
| 6 | Id inexistente | Consultar el número 99999 | «El veterinario no fue encontrado.» | |

## HU35 — Seguimientos veterinarios (`/HU35.html`)

| # | Caso | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 1 | Programar | Llenar fecha, estado, mascota y veterinario existentes | «Seguimiento programado correctamente.» | |
| 2 | Fecha obligatoria | Programar sin fecha de asignación | «La fecha de asignación es obligatoria.» | |
| 3 | Próxima cita anterior | Poner la próxima cita antes de la asignación | «La próxima cita no puede ser anterior a la fecha de asignación.» | |
| 4 | Referencias inexistentes | Usar una mascota o veterinario que no existe | «La mascota o el veterinario indicado no existe.» | |
| 5 | Consultar | Escribir el número de una mascota y consultar | Lista de sus seguimientos (o «Esta mascota no tiene seguimientos registrados.») | |
| 6 | Editar | Pulsar «Editar» en un seguimiento programado y guardar | «Seguimiento actualizado correctamente.» | |
| 7 | Completado | Pulsar «Editar» o «Eliminar» en un seguimiento «Completado» | «No se puede modificar ni eliminar un seguimiento en estado "Completado".» | |
| 8 | Eliminar | Eliminar un seguimiento programado y confirmar | «Seguimiento eliminado correctamente.» | |
