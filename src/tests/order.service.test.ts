import { describe, expect, it } from "vitest";
import { BusinessError } from "../domain/errors/business-error.js";
import { mapErrorToHttp } from "../domain/errors/http-error-mapper.js";
import { Order, OrderPrint } from "../domain/orders/order.js";
import { normalizeOrderCode } from "../domain/orders/order-rules.js";
import { OrderService } from "../services/order.service.js";
import { InMemoryOrderRepository } from "./fakes/in-memory-order.repository.js";

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

function makePrint(overrides: Partial<OrderPrint> = {}): OrderPrint {
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

describe("OrderService", () => {
  it("creates a valid order as active and pending with zero progress", async () => {
    const service = new OrderService(new InMemoryOrderRepository());

    const order = await service.create({
      orderCode: " PED-001 ",
      customerName: " Cliente A ",
      estimatedDeliveryDate: "2026-06-01T00:00:00.000Z",
      observations: " Urgente "
    });

    expect(order.orderCode).toBe("PED-001");
    expect(order.normalizedOrderCode).toBe("ped-001");
    expect(order.customerName).toBe("Cliente A");
    expect(order.status).toBe("PENDIENTE");
    expect(order.progressPercentage).toBe(0);
    expect(order.active).toBe(true);
  });

  it("fails when creating without code or with duplicated active code ignoring case and spaces", async () => {
    const repository = new InMemoryOrderRepository([makeOrder({ orderCode: "PED-001" })]);
    const service = new OrderService(repository);

    await expectBusinessError(() => service.create({ orderCode: "   " }), "ORDER_CODE_REQUIRED");
    await expectBusinessError(() => service.create({ orderCode: " ped-001 " }), "ORDER_CODE_ALREADY_EXISTS");
  });

  it("blocks edition when delivered or cancelled", async () => {
    const deliveredService = new OrderService(new InMemoryOrderRepository([makeOrder({ status: "ENTREGADO" })]));
    const cancelledService = new OrderService(new InMemoryOrderRepository([makeOrder({ status: "CANCELADO" })]));

    await expectBusinessError(() => deliveredService.update("order-1", { customerName: "Otro" }), "ORDER_ALREADY_DELIVERED");
    await expectBusinessError(() => cancelledService.update("order-1", { customerName: "Otro" }), "ORDER_ALREADY_CANCELLED");
  });

  it("links print jobs, rejects active duplicates and unlinks logically", async () => {
    const repository = new InMemoryOrderRepository([makeOrder()]);
    const service = new OrderService(repository);

    const linkedPrint = await service.linkPrint("order-1", { printJobId: "print-1" });

    expect(linkedPrint.active).toBe(true);
    await expectBusinessError(() => service.linkPrint("order-1", { printJobId: "print-1" }), "ORDER_PRINT_ALREADY_LINKED");

    const unlinkedPrint = await service.unlinkPrint("order-1", "print-1");
    expect(unlinkedPrint.active).toBe(false);
  });

  it("delivers only ready orders", async () => {
    const pendingService = new OrderService(new InMemoryOrderRepository([makeOrder({ status: "INCOMPLETO" })]));
    await expectBusinessError(() => pendingService.deliver("order-1"), "ORDER_CANNOT_BE_DELIVERED_UNLESS_READY");

    const readyService = new OrderService(new InMemoryOrderRepository([makeOrder({ status: "LISTO_EN_TALLER", progressPercentage: 100 })]));
    const deliveredOrder = await readyService.deliver("order-1");

    expect(deliveredOrder.status).toBe("ENTREGADO");
    expect(deliveredOrder.progressPercentage).toBe(100);
    expect(deliveredOrder.deliveredAt).toBeInstanceOf(Date);
  });

  it("cancels an order without cancelling linked prints", async () => {
    const repository = new InMemoryOrderRepository([makeOrder()], [makePrint()]);
    const service = new OrderService(repository);

    const cancelledOrder = await service.cancel("order-1");
    const prints = await repository.findPrintsByOrderId("order-1", true);

    expect(cancelledOrder.status).toBe("CANCELADO");
    expect(cancelledOrder.cancelledAt).toBeInstanceOf(Date);
    expect(prints).toHaveLength(1);
    expect(prints[0]?.active).toBe(true);
  });

  it("soft deletes orders and rejects deleting delivered orders", async () => {
    const service = new OrderService(new InMemoryOrderRepository([makeOrder()]));
    const deletedOrder = await service.delete("order-1");

    expect(deletedOrder.active).toBe(false);

    const deliveredService = new OrderService(new InMemoryOrderRepository([makeOrder({ status: "ENTREGADO" })]));
    await expectBusinessError(() => deliveredService.delete("order-1"), "ORDER_CANNOT_BE_DELETED_WHEN_DELIVERED");
  });

  it("calculates progress excluding cancelled prints", async () => {
    const prints = Array.from({ length: 12 }, (_, index) => makePrint({ id: `link-${index}`, printJobId: `print-${index}` }));
    const statuses = Object.fromEntries([
      ...Array.from({ length: 6 }, (_, index) => [`print-${index}`, "FINALIZADA"]),
      ...Array.from({ length: 4 }, (_, index) => [`print-${index + 6}`, "EN_PROCESO"]),
      ["print-10", "CANCELADA"],
      ["print-11", "CANCELADA"]
    ]);
    const repository = new InMemoryOrderRepository([makeOrder()], prints, statuses);
    const service = new OrderService(repository);

    const order = await service.recalculateProgress("order-1");

    expect(order.status).toBe("INCOMPLETO");
    expect(order.progressPercentage).toBe(60);
  });

  it("calculates zero progress when there are no valid prints", async () => {
    const repository = new InMemoryOrderRepository(
      [makeOrder({ status: "INCOMPLETO", progressPercentage: 50 })],
      [makePrint({ printJobId: "print-1" })],
      { "print-1": "CANCELADA" }
    );
    const service = new OrderService(repository);

    const order = await service.recalculateProgress("order-1");

    expect(order.status).toBe("PENDIENTE");
    expect(order.progressPercentage).toBe(0);
  });

  it("maps business errors to the standard error response envelope", () => {
    const mappedError = mapErrorToHttp(new BusinessError("ORDER_NOT_FOUND", "Order was not found."));

    expect(mappedError).toEqual({
      status: 404,
      body: {
        error: {
          code: "ORDER_NOT_FOUND",
          message: "Order was not found."
        }
      }
    });
  });
});
