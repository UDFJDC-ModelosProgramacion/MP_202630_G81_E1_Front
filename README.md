# Huellitas — solicitudes de adopción

Interfaz frontend para las historias HU18–HU21: solicitudes de adopción, formalización con asignación veterinaria, pruebas de convivencia con periodo definido, y devoluciones con actualización de disponibilidad e historial. Cada historia tiene una página separada y comparte el estilo visual de Huellitas.

Los registros de estas historias se guardan en `localStorage` como demostración; no se conectan a un backend. El catálogo de mascotas HU33 conserva su integración existente con el API.

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

Las pruebas unitarias están separadas por historia (`tests/HU18.test.js` a `tests/HU21.test.js`) y también cubren HU33; Vitest exige 100 % de sentencias, ramas, funciones y líneas para los módulos de lógica. Las pruebas de navegador también están separadas por historia en `e2e/`.

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
