# Feature Specification: CU9 - Consultar estadisticas de produccion

**Feature Branch**: `001-orders-management`
**Created**: 2026-05-24
**Status**: Draft
**Input**: El usuario puede ver metricas generales de produccion: impresiones finalizadas por dia, semana y mes; maquinas en mantenimiento; impresiones canceladas; y, de forma opcional, porcentaje de utilizacion de impresoras y cantidad de pedidos listos y entregados.

## User Stories & Testing

### User Story 1 - Ver impresiones finalizadas por periodo (Priority: P1)

Como administrador del taller, quiero consultar cuantas impresiones se finalizaron por dia, semana y mes para entender el ritmo de produccion.

**Independent Test**: Con impresiones `FINALIZADA` en distintas fechas de `finishedAt`, consultar estadisticas y verificar que los conteos por dia, semana y mes agrupan solo impresiones finalizadas dentro del rango solicitado.

**Acceptance Scenarios**:

1. **Given** existen impresiones `FINALIZADA` con `finishedAt`, **When** el usuario consulta estadisticas de produccion, **Then** la respuesta incluye series `finishedPrintsByDay`, `finishedPrintsByWeek` y `finishedPrintsByMonth`.
2. **Given** existen impresiones no finalizadas o finalizadas sin `finishedAt`, **When** se calculan las series, **Then** esas impresiones no aportan a los conteos por periodo.
3. **Given** el usuario informa `from` y `to`, **When** consulta estadisticas, **Then** solo se incluyen impresiones finalizadas con `finishedAt` dentro del rango inclusivo.

### User Story 2 - Ver estado operativo general (Priority: P1)

Como administrador, quiero ver cuantas maquinas estan en mantenimiento y cuantas impresiones se cancelaron para detectar problemas operativos.

**Independent Test**: Con impresoras activas en `MANTENIMIENTO` y varias impresiones `CANCELADA`, consultar estadisticas y verificar `maintenancePrinterCount` y `cancelledPrintJobCount`.

**Acceptance Scenarios**:

1. **Given** hay impresoras activas e inactivas en `MANTENIMIENTO`, **When** se consultan estadisticas, **Then** solo las impresoras activas en mantenimiento se cuentan.
2. **Given** hay impresiones `CANCELADA`, **When** se consultan estadisticas, **Then** la respuesta incluye la cantidad total cancelada en el rango solicitado cuando tienen `cancelledAt`.
3. **Given** hay impresiones canceladas sin fecha de cancelacion, **When** se consulta con rango temporal, **Then** no se incluyen porque no pueden ubicarse en el periodo.

### User Story 3 - Ver indicadores opcionales de utilizacion y pedidos (Priority: P2)

Como administrador, quiero incluir indicadores opcionales de utilizacion de impresoras y pedidos listos/entregados para tener un resumen mas completo cuando lo necesite.

**Independent Test**: Con impresoras en distintos estados y pedidos `LISTO_EN_TALLER`/`ENTREGADO`, consultar estadisticas con `includeUtilization=true` e `includeOrders=true` y verificar que se devuelven `printerUtilizationPercentage`, `readyOrderCount` y `deliveredOrderCount`.

**Acceptance Scenarios**:

1. **Given** el usuario informa `includeUtilization=true`, **When** consulta estadisticas, **Then** la respuesta incluye porcentaje de utilizacion de impresoras.
2. **Given** no existen impresoras activas, **When** se calcula utilizacion, **Then** el porcentaje devuelto es `0`.
3. **Given** el usuario informa `includeOrders=true`, **When** consulta estadisticas, **Then** la respuesta incluye cantidad de pedidos `LISTO_EN_TALLER` y `ENTREGADO`.
4. **Given** no se solicitan indicadores opcionales, **When** se consulta estadisticas, **Then** la respuesta omite esos campos opcionales.

## Requirements

### Functional Requirements

- **FR-001**: El sistema MUST exponer una operacion API bajo `/api/v1/statistics/production` para consultar estadisticas generales de produccion.
- **FR-002**: La operacion MUST aceptar filtros opcionales `from` y `to` como fechas ISO para acotar metricas temporales.
- **FR-003**: La operacion MUST validar que `from <= to` cuando ambos filtros estan presentes.
- **FR-004**: La respuesta MUST incluir `finishedPrintsByDay` con conteos de impresiones `FINALIZADA` agrupadas por dia de `finishedAt`.
- **FR-005**: La respuesta MUST incluir `finishedPrintsByWeek` con conteos de impresiones `FINALIZADA` agrupadas por semana calendario de `finishedAt`.
- **FR-006**: La respuesta MUST incluir `finishedPrintsByMonth` con conteos de impresiones `FINALIZADA` agrupadas por mes de `finishedAt`.
- **FR-007**: Las metricas de impresiones finalizadas MUST contar solo impresiones activas con `status = FINALIZADA` y `finishedAt` no nulo.
- **FR-008**: La respuesta MUST incluir `maintenancePrinterCount` contando solo impresoras activas con `status = MANTENIMIENTO`.
- **FR-009**: La respuesta MUST incluir `cancelledPrintJobCount` contando impresiones activas `CANCELADA`; si hay filtros temporales, se usa `cancelledAt` no nulo dentro del rango.
- **FR-010**: Si `includeUtilization=true`, la respuesta MUST incluir `printerUtilizationPercentage`.
- **FR-011**: `printerUtilizationPercentage` MUST calcularse como impresoras activas `IMPRIMIENDO` sobre total de impresoras activas, multiplicado por 100 y redondeado a dos decimales.
- **FR-012**: Si no hay impresoras activas, `printerUtilizationPercentage` MUST ser `0`.
- **FR-013**: Si `includeOrders=true`, la respuesta MUST incluir `readyOrderCount` para pedidos activos `LISTO_EN_TALLER` y `deliveredOrderCount` para pedidos activos `ENTREGADO`.
- **FR-014**: La operacion MUST responder exitosamente con series vacias y conteos en cero cuando no existan datos.
- **FR-015**: Los errores de validacion MUST usar el envelope estandar `{ "error": { "code": "...", "message": "..." } }`.

### Business Rules

- **BR-001**: Las series temporales usan fechas de evento (`finishedAt`, `cancelledAt`), no `createdAt` ni `updatedAt`.
- **BR-002**: Los buckets de dia usan formato `YYYY-MM-DD`.
- **BR-003**: Los buckets de semana usan formato ISO `YYYY-Www`.
- **BR-004**: Los buckets de mes usan formato `YYYY-MM`.
- **BR-005**: Los buckets se devuelven ordenados ascendentemente por periodo.
- **BR-006**: Las metricas opcionales se calculan solo cuando se solicitan para mantener una respuesta inicial simple.

## Key Entities

- **Production Statistics Request**: query params opcionales `from`, `to`, `includeUtilization`, `includeOrders`.
- **Production Statistics Result**: respuesta agregada con series y conteos.
- **PrintJob**: fuente para impresiones finalizadas y canceladas.
- **Printer**: fuente para maquinas en mantenimiento y utilizacion.
- **Order**: fuente opcional para pedidos listos y entregados.

## Out of Scope

- Frontend.
- Autenticacion y permisos.
- Exportacion CSV/PDF.
- Graficos o visualizaciones.
- Persistir snapshots historicos de estadisticas.
- Metricas por material, cliente, impresora individual, duracion real o ingresos.
- Zonas horarias configurables por usuario; se usa agrupacion UTC inicial.
