# Quickstart: CU9 - Consultar estadisticas de produccion

## Prerequisites

- Node.js compatible with the project.
- pnpm 9.x.
- PostgreSQL configured through `DATABASE_URL` for runtime and Prisma commands.

## Planned Commands

Install dependencies if needed:

```powershell
pnpm install
```

Generate Prisma client after schema changes, if any:

```powershell
pnpm prisma:generate
```

Run tests:

```powershell
pnpm test
```

Run type check:

```powershell
pnpm lint
```

Start API locally:

```powershell
pnpm dev
```

## Manual API Checks

Basic production statistics:

```http
GET /api/v1/statistics/production
```

Expected behavior:

- Response status is `200`.
- Response includes `finishedPrintsByDay`, `finishedPrintsByWeek`, `finishedPrintsByMonth`, `maintenancePrinterCount` and `cancelledPrintJobCount`.
- Optional fields are omitted.

Statistics for a date range:

```http
GET /api/v1/statistics/production?from=2026-05-01&to=2026-05-31
```

Expected behavior:

- Finished print series use `finishedAt` within the inclusive range.
- Cancelled print count uses `cancelledAt` within the inclusive range.
- Buckets are ordered ascendentemente.

Include optional indicators:

```http
GET /api/v1/statistics/production?includeUtilization=true&includeOrders=true
```

Expected behavior:

- Response includes `printerUtilizationPercentage`.
- Response includes `readyOrderCount` and `deliveredOrderCount`.

Invalid range:

```http
GET /api/v1/statistics/production?from=2026-06-01&to=2026-05-01
```

Expected behavior:

- Response uses standard error envelope.
- Error code is `VALIDATION_ERROR` or a stable statistics validation code depending on implementation.
