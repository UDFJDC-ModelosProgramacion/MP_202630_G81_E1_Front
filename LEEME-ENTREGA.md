# Entrega unificada HU30–HU35 (HU33 corregida)

Esta carpeta junta las dos entregas anteriores (HU30+HU33 y HU31+HU32+HU34+HU35) y corrige la HU33
para que encaje con las demás. Tiene la misma estructura del repo: copia su contenido sobre la raíz,
en una rama creada a partir de feature/gestionar-refugios-HU30 (o de Develop cuando el PR #18 esté fusionado).

NUEVOS: HU30–HU35.html (HU33.html se reemplaza), src/pages/HU30–HU35.js, src/workflows/HU30–HU32 y HU34–HU35.js,
src/api-client.js, src/admin-ui.js, sus pruebas en tests/ y e2e/, Jenkinsfile, sonar-project.properties, docker-compose.yml
(si tu equipo ya tiene Jenkinsfile o sonar, conserva los suyos).

CAMBIOS DE LA HU33: src/pages/HU33.js (nueva página, usa el mismo shell que las otras), src/catalog/catalog.js,
src/catalog/catalog.css, tests/HU33.test.js, e2e/HU33.spec.ts.
ELIMINAR: src/catalog/catalog-main.js (la reemplaza src/pages/HU33.js).

TAMBIÉN MODIFICADOS: src/pages/HU31.js y src/pages/HU34.js (importan catalog.css, que antes solo cargaba HU33),
src/story-navigation.js (ya trae las 15 historias), vitest.config.js (lcov + src/api-client.js), README.md, docs/pruebas-manuales.md.

Requiere los archivos del repo que no van en esta entrega: src/story-admin-page.js, src/story-sidebar.js y src/style.css.
