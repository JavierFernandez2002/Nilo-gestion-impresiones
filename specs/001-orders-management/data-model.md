# Data Model: CU9 - Consultar estadisticas de produccion

## Existing Entities

### PrintJob

Fields used:

- `id`: print job identifier.
- `status`: `PENDIENTE`, `CORRIENDO`, `FINALIZADA`, `CANCELADA`.
- `active`: only active print jobs are counted.
- `finishedAt`: event date for finished-print series.
- `cancelledAt`: event date for cancelled-print count when date filters are applied.

Validation and counting rules:

- Finished series count only `active = true`, `status = FINALIZADA`, `finishedAt != null`.
- Cancelled count uses `active = true`, `status = CANCELADA`.
- When `from`/`to` filters are present, cancelled count requires `cancelledAt != null` inside range.

### Printer

Fields used:

- `id`: printer identifier.
- `status`: `LISTA`, `IMPRIMIENDO`, `MANTENIMIENTO`.
- `active`: only active printers are counted.

Validation and counting rules:

- `maintenancePrinterCount` counts active printers with `status = MANTENIMIENTO`.
- Utilization numerator counts active printers with `status = IMPRIMIENDO`.
- Utilization denominator counts all active printers.

### Order

Fields used:

- `id`: order identifier.
- `status`: `PENDIENTE`, `INCOMPLETO`, `LISTO_EN_TALLER`, `ENTREGADO`, `CANCELADO`.
- `active`: only active orders are counted.

Validation and counting rules:

- `readyOrderCount` counts active orders with `status = LISTO_EN_TALLER`.
- `deliveredOrderCount` counts active orders with `status = ENTREGADO`.

## New Domain Types

### ProductionStatisticsRequest

Fields:

- `from`: optional ISO date string parsed to Date.
- `to`: optional ISO date string parsed to Date.
- `includeUtilization`: optional boolean, default false.
- `includeOrders`: optional boolean, default false.

Validation rules:

- `from` and `to` must be valid ISO dates when present.
- If both are present, `from <= to`.
- Boolean query params accept actual booleans or string values `true`/`false`.

### TimeBucketCount

Fields:

- `period`: string bucket key.
- `count`: non-negative integer.

Bucket formats:

- Day: `YYYY-MM-DD`.
- Week: ISO `YYYY-Www`.
- Month: `YYYY-MM`.

### ProductionStatisticsResult

Required fields:

- `finishedPrintsByDay`: `TimeBucketCount[]`.
- `finishedPrintsByWeek`: `TimeBucketCount[]`.
- `finishedPrintsByMonth`: `TimeBucketCount[]`.
- `maintenancePrinterCount`: number.
- `cancelledPrintJobCount`: number.

Optional fields:

- `printerUtilizationPercentage`: number, present only when `includeUtilization=true`.
- `readyOrderCount`: number, present only when `includeOrders=true`.
- `deliveredOrderCount`: number, present only when `includeOrders=true`.

### FinishedPrintEvent

Fields:

- `finishedAt`: Date.

Rules:

- The repository returns only eligible finished print events.
- Service groups events into day/week/month buckets.

## Derived Calculations

```text
printerUtilizationPercentage =
  activePrinterCount === 0
    ? 0
    : roundToTwoDecimals(activePrintingPrinterCount / activePrinterCount * 100)
```

Temporal filtering:

```text
from <= eventDate <= to
```

When one bound is missing, only the provided bound is applied.
