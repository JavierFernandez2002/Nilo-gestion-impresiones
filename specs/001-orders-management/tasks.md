# Tasks: CU9 - Consultar estadisticas de produccion

**Input**: Design documents from `specs/001-orders-management/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/statistics-api.md`, `quickstart.md`

**Tests**: Required by the feature spec independent test criteria and project constitution. Write service tests before implementation and keep them isolated from Prisma/PostgreSQL.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks.
- **[Story]**: User story label, required only for user story phases.
- Each task includes exact file paths.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the statistics module skeleton and shared domain types.

- [X] T001 Create statistics domain directory in `src/domain/statistics/`
- [X] T002 [P] Create statistics route/controller/service/repository/schema placeholders in `src/routes/statistics.routes.ts`, `src/controllers/statistics.controller.ts`, `src/services/statistics.service.ts`, `src/repositories/statistics.repository.ts`, and `src/schemas/statistics.schemas.ts`
- [X] T003 [P] Create statistics test and fake repository placeholders in `src/tests/statistics.service.test.ts` and `src/tests/fakes/in-memory-statistics.repository.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, validation, errors, and repository contract required by all statistics stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Define `ProductionStatisticsRequest`, `TimeBucketCount`, `ProductionStatisticsResult`, and `FinishedPrintEvent` in `src/domain/statistics/production-statistics.ts`
- [X] T005 Define `STATISTICS_INVALID_DATE_RANGE` in `src/domain/errors/business-error.ts`
- [X] T006 Implement date range validation, UTC day/month bucket helpers, ISO week bucket helper, and round-to-two-decimals helper in `src/domain/statistics/statistics-rules.ts`
- [X] T007 Implement Zod query schema for `GET /api/v1/statistics/production` in `src/schemas/statistics.schemas.ts`
- [X] T008 Define `StatisticsRepository` interface for finished print events, cancelled count, maintenance count, active printer counts, and order counts in `src/repositories/statistics.repository.ts`
- [X] T009 Implement `InMemoryStatisticsRepository` with deterministic filtering support in `src/tests/fakes/in-memory-statistics.repository.ts`
- [X] T010 Wire `statisticsRouter` under `/api/v1/statistics` in `src/routes/index.ts`

**Checkpoint**: Foundation ready. Story implementation can begin.

---

## Phase 3: User Story 1 - Ver impresiones finalizadas por periodo (Priority: P1) MVP

**Goal**: Return finished print counts grouped by day, ISO week, and month.

**Independent Test**: With `FINALIZADA` print jobs across several `finishedAt` dates, statistics returns correct day/week/month buckets and excludes non-finished jobs.

### Tests for User Story 1

- [X] T011 [US1] Add service test for grouping finished prints by UTC day in `src/tests/statistics.service.test.ts`
- [X] T012 [US1] Add service test for grouping finished prints by ISO week and month in `src/tests/statistics.service.test.ts`
- [X] T013 [US1] Add service test excluding non-finalized print jobs and finalized jobs without `finishedAt` in `src/tests/statistics.service.test.ts`
- [X] T014 [US1] Add service test applying inclusive `from` and `to` filters to finished print events in `src/tests/statistics.service.test.ts`

### Implementation for User Story 1

- [X] T015 [US1] Implement finished print event retrieval in `src/repositories/statistics.repository.ts`
- [X] T016 [US1] Implement day/week/month grouping in `src/services/statistics.service.ts`
- [X] T017 [US1] Implement `StatisticsController.getProductionStatistics` response envelope in `src/controllers/statistics.controller.ts`
- [X] T018 [US1] Implement `GET /production` route in `src/routes/statistics.routes.ts`
- [X] T019 [US1] Verify User Story 1 behavior with `pnpm test -- src/tests/statistics.service.test.ts`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Ver estado operativo general (Priority: P1)

**Goal**: Return maintenance printer count and cancelled print job count.

**Independent Test**: With active maintenance printers and cancelled print jobs, statistics returns `maintenancePrinterCount` and `cancelledPrintJobCount` correctly.

### Tests for User Story 2

- [X] T020 [US2] Add service test counting only active printers in `MANTENIMIENTO` in `src/tests/statistics.service.test.ts`
- [X] T021 [US2] Add service test counting cancelled active print jobs without date filters in `src/tests/statistics.service.test.ts`
- [X] T022 [US2] Add service test applying inclusive `from` and `to` filters to cancelled print jobs by `cancelledAt` in `src/tests/statistics.service.test.ts`
- [X] T023 [US2] Add service test returning empty series and zero counts when no data exists in `src/tests/statistics.service.test.ts`

### Implementation for User Story 2

- [X] T024 [US2] Implement maintenance printer count in `src/repositories/statistics.repository.ts`
- [X] T025 [US2] Implement cancelled print job count with optional date range in `src/repositories/statistics.repository.ts`
- [X] T026 [US2] Extend `StatisticsService.getProductionStatistics` with maintenance and cancelled counts in `src/services/statistics.service.ts`
- [X] T027 [US2] Verify User Story 2 behavior with `pnpm test -- src/tests/statistics.service.test.ts`

**Checkpoint**: Required production statistics are functional.

---

## Phase 5: User Story 3 - Ver indicadores opcionales de utilizacion y pedidos (Priority: P2)

**Goal**: Include printer utilization and ready/delivered order counts only when requested.

**Independent Test**: With `includeUtilization=true` and `includeOrders=true`, statistics returns utilization percentage plus ready and delivered order counts; without flags those fields are omitted.

### Tests for User Story 3

- [X] T028 [US3] Add service test calculating `printerUtilizationPercentage` from active printers in `src/tests/statistics.service.test.ts`
- [X] T029 [US3] Add service test returning utilization `0` when there are no active printers in `src/tests/statistics.service.test.ts`
- [X] T030 [US3] Add service test including `readyOrderCount` and `deliveredOrderCount` only when `includeOrders=true` in `src/tests/statistics.service.test.ts`
- [X] T031 [US3] Add service test omitting optional utilization and order fields when flags are false in `src/tests/statistics.service.test.ts`
- [X] T032 [US3] Add validation test for invalid date range in `src/tests/statistics.service.test.ts`

### Implementation for User Story 3

- [X] T033 [US3] Implement active printer total and active printing count in `src/repositories/statistics.repository.ts`
- [X] T034 [US3] Implement ready and delivered order counts in `src/repositories/statistics.repository.ts`
- [X] T035 [US3] Extend `StatisticsService.getProductionStatistics` with optional utilization and order indicators in `src/services/statistics.service.ts`
- [X] T036 [US3] Verify User Story 3 behavior with `pnpm test -- src/tests/statistics.service.test.ts`

**Checkpoint**: All CU9 statistics are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation alignment, and regression checks.

- [X] T037 [P] Review `specs/001-orders-management/contracts/statistics-api.md` against implemented endpoint and response fields
- [X] T038 [P] Review `specs/001-orders-management/quickstart.md` against actual statistics endpoint
- [X] T039 Run TypeScript validation with `pnpm lint`
- [X] T040 Run full regression suite with `pnpm test`
- [X] T041 Record implementation and verification history for CU9 in `.specify/memory/cu9-production-statistics.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2 and is the MVP.
- **User Story 2 (Phase 4)**: Depends on Phase 2 and can be implemented after or alongside US1 once service result shape exists.
- **User Story 3 (Phase 5)**: Depends on Phase 2 and can be implemented after required fields are stable.
- **Polish (Phase 6)**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories after foundation.
- **US2 (P1)**: No business dependency on US1, but shares response assembly.
- **US3 (P2)**: Optional indicators depend on foundation and extend the same endpoint.

### Within Each User Story

- Tests first, expected to fail before implementation.
- Repository read methods before service aggregation that consumes them.
- Service behavior before controller and route wiring.
- Run `pnpm test` at each checkpoint.

## Parallel Opportunities

- T002 and T003 can run in parallel.
- T011 through T014 touch the same test file, so coordinate edits but scenarios can be drafted independently.
- T020 through T023 touch the same test file, so coordinate edits but scenarios can be drafted independently.
- T024 and T025 can be implemented together in repository after tests exist.
- T033 and T034 can run in parallel because they implement independent repository queries.
- T037 and T038 can run in parallel.

## Execution Example: User Story 1

```text
Task: "T011 [US1] Add service test for grouping finished prints by UTC day in src/tests/statistics.service.test.ts"
Task: "T012 [US1] Add service test for grouping finished prints by ISO week and month in src/tests/statistics.service.test.ts"
Task: "T013 [US1] Add service test excluding non-finalized print jobs and finalized jobs without finishedAt in src/tests/statistics.service.test.ts"
Task: "T014 [US1] Add service test applying inclusive from and to filters to finished print events in src/tests/statistics.service.test.ts"
```

## Execution Example: User Story 2

```text
Task: "T020 [US2] Add service test counting only active printers in MANTENIMIENTO in src/tests/statistics.service.test.ts"
Task: "T021 [US2] Add service test counting cancelled active print jobs without date filters in src/tests/statistics.service.test.ts"
Task: "T022 [US2] Add service test applying inclusive from and to filters to cancelled print jobs by cancelledAt in src/tests/statistics.service.test.ts"
```

## Execution Example: User Story 3

```text
Task: "T028 [US3] Add service test calculating printerUtilizationPercentage from active printers in src/tests/statistics.service.test.ts"
Task: "T029 [US3] Add service test returning utilization 0 when there are no active printers in src/tests/statistics.service.test.ts"
Task: "T030 [US3] Add service test including readyOrderCount and deliveredOrderCount only when includeOrders=true in src/tests/statistics.service.test.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundation.
3. Complete Phase 3 finished-print series.
4. Stop and validate with statistics service tests.

### Incremental Delivery

1. Deliver finished-print series by day/week/month.
2. Add required operational counts for maintenance printers and cancelled prints.
3. Add optional utilization and order counts behind query flags.
4. Finish with docs, quickstart validation, lint, regression tests, and memory record.

### Notes

- Do not add snapshot tables or migrations.
- Do not add frontend, auth, export features, or charts.
- Use event dates for temporal metrics.
- Keep optional fields omitted unless requested.
