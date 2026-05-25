# CU7 - Automatic Assignment Memory

## Context

Feature CU7 adds automatic assignment of pending print jobs to available printers using `AUTOMATICO`, `POR_DURACION`, and `POR_LARGO_PEDIDO` strategies.

## Plan Followed

- Created a dedicated `assignments` module for batch assignment orchestration.
- Added domain types, schema validation, stable business error codes, and repository abstractions.
- Implemented Prisma-backed and in-memory assignment repositories.
- Wired a new `POST /api/v1/assignments/print-jobs` endpoint.
- Added service tests covering all three strategies and invalid input paths.

## Implementation

- `PrintJob` and `Printer` now support assignment through the existing schema relation and `printerId`.
- Automatic assignment pairs the first available printer with the first eligible pending print job in deterministic order.
- Duration strategy filters pending jobs by estimated duration.
- Order-length strategy filters by the number of pending jobs on each order.
- Each assignment updates `PrintJob.status`, `PrintJob.startedAt`, `PrintJob.printerId`, and `Printer.status` atomically.

## Verification

- `pnpm test`
- `pnpm lint`
- `pnpm prisma:generate`
