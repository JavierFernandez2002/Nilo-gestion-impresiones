# API Contract: CU9 - Consultar estadisticas de produccion

## GET `/api/v1/statistics/production`

Returns general production metrics.

### Query Parameters

- `from`: optional ISO date, inclusive lower bound for event-date metrics.
- `to`: optional ISO date, inclusive upper bound for event-date metrics.
- `includeUtilization`: optional boolean, defaults to `false`.
- `includeOrders`: optional boolean, defaults to `false`.

Example:

```http
GET /api/v1/statistics/production?from=2026-05-01&to=2026-05-31&includeUtilization=true&includeOrders=true
```

### Success Response

Status: `200 OK`

```json
{
  "data": {
    "finishedPrintsByDay": [
      { "period": "2026-05-01", "count": 3 },
      { "period": "2026-05-02", "count": 1 }
    ],
    "finishedPrintsByWeek": [
      { "period": "2026-W18", "count": 4 }
    ],
    "finishedPrintsByMonth": [
      { "period": "2026-05", "count": 4 }
    ],
    "maintenancePrinterCount": 2,
    "cancelledPrintJobCount": 5,
    "printerUtilizationPercentage": 37.5,
    "readyOrderCount": 6,
    "deliveredOrderCount": 12
  }
}
```

When optional indicators are not requested:

```json
{
  "data": {
    "finishedPrintsByDay": [],
    "finishedPrintsByWeek": [],
    "finishedPrintsByMonth": [],
    "maintenancePrinterCount": 0,
    "cancelledPrintJobCount": 0
  }
}
```

### Error Responses

Validation error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "from: Invalid date"
  }
}
```

Invalid date range:

```json
{
  "error": {
    "code": "STATISTICS_INVALID_DATE_RANGE",
    "message": "Statistics date range must have from before or equal to to."
  }
}
```

### Contract Rules

- Finished print series count only active print jobs with `status = FINALIZADA` and non-null `finishedAt`.
- Cancelled print count uses active print jobs with `status = CANCELADA`; with date filters, it requires non-null `cancelledAt` inside the range.
- Maintenance printer count uses active printers with `status = MANTENIMIENTO`.
- Utilization is present only when `includeUtilization=true`.
- Order counts are present only when `includeOrders=true`.
