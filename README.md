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
