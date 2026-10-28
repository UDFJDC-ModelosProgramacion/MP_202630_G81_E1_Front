# Huellitas — solicitudes de adopción

Interfaz frontend para la historia de usuario HU18. Permite a una persona interesada registrar una solicitud de adopción para Mora, iniciar el proceso de evaluación y recibir confirmación. Las solicitudes se guardan en el navegador con estado **Pendiente**; esta versión no se conecta a un backend. La prueba de convivencia pertenece a una historia de usuario diferente y no está incluida.

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

Las pruebas unitarias, ubicadas en `tests/`, aplican umbrales del 100 % de sentencias, ramas, funciones y líneas al módulo de validación y persistencia. Las pruebas de Playwright recorren la validación, el envío y almacenamiento local de solicitudes y la navegación móvil.

## HU09 — Registrar adoptante

Formulario para que una persona se registre como adoptante. Envía los datos (nombre, correo, teléfono, ciudad y dirección) al backend con `POST /api/adoptantes`, muestra los errores de validación del formulario y los que devuelve la API (por ejemplo, un correo ya registrado) y, al terminar, confirma el registro y guarda el número de adoptante en el navegador.

### Cómo ejecutarla

1. Levanta el backend (`MP_202630_G81_E1_Back`) en `http://localhost:8080`. La URL base de la API está en `src/adoptante.js` (`API_BASE_URL`).
2. En este repositorio:

```sh
npm install
npm run dev
```

3. Abre `http://localhost:5173/registro-adoptante.html` (también está el enlace «Registro» en la navegación de la página).

### Pruebas

```sh
npm run test:unit
```

La lógica de HU09 está en `src/adoptante.js` y sus pruebas en `tests/adoptante.test.js` (cobertura del 100 %). La interfaz está en `registro-adoptante.html` y `src/registro-adoptante.js`.
