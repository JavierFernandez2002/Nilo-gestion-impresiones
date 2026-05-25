import { describe, expect, it } from "vitest";
import { BusinessError } from "../domain/errors/business-error.js";
import { Order } from "../domain/orders/order.js";
import { PrintJob } from "../domain/print-jobs/print-job.js";
import { Printer } from "../domain/printers/printer.js";
import { normalizePrinterName } from "../domain/printers/printer-rules.js";
import { StatisticsService } from "../services/statistics.service.js";
import { InMemoryStatisticsRepository } from "./fakes/in-memory-statistics.repository.js";

function makeDate(value: string): Date {
  return new Date(value);
}

function makePrintJob(overrides: Partial<PrintJob> = {}): PrintJob {
  const now = makeDate("2026-05-01T00:00:00.000Z");

  return {
    id: overrides.id ?? "print-1",
    printerId: overrides.printerId ?? null,
    modelName: overrides.modelName ?? "Soporte",
    modelCode: overrides.modelCode ?? null,
    material: overrides.material ?? null,
    color: overrides.color ?? null,
    estimatedDurationHours: overrides.estimatedDurationHours ?? null,
    status: overrides.status ?? "PENDIENTE",
    startedAt: overrides.startedAt ?? null,
    finishedAt: overrides.finishedAt ?? null,
    cancelledAt: overrides.cancelledAt ?? null,
    observations: overrides.observations ?? null,
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now
  };
}

function makePrinter(overrides: Partial<Printer> = {}): Printer {
  const now = makeDate("2026-05-01T00:00:00.000Z");
  const name = overrides.name ?? "Nilo 01";

  return {
    id: overrides.id ?? "printer-1",
    name,
    normalizedName: overrides.normalizedName ?? normalizePrinterName(name),
    status: overrides.status ?? "LISTA",
    model: overrides.model ?? null,
    location: overrides.location ?? null,
    ipWifi: overrides.ipWifi ?? null,
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now
  };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  const now = makeDate("2026-05-01T00:00:00.000Z");
  const orderCode = overrides.orderCode ?? "PED-001";

  return {
    id: overrides.id ?? "order-1",
    orderCode,
    normalizedOrderCode: overrides.normalizedOrderCode ?? orderCode.trim().toLowerCase(),
    customerName: overrides.customerName ?? null,
    status: overrides.status ?? "PENDIENTE",
    progressPercentage: overrides.progressPercentage ?? 0,
    estimatedDeliveryDate: overrides.estimatedDeliveryDate ?? null,
    deliveredAt: overrides.deliveredAt ?? null,
    cancelledAt: overrides.cancelledAt ?? null,
    observations: overrides.observations ?? null,
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now
  };
}

function makeService(printJobs: PrintJob[] = [], printers: Printer[] = [], orders: Order[] = []): StatisticsService {
  return new StatisticsService(new InMemoryStatisticsRepository(printJobs, printers, orders));
}

async function expectBusinessError(action: () => Promise<unknown>, code: string): Promise<void> {
  await expect(action()).rejects.toMatchObject({ code });
}

describe("StatisticsService", () => {
  it("groups finished prints by UTC day", async () => {
    const service = makeService([
      makePrintJob({ id: "print-1", status: "FINALIZADA", finishedAt: makeDate("2026-05-01T10:00:00.000Z") }),
      makePrintJob({ id: "print-2", status: "FINALIZADA", finishedAt: makeDate("2026-05-01T23:00:00.000Z") }),
      makePrintJob({ id: "print-3", status: "FINALIZADA", finishedAt: makeDate("2026-05-02T01:00:00.000Z") })
    ]);

    const result = await service.getProductionStatistics({ includeUtilization: false, includeOrders: false });

    expect(result.finishedPrintsByDay).toEqual([
      { period: "2026-05-01", count: 2 },
      { period: "2026-05-02", count: 1 }
    ]);
  });

  it("groups finished prints by ISO week and month", async () => {
    const service = makeService([
      makePrintJob({ id: "print-1", status: "FINALIZADA", finishedAt: makeDate("2026-01-01T10:00:00.000Z") }),
      makePrintJob({ id: "print-2", status: "FINALIZADA", finishedAt: makeDate("2026-01-04T10:00:00.000Z") }),
      makePrintJob({ id: "print-3", status: "FINALIZADA", finishedAt: makeDate("2026-02-01T10:00:00.000Z") })
    ]);

    const result = await service.getProductionStatistics({ includeUtilization: false, includeOrders: false });

    expect(result.finishedPrintsByWeek).toEqual([
      { period: "2026-W01", count: 2 },
      { period: "2026-W05", count: 1 }
    ]);
    expect(result.finishedPrintsByMonth).toEqual([
      { period: "2026-01", count: 2 },
      { period: "2026-02", count: 1 }
    ]);
  });

  it("excludes non-finalized print jobs and finalized jobs without finishedAt", async () => {
    const service = makeService([
      makePrintJob({ id: "print-1", status: "FINALIZADA", finishedAt: makeDate("2026-05-01T10:00:00.000Z") }),
      makePrintJob({ id: "print-2", status: "CORRIENDO", finishedAt: makeDate("2026-05-01T10:00:00.000Z") }),
      makePrintJob({ id: "print-3", status: "FINALIZADA", finishedAt: null }),
      makePrintJob({ id: "print-4", status: "FINALIZADA", finishedAt: makeDate("2026-05-01T11:00:00.000Z"), active: false })
    ]);

    const result = await service.getProductionStatistics({ includeUtilization: false, includeOrders: false });

    expect(result.finishedPrintsByDay).toEqual([{ period: "2026-05-01", count: 1 }]);
  });

  it("applies inclusive from and to filters to finished print events", async () => {
    const service = makeService([
      makePrintJob({ id: "print-1", status: "FINALIZADA", finishedAt: makeDate("2026-04-30T23:59:59.999Z") }),
      makePrintJob({ id: "print-2", status: "FINALIZADA", finishedAt: makeDate("2026-05-01T00:00:00.000Z") }),
      makePrintJob({ id: "print-3", status: "FINALIZADA", finishedAt: makeDate("2026-05-31T23:59:59.999Z") }),
      makePrintJob({ id: "print-4", status: "FINALIZADA", finishedAt: makeDate("2026-06-01T00:00:00.000Z") })
    ]);

    const result = await service.getProductionStatistics({
      from: makeDate("2026-05-01T00:00:00.000Z"),
      to: makeDate("2026-05-31T23:59:59.999Z"),
      includeUtilization: false,
      includeOrders: false
    });

    expect(result.finishedPrintsByDay).toEqual([
      { period: "2026-05-01", count: 1 },
      { period: "2026-05-31", count: 1 }
    ]);
  });

  it("counts only active printers in maintenance", async () => {
    const service = makeService([], [
      makePrinter({ id: "printer-1", status: "MANTENIMIENTO", active: true }),
      makePrinter({ id: "printer-2", status: "MANTENIMIENTO", active: false }),
      makePrinter({ id: "printer-3", status: "LISTA", active: true })
    ]);

    const result = await service.getProductionStatistics({ includeUtilization: false, includeOrders: false });

    expect(result.maintenancePrinterCount).toBe(1);
  });

  it("counts cancelled active print jobs without date filters", async () => {
    const service = makeService([
      makePrintJob({ id: "print-1", status: "CANCELADA", cancelledAt: makeDate("2026-05-01T10:00:00.000Z") }),
      makePrintJob({ id: "print-2", status: "CANCELADA", cancelledAt: null }),
      makePrintJob({ id: "print-3", status: "CANCELADA", active: false }),
      makePrintJob({ id: "print-4", status: "FINALIZADA" })
    ]);

    const result = await service.getProductionStatistics({ includeUtilization: false, includeOrders: false });

    expect(result.cancelledPrintJobCount).toBe(2);
  });

  it("applies inclusive from and to filters to cancelled print jobs by cancelledAt", async () => {
    const service = makeService([
      makePrintJob({ id: "print-1", status: "CANCELADA", cancelledAt: makeDate("2026-04-30T23:59:59.999Z") }),
      makePrintJob({ id: "print-2", status: "CANCELADA", cancelledAt: makeDate("2026-05-01T00:00:00.000Z") }),
      makePrintJob({ id: "print-3", status: "CANCELADA", cancelledAt: makeDate("2026-05-31T23:59:59.999Z") }),
      makePrintJob({ id: "print-4", status: "CANCELADA", cancelledAt: null })
    ]);

    const result = await service.getProductionStatistics({
      from: makeDate("2026-05-01T00:00:00.000Z"),
      to: makeDate("2026-05-31T23:59:59.999Z"),
      includeUtilization: false,
      includeOrders: false
    });

    expect(result.cancelledPrintJobCount).toBe(2);
  });

  it("returns empty series and zero counts when no data exists", async () => {
    const result = await makeService().getProductionStatistics({ includeUtilization: false, includeOrders: false });

    expect(result).toEqual({
      finishedPrintsByDay: [],
      finishedPrintsByWeek: [],
      finishedPrintsByMonth: [],
      maintenancePrinterCount: 0,
      cancelledPrintJobCount: 0
    });
  });

  it("calculates printer utilization percentage from active printers", async () => {
    const service = makeService([], [
      makePrinter({ id: "printer-1", status: "IMPRIMIENDO", active: true }),
      makePrinter({ id: "printer-2", status: "LISTA", active: true }),
      makePrinter({ id: "printer-3", status: "MANTENIMIENTO", active: true }),
      makePrinter({ id: "printer-4", status: "IMPRIMIENDO", active: false })
    ]);

    const result = await service.getProductionStatistics({ includeUtilization: true, includeOrders: false });

    expect(result.printerUtilizationPercentage).toBe(33.33);
  });

  it("returns utilization zero when there are no active printers", async () => {
    const service = makeService([], [makePrinter({ id: "printer-1", status: "IMPRIMIENDO", active: false })]);

    const result = await service.getProductionStatistics({ includeUtilization: true, includeOrders: false });

    expect(result.printerUtilizationPercentage).toBe(0);
  });

  it("includes ready and delivered order counts only when includeOrders is true", async () => {
    const service = makeService([], [], [
      makeOrder({ id: "order-1", status: "LISTO_EN_TALLER" }),
      makeOrder({ id: "order-2", status: "LISTO_EN_TALLER", active: false }),
      makeOrder({ id: "order-3", status: "ENTREGADO" }),
      makeOrder({ id: "order-4", status: "PENDIENTE" })
    ]);

    const result = await service.getProductionStatistics({ includeUtilization: false, includeOrders: true });

    expect(result.readyOrderCount).toBe(1);
    expect(result.deliveredOrderCount).toBe(1);
  });

  it("omits optional utilization and order fields when flags are false", async () => {
    const service = makeService([], [makePrinter({ status: "IMPRIMIENDO" })], [makeOrder({ status: "ENTREGADO" })]);

    const result = await service.getProductionStatistics({ includeUtilization: false, includeOrders: false });

    expect(result).not.toHaveProperty("printerUtilizationPercentage");
    expect(result).not.toHaveProperty("readyOrderCount");
    expect(result).not.toHaveProperty("deliveredOrderCount");
  });

  it("rejects invalid date ranges", async () => {
    const service = makeService();

    await expectBusinessError(
      () =>
        service.getProductionStatistics({
          from: makeDate("2026-06-01T00:00:00.000Z"),
          to: makeDate("2026-05-01T00:00:00.000Z"),
          includeUtilization: false,
          includeOrders: false
        }),
      "STATISTICS_INVALID_DATE_RANGE"
    );
    await expect(
      service.getProductionStatistics({
        from: makeDate("2026-06-01T00:00:00.000Z"),
        to: makeDate("2026-05-01T00:00:00.000Z"),
        includeUtilization: false,
        includeOrders: false
      })
    ).rejects.toBeInstanceOf(BusinessError);
  });
});
