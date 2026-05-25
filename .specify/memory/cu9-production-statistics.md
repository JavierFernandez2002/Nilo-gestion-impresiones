# CU9 - Consultar estadisticas de produccion

**Date**: 2026-05-24

## Case

Agregar una consulta backend de estadisticas generales de produccion con impresiones finalizadas por dia, semana y mes; maquinas en mantenimiento; impresiones canceladas; y metricas opcionales de utilizacion de impresoras y pedidos listos/entregados.

## Plan Followed

- Crear un modulo `statistics` de solo lectura con routes, controller, service, repository, schema, dominio y tests.
- Calcular metricas desde entidades existentes `PrintJob`, `Printer` y `Order` sin agregar tablas ni migraciones.
- Usar fechas de evento (`finishedAt`, `cancelledAt`) para metricas temporales y agrupacion UTC deterministica.
- Mantener indicadores opcionales omitidos salvo que `includeUtilization` o `includeOrders` esten activos.

## Implementation

- Se agrego `GET /api/v1/statistics/production`.
- Se agregaron tipos de dominio para request, buckets, eventos y resultado de estadisticas.
- Se implementaron helpers para validacion de rango, buckets UTC por dia/mes, semana ISO y redondeo de porcentaje.
- Se agrego `PrismaStatisticsRepository` para obtener eventos y conteos agregados.
- Se agrego `StatisticsService` para armar series, conteos requeridos y campos opcionales.
- Se agrego schema Zod para query params `from`, `to`, `includeUtilization` e `includeOrders`.
- Se agrego fake in-memory y tests aislados de service para los tres user stories.
- Se agrego el error estable `STATISTICS_INVALID_DATE_RANGE`.

## Verification

- `pnpm test -- src/tests/statistics.service.test.ts`
  - 1 file passed, 13 tests passed.
- `pnpm lint`
  - TypeScript validation passed.
- `pnpm test`
  - 5 files passed, 62 tests passed.
