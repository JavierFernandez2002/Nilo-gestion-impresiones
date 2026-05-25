import { describe, expect, it } from "vitest";
import { BusinessError } from "../domain/errors/business-error.js";
import { mapErrorToHttp } from "../domain/errors/http-error-mapper.js";
import { Order, OrderPrint } from "../domain/orders/order.js";
import { normalizeOrderCode } from "../domain/orders/order-rules.js";
import { PrintJob } from "../domain/print-jobs/print-job.js";
import { OrderService } from "../services/order.service.js";
import { PrintJobService } from "../services/print-job.service.js";
import { InMemoryOrderRepository } from "./fakes/in-memory-order.repository.js";
import { InMemoryPrintJobRepository } from "./fakes/in-memory-print-job.repository.js";
import { Printer } from "../domain/printers/printer.js";
import { normalizePrinterName } from "../domain/printers/printer-rules.js";
import { InMemoryPrinterRepository } from "./fakes/in-memory-printer.repository.js";
import { PrinterService } from "../services/printer.service.js";

function makeOrder(overrides: Partial<Order> = {}): Order {
  const now = new Date();
  const orderCode = overrides.orderCode ?? "PED-001";

  return {
    id: overrides.id ?? "order-1",
    orderCode,
    normalizedOrderCode: overrides.normalizedOrderCode ?? normalizeOrderCode(orderCode),
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
  const now = new Date();

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
  const now = new Date();
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

function makeOrderPrint(overrides: Partial<OrderPrint> = {}): OrderPrint {
  const now = new Date();

  return {
    id: overrides.id ?? "order-print-1",
    orderId: overrides.orderId ?? "order-1",
    printJobId: overrides.printJobId ?? "print-1",
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now
  };
}

async function expectBusinessError(action: () => Promise<unknown>, code: string): Promise<void> {
  await expect(action()).rejects.toMatchObject({ code });
}

function makeService(
  orders: Order[] = [makeOrder()],
  printJobs: PrintJob[] = [],
  orderPrints: OrderPrint[] = [],
  statuses: Record<string, string | null> = {},
  printers: Printer[] = [makePrinter()]
): {
  service: PrintJobService;
  orderRepository: InMemoryOrderRepository;
  printerRepository: InMemoryPrinterRepository;
  printerService: PrinterService;
} {
  const orderRepository = new InMemoryOrderRepository(orders, orderPrints, statuses);
  const orderService = new OrderService(orderRepository);
  const printerRepository = new InMemoryPrinterRepository(printers);
  const printerService = new PrinterService(printerRepository);
  const printJobRepository = new InMemoryPrintJobRepository(printJobs, orderPrints, {
    onCreateOrderPrint: async (data) => {
      await orderRepository.createPrint(data);
      orderRepository.setPrintStatus(data.printJobId, "PENDIENTE");
    },
    onUpdateOrderPrint: async (id, data) => {
      await orderRepository.updatePrint(id, data);
    },
    onStatusChange: (printJobId, status) => {
      orderRepository.setPrintStatus(printJobId, status);
    },
    onReleasePrinter: async (printerId, status) => {
      await printerRepository.update(printerId, { status });
    }
  });

  return {
    service: new PrintJobService(printJobRepository, orderService, printerService),
    orderRepository,
    printerRepository,
    printerService
  };
}

describe("PrintJobService", () => {
  it("creates a valid print job linked to an active order", async () => {
    const { service, orderRepository } = makeService();

    const printJob = await service.create({
      orderId: "order-1",
      modelName: " Soporte ",
      material: " PLA ",
      estimatedDurationHours: 2.5
    });

    const links = await orderRepository.findPrintsByOrderId("order-1", true);
    const order = await orderRepository.findById("order-1");

    expect(printJob.modelName).toBe("Soporte");
    expect(printJob.material).toBe("PLA");
    expect(printJob.status).toBe("PENDIENTE");
    expect(printJob.active).toBe(true);
    expect(links).toHaveLength(1);
    expect(order?.status).toBe("PENDIENTE");
    expect(order?.progressPercentage).toBe(0);
  });

  it("fails when model name is missing or order is not available", async () => {
    const { service } = makeService();
    await expectBusinessError(() => service.create({ orderId: "order-1", modelName: "   " }), "PRINT_JOB_MODEL_NAME_REQUIRED");

    const delivered = makeService([makeOrder({ status: "ENTREGADO" })]).service;
    await expectBusinessError(() => delivered.create({ orderId: "order-1", modelName: "Soporte" }), "PRINT_JOB_ORDER_NOT_AVAILABLE");

    const missing = makeService([]).service;
    await expectBusinessError(() => missing.create({ orderId: "missing", modelName: "Soporte" }), "ORDER_NOT_FOUND");
  });

  it("lists and filters by status, active and order", async () => {
    const linkedPrint = makeOrderPrint({ printJobId: "print-1" });
    const { service } = makeService(
      [makeOrder()],
      [
        makePrintJob({ id: "print-1", status: "FINALIZADA" }),
        makePrintJob({ id: "print-2", status: "PENDIENTE" }),
        makePrintJob({ id: "print-3", status: "PENDIENTE", active: false })
      ],
      [linkedPrint],
      { "print-1": "FINALIZADA" }
    );

    await expect(service.list({ status: "PENDIENTE" })).resolves.toHaveLength(1);
    await expect(service.list({ active: false })).resolves.toHaveLength(1);
    await expect(service.list({ orderId: "order-1" })).resolves.toHaveLength(1);
  });

  it("edits descriptive fields only when pending or running and active", async () => {
    const { service } = makeService([makeOrder()], [makePrintJob()]);

    const updated = await service.update("print-1", { modelName: "Nuevo", color: "Negro", observations: "Ok" });

    expect(updated.modelName).toBe("Nuevo");
    expect(updated.color).toBe("Negro");

    await expectBusinessError(
      () => makeService([makeOrder()], [makePrintJob({ status: "FINALIZADA" })]).service.update("print-1", { modelName: "X" }),
      "PRINT_JOB_CANNOT_BE_CHANGED"
    );
    await expectBusinessError(
      () => makeService([makeOrder()], [makePrintJob({ status: "CANCELADA" })]).service.update("print-1", { modelName: "X" }),
      "PRINT_JOB_CANNOT_BE_CHANGED"
    );
    await expectBusinessError(
      () => makeService([makeOrder()], [makePrintJob({ active: false })]).service.update("print-1", { modelName: "X" }),
      "PRINT_JOB_INACTIVE"
    );
  });

  it("assigns a ready printer to a pending print job and marks it running", async () => {
    const printers = [makePrinter({ id: "printer-1", status: "LISTA" })];
    const { service, orderRepository } = makeService(
      [makeOrder({ status: "PENDIENTE", progressPercentage: 0 })],
      [makePrintJob({ id: "print-1" })],
      [makeOrderPrint({ id: "link-1", printJobId: "print-1" })],
      { "print-1": "PENDIENTE" },
      printers
    );

    const assigned = await service.assignPrinter("print-1", "printer-1");
    const order = await orderRepository.findById("order-1");

    expect(assigned.printerId).toBe("printer-1");
    expect(assigned.status).toBe("CORRIENDO");
    expect(assigned.startedAt).toBeInstanceOf(Date);
    expect(order?.status).toBe("PENDIENTE");
    expect(order?.progressPercentage).toBe(0);
  });

  it("rejects assigning unavailable printers or non-pending jobs", async () => {
    await expectBusinessError(
      () =>
        makeService(
          [makeOrder()],
          [makePrintJob({ id: "print-1" })],
          [makeOrderPrint({ id: "link-1", printJobId: "print-1" })],
          { "print-1": "PENDIENTE" },
          [makePrinter({ id: "printer-1", status: "IMPRIMIENDO" })]
        ).service.assignPrinter("print-1", "printer-1"),
      "PRINTER_ALREADY_PRINTING"
    );

    await expectBusinessError(
      () =>
        makeService(
          [makeOrder()],
          [makePrintJob({ id: "print-1", status: "CORRIENDO" })],
          [makeOrderPrint({ id: "link-1", printJobId: "print-1" })],
          { "print-1": "CORRIENDO" },
          [makePrinter({ id: "printer-1", status: "LISTA" })]
        ).service.assignPrinter("print-1", "printer-1"),
      "PRINT_JOB_CANNOT_BE_ASSIGNED"
    );
  });

  it("rejects assigning a pending print job to a maintenance printer", async () => {
    await expectBusinessError(
      () =>
        makeService(
          [makeOrder()],
          [makePrintJob({ id: "print-1" })],
          [makeOrderPrint({ id: "link-1", printJobId: "print-1" })],
          { "print-1": "PENDIENTE" },
          [makePrinter({ id: "printer-1", status: "MANTENIMIENTO" })]
        ).service.assignPrinter("print-1", "printer-1"),
      "PRINTER_IN_MAINTENANCE"
    );
  });

  it("cancels pending and running print jobs, then recalculates order progress", async () => {
    const links = [makeOrderPrint({ id: "link-1", printJobId: "print-1" }), makeOrderPrint({ id: "link-2", printJobId: "print-2" })];
    const { service, orderRepository } = makeService(
      [makeOrder({ status: "INCOMPLETO", progressPercentage: 50 })],
      [
        makePrintJob({ id: "print-1", status: "CORRIENDO", printerId: "printer-1" }),
        makePrintJob({ id: "print-2", status: "FINALIZADA" })
      ],
      links,
      { "print-1": "CORRIENDO", "print-2": "FINALIZADA" }
    );

    const cancelled = await service.cancel("print-1");
    const order = await orderRepository.findById("order-1");

    expect(cancelled.status).toBe("CANCELADA");
    expect(cancelled.cancelledAt).toBeInstanceOf(Date);
    expect(cancelled.printerId).toBeNull();
    expect(order?.status).toBe("LISTO_EN_TALLER");
    expect(order?.progressPercentage).toBe(100);

    await expectBusinessError(() => service.cancel("print-2"), "PRINT_JOB_CANNOT_BE_CANCELLED");
  });

  it("finishes only running print jobs and recalculates the linked order", async () => {
    const links = [makeOrderPrint({ id: "link-1", printJobId: "print-1" }), makeOrderPrint({ id: "link-2", printJobId: "print-2" })];
    const { service, orderRepository } = makeService(
      [makeOrder()],
      [
        makePrintJob({ id: "print-1", status: "CORRIENDO", printerId: "printer-1" }),
        makePrintJob({ id: "print-2", status: "PENDIENTE" })
      ],
      links,
      { "print-1": "CORRIENDO", "print-2": "PENDIENTE" }
    );

    const finished = await service.finish("print-1");
    const order = await orderRepository.findById("order-1");

    expect(finished.status).toBe("FINALIZADA");
    expect(finished.finishedAt).toBeInstanceOf(Date);
    expect(finished.printerId).toBeNull();
    expect(order?.status).toBe("INCOMPLETO");
    expect(order?.progressPercentage).toBe(50);

    await expectBusinessError(() => service.finish("print-2"), "PRINT_JOB_CANNOT_BE_FINISHED");
  });

  it("allows maintenance only after an active print is resolved", async () => {
    const { service, printerRepository, printerService } = makeService(
      [makeOrder()],
      [makePrintJob({ id: "print-1", status: "CORRIENDO", printerId: "printer-1" })],
      [makeOrderPrint({ id: "link-1", printJobId: "print-1" })],
      { "print-1": "CORRIENDO" },
      [makePrinter({ id: "printer-1", status: "IMPRIMIENDO" })]
    );

    await expectBusinessError(() => printerService.updateStatus("printer-1", "MANTENIMIENTO"), "PRINTER_HAS_ACTIVE_PRINT");

    await service.cancel("print-1");
    expect((await printerRepository.findById("printer-1"))?.status).toBe("LISTA");

    const maintained = await printerService.updateStatus("printer-1", "MANTENIMIENTO");
    expect(maintained.status).toBe("MANTENIMIENTO");
  });

  it("soft deletes non-running print jobs, unlinks them from orders and rejects running deletes", async () => {
    const link = makeOrderPrint({ printJobId: "print-1" });
    const { service, orderRepository } = makeService(
      [makeOrder()],
      [makePrintJob({ id: "print-1" }), makePrintJob({ id: "print-2", status: "CORRIENDO" })],
      [link],
      { "print-1": "PENDIENTE" }
    );

    const deleted = await service.delete("print-1");
    const links = await orderRepository.findPrintsByOrderId("order-1", true);

    expect(deleted.active).toBe(false);
    expect(links).toHaveLength(0);
    await expectBusinessError(() => service.delete("print-2"), "PRINT_JOB_CANNOT_BE_DELETED_WHEN_RUNNING");
  });

  it("maps print job errors to the standard error response envelope", () => {
    const mappedError = mapErrorToHttp(new BusinessError("PRINT_JOB_NOT_FOUND", "Print job was not found."));

    expect(mappedError).toEqual({
      status: 404,
      body: {
        error: {
          code: "PRINT_JOB_NOT_FOUND",
          message: "Print job was not found."
        }
      }
    });
  });
});
