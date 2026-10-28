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

## HU33 — Catálogo de mascotas

Página `catalogo.html` que consulta `GET {API}/mascotas` del back-end y muestra las mascotas en tarjetas (nombre, especie, raza, edad, sexo, tamaño, estado y refugio). Incluye búsqueda por nombre o raza, filtros por especie y estado, mensajes de carga, error (con botón **Reintentar**) y lista vacía.

### Cómo ejecutarla

1. Levantar el back-end (`mvnw.cmd spring-boot:run` o `java -jar`). Por defecto responde en `http://localhost:8080/api`.
2. En este repo:

```sh
npm install
npm run dev
```

3. Abrir `http://localhost:5173/catalogo.html`.

Si el back corre en otra dirección, crear un archivo `.env.local` con `VITE_API_URL=http://servidor:puerto/api`.

### Pruebas de la HU33

```sh
npm run test:unit   # Vitest, cobertura 100 % de src/catalog/catalog.js
npm run test:e2e    # Playwright, el API se simula con page.route (no necesita el back)
```
