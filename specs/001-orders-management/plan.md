# Implementation Plan: CU9 - Consultar estadisticas de produccion

**Branch**: `001-orders-management` | **Date**: 2026-05-24 | **Spec**: `specs/001-orders-management/spec.md`

**Input**: Feature specification from `specs/001-orders-management/spec.md`

## Summary

Implementar una operacion backend de solo lectura para consultar metricas generales de produccion. La solucion agrega un modulo `statistics` con route, controller, service, repository, schemas, dominio y tests. No agrega tablas nuevas: calcula conteos desde `PrintJob`, `Printer` y `Order` existentes usando fechas de evento y filtros opcionales.

## Technical Context

**Language/Version**: TypeScript 5.7 sobre Node.js.

**Primary Dependencies**: Express 4, Zod 3, Prisma 6, `@prisma/client`, Vitest 3, pnpm.

**Storage**: PostgreSQL via Prisma; entidades existentes `PrintJob`, `Printer`, `Order`.

**Testing**: Vitest con fakes/in-memory para service, reglas de agrupacion y validacion. Integracion Prisma no requerida para CU9 inicial.

**Target Platform**: Backend API Node.js.

**Project Type**: Web service REST.

**Performance Goals**: Consultas agregadas acotadas por rango temporal; evitar cargar entidades completas cuando el repositorio pueda contar/agrupar.

**Constraints**: Mantener envelope de error estandar, Zod para query params, separacion estricta por capas, sin frontend ni autenticacion.

**Scale/Scope**: Dashboard operativo inicial para metricas generales; sin historicos persistidos ni analitica avanzada.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **No orphan code**: PASS. El endpoint, tipos, filtros y metricas trazan a FR-001 a FR-015.
- **Layered architecture**: PASS. Se planifica modulo `statistics` con routes, controller, service, repository, schemas, dominio y tests.
- **Validation and failures**: PASS. Query params externos se validan con Zod y los errores usan envelope JSON estandar.
- **Testing discipline**: PASS. Agrupaciones, filtros, conteos y opciones se cubren con Vitest usando repositorio in-memory.
- **Scope exclusions**: PASS. Frontend, auth, exportaciones, snapshots y metricas avanzadas quedan excluidos.

## Project Structure

### Documentation (this feature)

```text
specs/001-orders-management/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- statistics-api.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/
|-- routes/
|   |-- statistics.routes.ts
|   `-- index.ts
|-- controllers/
|   `-- statistics.controller.ts
|-- services/
|   `-- statistics.service.ts
|-- repositories/
|   `-- statistics.repository.ts
|-- schemas/
|   `-- statistics.schemas.ts
|-- domain/
|   `-- statistics/
|       |-- production-statistics.ts
|       `-- statistics-rules.ts
`-- tests/
    |-- statistics.service.test.ts
    `-- fakes/
        `-- in-memory-statistics.repository.ts
```

**Structure Decision**: Agregar modulo `statistics` porque la operacion combina datos de `PrintJob`, `Printer` y `Order` sin pertenecer exclusivamente a ninguno de esos modulos.

## Phase 0: Research

Output: `research.md`

Decisiones cerradas:

- Sin schema nuevo ni tabla de snapshots.
- Agrupacion temporal inicial en UTC.
- Series por dia, semana ISO y mes usando fechas de evento.
- Utilizacion opcional como impresoras activas `IMPRIMIENDO` sobre total de impresoras activas.
- Pedidos opcionales contando activos `LISTO_EN_TALLER` y `ENTREGADO`.

## Phase 1: Design & Contracts

Output:

- `data-model.md`
- `contracts/statistics-api.md`
- `quickstart.md`
- `AGENTS.md` ya referencia este plan.

## Implementation Notes

- `StatisticsService.getProductionStatistics(input)` valida reglas de rango y coordina conteos.
- El repositorio debe exponer metodos de lectura para impresiones finalizadas/canceladas, impresoras por estado y pedidos por estado.
- Las agrupaciones se pueden hacer en service sobre eventos normalizados o en repository si Prisma permite consultas eficientes; mantener el contrato del service estable.
- Los buckets temporales deben ordenarse ascendentemente y omitir periodos sin datos en CU9 inicial.
- `includeUtilization` e `includeOrders` controlan la presencia de campos opcionales en la respuesta.

## Complexity Tracking

No constitutional violations or complexity exceptions.

## Post-Design Constitution Check

- **No orphan code**: PASS. Los artefactos de diseno cubren solo CU9.
- **Layered architecture**: PASS. El contrato y data model mantienen separacion por capas.
- **Validation and failures**: PASS. `statistics.schemas.ts` y validacion de rango estan previstos.
- **Testing discipline**: PASS. `statistics.service.test.ts` cubre agrupaciones, filtros, conteos y opcionales.
- **Scope exclusions**: PASS. No hay frontend, auth, snapshots ni exportaciones.
