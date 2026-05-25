# CU8 - Gestionar mantenimiento de impresoras

**Date**: 2026-05-24

## Case

Permitir que el administrador marque una impresora activa como `MANTENIMIENTO`, impedir que reciba nuevas impresiones y bloquear el cambio directo desde `IMPRIMIENDO` hasta que la impresion actual se finalice o cancele.

## Plan Followed

- Usar el modulo existente `printers` para la transicion de estado.
- Mantener `MANTENIMIENTO` como estado operativo activo, no como baja logica.
- Reutilizar `assertPrinterCanReceivePrint` e `isPrinterAvailableForAssignment` para que asignacion manual y automatica compartan la regla: solo `LISTA` puede recibir impresiones.
- Preservar los flujos existentes de `print-jobs` como unica forma de resolver una impresion `CORRIENDO` antes de mantenimiento.

## Implementation

- Se agregaron tests de service para `LISTA -> MANTENIMIENTO`, `MANTENIMIENTO -> LISTA`, rechazo de impresoras inactivas y rechazo de transiciones manuales desde/hacia `IMPRIMIENDO`.
- Se agregaron tests de asignacion manual y automatica para asegurar que impresoras en `MANTENIMIENTO` no reciben nuevas impresiones.
- Se ajusto el fake `InMemoryPrintJobRepository` para simular la liberacion de impresora que el repositorio Prisma real hace al cancelar/finalizar una impresion.
- Se agrego un test de flujo donde una impresora `IMPRIMIENDO` no puede entrar en mantenimiento hasta cancelar la impresion activa y volver a `LISTA`.

## Verification

- `pnpm test -- src/tests/printer.service.test.ts src/tests/print-job.service.test.ts src/tests/assignment.service.test.ts`
  - 3 files passed, 39 tests passed.
- `pnpm lint`
  - TypeScript validation passed.
- `pnpm test`
  - 4 files passed, 49 tests passed.
