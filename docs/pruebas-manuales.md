# Pruebas manuales

Requisitos: back-end levantado, `npm run dev` y el navegador en `http://localhost:5173`.
Anotar fecha, resultado (OK / Falla) y observaciones al ejecutarlas.

## HU33 — Catálogo de mascotas

| # | Caso | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 1 | Ver el listado | Abrir `/catalogo.html` | Tarjetas con nombre, especie, raza, edad, sexo, tamaño, estado y refugio | |
| 2 | Buscar | Escribir una raza en "Buscar" | Solo se muestran las mascotas que coinciden | |
| 3 | Filtrar | Elegir especie y estado | El listado y el contador se actualizan | |
| 4 | Sin coincidencias | Buscar "zzz" | "No encontramos mascotas con esos filtros." y botón "Limpiar filtros" | |
| 5 | Sin mascotas | Con la base vacía, abrir el catálogo | "No hay mascotas disponibles por el momento." | |
| 6 | Detalle | Pulsar "Ver detalle" en una tarjeta | Página con todos los datos de la mascota | |
| 7 | Id inexistente | Abrir `/mascota.html?id=99999` | "La mascota no fue encontrada." | |
| 8 | Back apagado | Detener el back y recargar el catálogo | Mensaje de error y botón "Reintentar"; al levantarlo y reintentar, carga | |
| 9 | Teclado | Recorrer el catálogo con Tab | Todos los controles se alcanzan y se ven con foco | |

## HU30 — Gestionar refugios

| # | Caso | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 1 | Registrar | Abrir `/refugio.html`, llenar todos los campos, Guardar | "Refugio registrado correctamente." y enlace "Editar este refugio" | |
| 2 | Campos vacíos | Guardar sin llenar | Un error bajo cada campo y no se llama al API | |
| 3 | Correo inválido | Escribir `abc` en correo | "Ingresa un correo válido…" | |
| 4 | Editar | Abrir `/refugio.html?id=1`, cambiar la ciudad, Guardar | Datos precargados y "Refugio actualizado correctamente." | |
| 5 | Id inexistente | Abrir `/refugio.html?id=99999` | "El refugio no fue encontrado." y sin formulario | |
| 6 | Back apagado | Detener el back y guardar | Mensaje de error; los datos escritos se conservan | |
| 7 | Teclado | Llenar el formulario solo con Tab y Enter | Se registra el refugio | |
