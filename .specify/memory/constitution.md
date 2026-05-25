<!--
Sync Impact Report
Version change: 1.0.0 -> 1.0.1
Modified principles:
- [PRINCIPLE_1_NAME] -> I. Cero Codigo Huerfano
- [PRINCIPLE_2_NAME] -> II. Arquitectura por Capas Estrictas
- [PRINCIPLE_3_NAME] -> III. Validacion y Fallos Consistentes
- [PRINCIPLE_4_NAME] -> IV. Testing con Aislamiento de Infraestructura
Added sections:
- Technical Standards
- Delivery Workflow
Removed sections:
- none
Templates requiring updates:
- none
Follow-up TODOs: none
-->
# Nilo Gestion de Impresiones Constitution

## Core Principles

### I. Cero Codigo Huerfano

Toda implementacion MUST estar respaldada por una especificacion vigente en
`docs/specs` o en el directorio Spec Kit activo de la feature. No se permite
agregar endpoints, entidades, campos, servicios, repositorios, integraciones,
frontend, autenticacion ni comportamiento incidental que no este descrito en la
spec aplicable.

El alcance de cada cambio MUST poder trazarse a un requisito, regla de negocio,
caso de uso o criterio de aceptacion. Si durante la implementacion aparece una
necesidad no especificada, el trabajo MUST detener esa parte y actualizar la spec
antes de codear. El codigo experimental, duplicado, muerto o preparado para un
futuro no aprobado MUST eliminarse o quedar fuera del cambio.

Rationale: el proyecto se gobierna por Spec-Driven Development; la trazabilidad
reduce ambiguedad, alcance accidental y deuda tecnica invisible.

### II. Arquitectura por Capas Estrictas

El backend MUST separar rutas, controladores, servicios, repositorios, schemas,
errores y tests. Cada capa tiene una responsabilidad unica:

- Routes: declarar paths bajo `/api/v1`, middlewares y wiring HTTP.
- Controllers: traducir request/response y delegar; no contienen reglas de
  negocio ni acceso directo a persistencia.
- Services: implementar reglas de negocio, transiciones de estado, decisiones de
  dominio y coordinacion transaccional.
- Repositories: encapsular Prisma y cualquier detalle de PostgreSQL.
- Schemas: contener validaciones Zod de entrada y tipos derivados.
- Errors: definir codigos estables y mapear errores de dominio a respuestas API.
- Tests: verificar reglas, contratos y flujos sin mezclar responsabilidades.

Ninguna capa superior MAY exponer detalles internos de infraestructura. Los
controllers MUST depender de services; los services MUST depender de
repositorios o puertos equivalentes; las rutas no MAY invocar Prisma ni reglas
de dominio directamente. Frontend y autenticacion estan fuera de alcance salvo
que una spec los solicite explicitamente.

Rationale: la separacion estricta permite probar reglas de negocio sin servidor
HTTP ni base real, y mantiene el cambio localizado por modulo.

### III. Validacion y Fallos Consistentes

Toda entrada externa MUST validarse con Zod antes de ejecutar logica de negocio.
Esto incluye `body`, `params`, `query` y cualquier payload de integracion. Los
schemas MUST aplicar normalizacion explicita cuando corresponda, como `trim`,
limites de longitud, enums, numeros positivos, fechas validas e IPv4 validas.

Los errores de negocio MUST usar codigos estables, documentados y especificos
del dominio, por ejemplo `PRINTER_NAME_ALREADY_EXISTS`. Los codigos no MAY
cambiarse por ajustes de texto o traduccion. La salida JSON de error MUST tener
este formato:

```json
{
  "error": {
    "code": "STABLE_ERROR_CODE",
    "message": "Human readable message"
  }
}
```

Las respuestas no MAY exponer stack traces, errores crudos de Prisma,
constraints internas de base de datos, variables de entorno ni detalles de
infraestructura. Los fallos de validacion, no encontrado, conflicto, regla de
negocio e infraestructura MUST mapearse de forma consistente a status HTTP y
payload JSON.

Rationale: contratos de error estables permiten clientes predecibles, pruebas
claras y cambios internos sin romper consumidores.

### IV. Testing con Aislamiento de Infraestructura

Vitest es el framework obligatorio para tests automatizados. Cada regla de
negocio importante MUST tener tests unitarios de service o dominio. Los tests
MUST usar mocks, fakes o in-memory adapters para aislar Prisma, PostgreSQL,
servidor HTTP, red, reloj y filesystem salvo que la spec requiera una prueba de
integracion.

Los tests de controllers o rutas SHOULD verificar validacion, delegacion,
status HTTP y formato JSON, usando dependencias mockeadas. Los tests de
repositorios o integracion MAY tocar infraestructura real solo cuando el plan lo
declare, el entorno este listo y los datos queden aislados y limpiables. No se
permite depender de orden global, estado compartido, servicios externos ni datos
manuales.

Antes de finalizar una tarea, los tests relevantes MUST ejecutarse cuando el
entorno lo permita. Si no pueden ejecutarse, la entrega MUST explicar la razon y
el riesgo residual.

Rationale: el aislamiento mantiene las pruebas rapidas, deterministas y utiles
para gobernar reglas de negocio antes que detalles de infraestructura.

## Technical Standards

El stack base del proyecto es Node.js, Express, TypeScript, Zod, Prisma,
PostgreSQL, Vitest y pnpm. Las APIs REST MUST usar nombres claros, consistentes
y versionados bajo `/api/v1`.

Los modulos iniciales reconocidos son `printers`, `orders`, `print-jobs`,
`assignments` y `statistics`. Cada modulo MUST conservar la separacion de capas
definida por esta constitucion y documentar sus reglas en specs antes de
implementar cambios.

Las entidades y transiciones de estado MUST tratarse como reglas de dominio,
no como decisiones ad hoc en controllers. Las bajas logicas, concurrencia,
unicidad, estados permitidos y calculos derivados MUST estar especificados,
testeados y ubicados en services o dominio.

## Delivery Workflow

Cada feature MUST iniciar desde una spec. El plan de implementacion MUST declarar
alcance, estructura de archivos, dependencias, reglas aplicables, validaciones,
errores esperados y estrategia de testing. Las tareas MUST organizarse de forma
trazable por historia, regla o criterio de aceptacion.

Al cerrar un trabajo significativo, el agente MUST registrar un historial breve
en `.specify/memory` del proyecto con el caso de uso, el plan seguido, la
implementacion realizada y la verificacion ejecutada. Ese historial forma parte
del rastro operativo del proyecto y no reemplaza la spec ni el plan.

Antes de codear, el Constitution Check del plan MUST confirmar:

- No hay trabajo fuera de spec.
- La estructura separa routes, controllers, services, repositories, schemas,
  errors y tests.
- Toda entrada externa tiene schema Zod previsto.
- Todo fallo de negocio tiene codigo estable y salida JSON consistente.
- Las reglas de negocio relevantes tienen tests Vitest aislados.

Una implementacion que viole un principio MUST justificar la excepcion en el
plan y obtener aprobacion explicita antes de continuar. Las excepciones no se
convierten en precedente.

## Governance

Esta constitucion tiene prioridad sobre practicas informales, preferencias
locales y codigo existente que contradiga sus reglas. AGENTS.md y las specs del
proyecto complementan esta constitucion, pero no pueden relajar sus principios
sin una enmienda.

Las enmiendas MUST modificar este documento, actualizar plantillas o docs
afectados y registrar el impacto en el Sync Impact Report. El versionado usa
SemVer:

- MAJOR: elimina o redefine principios de forma incompatible.
- MINOR: agrega principios, secciones o reglas de cumplimiento materiales.
- PATCH: aclara redaccion sin cambiar obligaciones.

Cada plan, task list y revision de codigo MUST verificar cumplimiento
constitucional. Si una spec contradice esta constitucion, la spec MUST
corregirse o la constitucion MUST enmendarse antes de implementar.

**Version**: 1.0.1 | **Ratified**: 2026-05-24 | **Last Amended**: 2026-05-24
