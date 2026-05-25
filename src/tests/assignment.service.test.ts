import { describe, expect, it } from "vitest";
import { AssignmentRequest } from "../domain/assignments/assignment.js";
import { AssignmentService } from "../services/assignment.service.js";
import { InMemoryAssignmentRepository } from "./fakes/in-memory-assignment.repository.js";
import { Order, OrderPrint } from "../domain/orders/order.js";
import { Printer } from "../domain/printers/printer.js";
import { PrintJob } from "../domain/print-jobs/print-job.js";

function makeDate(offsetMinutes = 0): Date {
  return new Date(Date.UTC(2026, 4, 24, 12, offsetMinutes, 0));
}

function makePrinter(overrides: Partial<Printer> = {}): Printer {
  const now = makeDate();
  const name = overrides.name ?? "Nilo 01";

  return {
    id: overrides.id ?? "printer-1",
    name,
    normalizedName: overrides.normalizedName ?? name.trim().toLowerCase(),
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
  const now = makeDate();
  const orderCode = overrides.orderCode ?? "PED-001";

  return {
    id: overrides.id ?? "order-1",
    orderCode,
    normalizedOrderCode: overrides.normalizedOrderCode ?? orderCode.trim().toLowerCase(),
    customerName: overrides.customerName ?? "Cliente A",
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

function makePrintJob(overrides: Partial<PrintJob> = {}): PrintJob {
  const now = makeDate();

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

function makeOrderPrint(overrides: Partial<OrderPrint> = {}): OrderPrint {
  const now = makeDate();

  return {
    id: overrides.id ?? "order-print-1",
    orderId: overrides.orderId ?? "order-1",
    printJobId: overrides.printJobId ?? "print-1",
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now
  };
}

function makeService(
  printers: Printer[] = [],
  orders: Order[] = [],
  orderPrints: OrderPrint[] = [],
  printJobs: PrintJob[] = []
): AssignmentService {
  return new AssignmentService(new InMemoryAssignmentRepository(printers, orders, orderPrints, printJobs));
}

async function expectBusinessError(action: () => Promise<unknown>, code: string): Promise<void> {
  await expect(action()).rejects.toMatchObject({ code });
}

describe("AssignmentService", () => {
  it("assigns pending print jobs automatically up to available printer capacity", async () => {
    const printers = [
      makePrinter({ id: "printer-1", createdAt: makeDate(1) }),
      makePrinter({ id: "printer-2", createdAt: makeDate(2) }),
      makePrinter({ id: "printer-3", createdAt: makeDate(3) }),
      makePrinter({ id: "printer-4", createdAt: makeDate(4) }),
      makePrinter({ id: "printer-5", createdAt: makeDate(5) })
    ];
    const orders = Array.from({ length: 20 }, (_, index) =>
      makeOrder({
        id: `order-${index + 1}`,
        orderCode: `PED-${index + 1}`,
        createdAt: makeDate(index)
      })
    );
    const orderPrints = Array.from({ length: 20 }, (_, index) =>
      makeOrderPrint({
        id: `link-${index + 1}`,
        orderId: `order-${index + 1}`,
        printJobId: `print-${index + 1}`,
        createdAt: makeDate(index)
      })
    );
    const printJobs = Array.from({ length: 20 }, (_, index) =>
      makePrintJob({
        id: `print-${index + 1}`,
        createdAt: makeDate(index)
      })
    );

    const service = makeService(printers, orders, orderPrints, printJobs);
    const result = await service.assignPendingPrints({ strategy: "AUTOMATICO" });

    expect(result.strategy).toBe("AUTOMATICO");
    expect(result.assignedCount).toBe(5);
    expect(result.availablePrinterCount).toBe(5);
    expect(result.eligiblePrintJobCount).toBe(20);
    expect(result.assignments).toHaveLength(5);
    expect(new Set(result.assignments.map((item) => item.printerId)).size).toBe(5);
    expect(result.assignments.every((item) => item.status === "CORRIENDO" && item.printerStatus === "IMPRIMIENDO")).toBe(true);
  });

  it("returns zero assignments when there are no printers or no candidates", async () => {
    const emptyService = makeService();
    const noPrinters = await emptyService.assignPendingPrints({ strategy: "AUTOMATICO" });
    expect(noPrinters.assignedCount).toBe(0);
    expect(noPrinters.availablePrinterCount).toBe(0);
    expect(noPrinters.eligiblePrintJobCount).toBe(0);

    const printers = [makePrinter({ id: "printer-1" })];
    const noCandidatesService = makeService(printers, [makeOrder({ id: "order-1" })], [], []);
    const noCandidates = await noCandidatesService.assignPendingPrints({ strategy: "AUTOMATICO" });
    expect(noCandidates.assignedCount).toBe(0);
    expect(noCandidates.availablePrinterCount).toBe(1);
    expect(noCandidates.eligiblePrintJobCount).toBe(0);
  });

  it("excludes maintenance printers from automatic assignment capacity", async () => {
    const printers = [
      makePrinter({ id: "printer-1", status: "MANTENIMIENTO" }),
      makePrinter({ id: "printer-2", status: "LISTA" })
    ];
    const service = makeService(
      printers,
      [makeOrder({ id: "order-1" })],
      [makeOrderPrint({ orderId: "order-1", printJobId: "print-1" })],
      [makePrintJob({ id: "print-1" })]
    );

    const result = await service.assignPendingPrints({ strategy: "AUTOMATICO" });

    expect(result.availablePrinterCount).toBe(1);
    expect(result.assignedCount).toBe(1);
    expect(result.assignments[0]?.printerId).toBe("printer-2");
  });

  it("returns zero assignments when all active printers are unavailable for maintenance or printing", async () => {
    const printers = [
      makePrinter({ id: "printer-1", status: "MANTENIMIENTO" }),
      makePrinter({ id: "printer-2", status: "IMPRIMIENDO" })
    ];
    const service = makeService(
      printers,
      [makeOrder({ id: "order-1" })],
      [makeOrderPrint({ orderId: "order-1", printJobId: "print-1" })],
      [makePrintJob({ id: "print-1" })]
    );

    const result = await service.assignPendingPrints({ strategy: "AUTOMATICO" });

    expect(result.availablePrinterCount).toBe(0);
    expect(result.eligiblePrintJobCount).toBe(1);
    expect(result.assignedCount).toBe(0);
    expect(result.assignments).toEqual([]);
  });

  it("orders automatic candidates by order, link and print creation", async () => {
    const printers = [makePrinter({ id: "printer-1" }), makePrinter({ id: "printer-2" })];
    const orders = [
      makeOrder({ id: "order-1", createdAt: makeDate(1) }),
      makeOrder({ id: "order-2", createdAt: makeDate(0) })
    ];
    const orderPrints = [
      makeOrderPrint({ id: "link-1", orderId: "order-1", printJobId: "print-1", createdAt: makeDate(1) }),
      makeOrderPrint({ id: "link-2", orderId: "order-2", printJobId: "print-2", createdAt: makeDate(0) })
    ];
    const printJobs = [
      makePrintJob({ id: "print-1", createdAt: makeDate(1) }),
      makePrintJob({ id: "print-2", createdAt: makeDate(0) })
    ];

    const service = makeService(printers, orders, orderPrints, printJobs);
    const result = await service.assignPendingPrints({ strategy: "AUTOMATICO" });

    expect(result.assignments.map((item) => item.printJobId)).toEqual(["print-2", "print-1"]);
  });

  it("excludes inactive, delivered and cancelled orders from candidate selection", async () => {
    const printers = [makePrinter({ id: "printer-1" })];
    const orders = [
      makeOrder({ id: "order-1", status: "PENDIENTE" }),
      makeOrder({ id: "order-2", status: "ENTREGADO" }),
      makeOrder({ id: "order-3", status: "CANCELADO" }),
      makeOrder({ id: "order-4", active: false })
    ];
    const orderPrints = [
      makeOrderPrint({ orderId: "order-1", printJobId: "print-1" }),
      makeOrderPrint({ orderId: "order-2", printJobId: "print-2" }),
      makeOrderPrint({ orderId: "order-3", printJobId: "print-3" }),
      makeOrderPrint({ orderId: "order-4", printJobId: "print-4" })
    ];
    const printJobs = [
      makePrintJob({ id: "print-1" }),
      makePrintJob({ id: "print-2" }),
      makePrintJob({ id: "print-3" }),
      makePrintJob({ id: "print-4" })
    ];

    const service = makeService(printers, orders, orderPrints, printJobs);
    const result = await service.assignPendingPrints({ strategy: "AUTOMATICO" });

    expect(result.eligiblePrintJobCount).toBe(1);
    expect(result.assignments.map((item) => item.printJobId)).toEqual(["print-1"]);
  });

  it("assigns only jobs within the requested duration limit", async () => {
    const printers = [makePrinter({ id: "printer-1" }), makePrinter({ id: "printer-2" })];
    const orders = [makeOrder({ id: "order-1" }), makeOrder({ id: "order-2" })];
    const orderPrints = [
      makeOrderPrint({ orderId: "order-1", printJobId: "print-1" }),
      makeOrderPrint({ orderId: "order-2", printJobId: "print-2" })
    ];
    const printJobs = [
      makePrintJob({ id: "print-1", estimatedDurationHours: 2 }),
      makePrintJob({ id: "print-2", estimatedDurationHours: 4 }),
      makePrintJob({ id: "print-3", estimatedDurationHours: 5 }),
      makePrintJob({ id: "print-4", estimatedDurationHours: null })
    ];
    const extraOrderPrints = [
      makeOrderPrint({ id: "link-3", orderId: "order-1", printJobId: "print-3" }),
      makeOrderPrint({ id: "link-4", orderId: "order-2", printJobId: "print-4" })
    ];

    const service = makeService(printers, orders, [...orderPrints, ...extraOrderPrints], printJobs);
    const result = await service.assignPendingPrints({
      strategy: "POR_DURACION",
      maxEstimatedDurationHours: 4
    });

    expect(result.eligiblePrintJobCount).toBe(2);
    expect(result.assignments.map((item) => item.printJobId)).toEqual(["print-1", "print-2"]);
  });

  it("rejects invalid duration assignments", async () => {
    const service = makeService();

    await expectBusinessError(() => service.assignPendingPrints({ strategy: "POR_DURACION" } as AssignmentRequest), "ASSIGNMENT_DURATION_REQUIRED");
    await expectBusinessError(
      () => service.assignPendingPrints({ strategy: "POR_DURACION", maxEstimatedDurationHours: 0 }),
      "ASSIGNMENT_DURATION_INVALID"
    );
  });

  it("assigns only orders within the requested pending-print range", async () => {
    const printers = [makePrinter({ id: "printer-1" }), makePrinter({ id: "printer-2" }), makePrinter({ id: "printer-3" })];
    const orders = [
      makeOrder({ id: "order-1", createdAt: makeDate(0) }),
      makeOrder({ id: "order-2", createdAt: makeDate(1) }),
      makeOrder({ id: "order-3", createdAt: makeDate(2) })
    ];
    const orderPrints = [
      makeOrderPrint({ id: "link-1", orderId: "order-1", printJobId: "print-1", createdAt: makeDate(0) }),
      makeOrderPrint({ id: "link-2", orderId: "order-2", printJobId: "print-2", createdAt: makeDate(1) }),
      makeOrderPrint({ id: "link-3", orderId: "order-2", printJobId: "print-3", createdAt: makeDate(2) }),
      makeOrderPrint({ id: "link-4", orderId: "order-3", printJobId: "print-4", createdAt: makeDate(3) }),
      makeOrderPrint({ id: "link-5", orderId: "order-3", printJobId: "print-5", createdAt: makeDate(4) }),
      makeOrderPrint({ id: "link-6", orderId: "order-3", printJobId: "print-6", createdAt: makeDate(5) })
    ];
    const printJobs = [
      makePrintJob({ id: "print-1" }),
      makePrintJob({ id: "print-2" }),
      makePrintJob({ id: "print-3" }),
      makePrintJob({ id: "print-4" }),
      makePrintJob({ id: "print-5" }),
      makePrintJob({ id: "print-6" })
    ];

    const service = makeService(printers, orders, orderPrints, printJobs);
    const result = await service.assignPendingPrints({
      strategy: "POR_LARGO_PEDIDO",
      maxPendingPrints: 3
    });

    expect(result.eligiblePrintJobCount).toBe(6);
    expect(result.assignments.map((item) => item.printJobId)).toEqual(["print-1", "print-2", "print-3"]);
  });

  it("supports minimum and range filters for order length assignments", async () => {
    const printers = [makePrinter({ id: "printer-1" }), makePrinter({ id: "printer-2" })];
    const orders = [makeOrder({ id: "order-1" }), makeOrder({ id: "order-2" })];
    const orderPrints = [
      makeOrderPrint({ orderId: "order-1", printJobId: "print-1" }),
      makeOrderPrint({ orderId: "order-1", printJobId: "print-2" }),
      makeOrderPrint({ orderId: "order-2", printJobId: "print-3" }),
      makeOrderPrint({ orderId: "order-2", printJobId: "print-4" })
    ];
    const printJobs = [
      makePrintJob({ id: "print-1" }),
      makePrintJob({ id: "print-2" }),
      makePrintJob({ id: "print-3" }),
      makePrintJob({ id: "print-4" })
    ];
    const service = makeService(printers, orders, orderPrints, printJobs);

    const minimumOnly = await service.assignPendingPrints({
      strategy: "POR_LARGO_PEDIDO",
      minPendingPrints: 2
    });
    expect(minimumOnly.eligiblePrintJobCount).toBe(4);
    expect(minimumOnly.assignedCount).toBe(2);

    const rangeService = makeService(printers, orders, orderPrints, printJobs);
    const range = await rangeService.assignPendingPrints({
      strategy: "POR_LARGO_PEDIDO",
      minPendingPrints: 2,
      maxPendingPrints: 2
    });
    expect(range.eligiblePrintJobCount).toBe(4);
    expect(range.assignedCount).toBe(2);
  });

  it("rejects invalid order length filters", async () => {
    const service = makeService();

    await expectBusinessError(
      () => service.assignPendingPrints({ strategy: "POR_LARGO_PEDIDO" } as AssignmentRequest),
      "ASSIGNMENT_ORDER_LENGTH_FILTER_REQUIRED"
    );

    await expectBusinessError(
      () => service.assignPendingPrints({ strategy: "POR_LARGO_PEDIDO", maxPendingPrints: 0 }),
      "ASSIGNMENT_ORDER_LENGTH_INVALID"
    );

    await expectBusinessError(
      () => service.assignPendingPrints({ strategy: "POR_LARGO_PEDIDO", minPendingPrints: 4, maxPendingPrints: 3 }),
      "ASSIGNMENT_ORDER_LENGTH_INVALID"
    );
  });
});
