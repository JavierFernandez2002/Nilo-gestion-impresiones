import { BusinessError } from "../domain/errors/business-error.js";
import { CreateOrderData, LinkOrderPrintData, Order, OrderPrint, OrderStatus, UpdateOrderData } from "../domain/orders/order.js";
import {
  assertOrderCanBeEdited,
  assertOrderCanLinkPrint,
  calculateOrderProgress,
  normalizeOptionalDeliveryDate,
  normalizeOptionalOrderText,
  normalizeOrderCode,
  validateOrderCode,
  validatePrintJobId
} from "../domain/orders/order-rules.js";
import { OrderRepository } from "../repositories/order.repository.js";

export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  list(filters: { status?: OrderStatus; active?: boolean } = {}): Promise<Order[]> {
    return this.orderRepository.findMany({ active: filters.active ?? true, status: filters.status });
  }

  async getById(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new BusinessError("ORDER_NOT_FOUND", "Order was not found.");
    }

    return order;
  }

  async create(input: CreateOrderData): Promise<Order> {
    const orderCode = validateOrderCode(input.orderCode);
    const normalizedOrderCode = normalizeOrderCode(orderCode);
    await this.assertActiveCodeIsUnique(normalizedOrderCode);

    return this.orderRepository.create({
      orderCode,
      normalizedOrderCode,
      customerName: normalizeOptionalOrderText(input.customerName, "ORDER_CUSTOMER_NAME_INVALID"),
      estimatedDeliveryDate: normalizeOptionalDeliveryDate(input.estimatedDeliveryDate),
      observations: normalizeOptionalOrderText(input.observations, "ORDER_OBSERVATIONS_INVALID"),
      status: "PENDIENTE",
      progressPercentage: 0
    });
  }

  async update(id: string, input: UpdateOrderData): Promise<Order> {
    const current = await this.getById(id);
    assertOrderCanBeEdited(current);

    const updateData: UpdateOrderData & { normalizedOrderCode?: string } = {};
    if (input.orderCode !== undefined) {
      const orderCode = validateOrderCode(input.orderCode);
      const normalizedOrderCode = normalizeOrderCode(orderCode);
      await this.assertActiveCodeIsUnique(normalizedOrderCode, id);
      updateData.orderCode = orderCode;
      updateData.normalizedOrderCode = normalizedOrderCode;
    }

    const customerName = normalizeOptionalOrderText(input.customerName, "ORDER_CUSTOMER_NAME_INVALID");
    const estimatedDeliveryDate = normalizeOptionalDeliveryDate(input.estimatedDeliveryDate);
    const observations = normalizeOptionalOrderText(input.observations, "ORDER_OBSERVATIONS_INVALID");

    if (customerName !== undefined) {
      updateData.customerName = customerName;
    }

    if (estimatedDeliveryDate !== undefined) {
      updateData.estimatedDeliveryDate = estimatedDeliveryDate;
    }

    if (observations !== undefined) {
      updateData.observations = observations;
    }

    return this.orderRepository.update(current.id, updateData);
  }

  async cancel(id: string): Promise<Order> {
    const current = await this.getById(id);
    if (current.status === "ENTREGADO") {
      throw new BusinessError("ORDER_ALREADY_DELIVERED", "Delivered orders cannot be cancelled.");
    }

    if (current.status === "CANCELADO") {
      throw new BusinessError("ORDER_ALREADY_CANCELLED", "Order is already cancelled.");
    }

    return this.orderRepository.update(current.id, {
      status: "CANCELADO",
      progressPercentage: 0,
      cancelledAt: new Date()
    });
  }

  async deliver(id: string): Promise<Order> {
    const current = await this.getById(id);
    if (current.status !== "LISTO_EN_TALLER") {
      throw new BusinessError("ORDER_CANNOT_BE_DELIVERED_UNLESS_READY", "Only ready orders can be delivered.");
    }

    return this.orderRepository.update(current.id, {
      status: "ENTREGADO",
      progressPercentage: 100,
      deliveredAt: new Date()
    });
  }

  async delete(id: string): Promise<Order> {
    const current = await this.getById(id);
    if (current.status === "ENTREGADO") {
      throw new BusinessError("ORDER_CANNOT_BE_DELETED_WHEN_DELIVERED", "Delivered orders cannot be deleted.");
    }

    return this.orderRepository.update(current.id, { active: false });
  }

  async recalculateProgress(id: string): Promise<Order> {
    const current = await this.getById(id);
    if (current.status === "ENTREGADO" || current.status === "CANCELADO") {
      return current;
    }

    const result = calculateOrderProgress(await this.orderRepository.getLinkedPrintStatuses(current.id));
    return this.orderRepository.update(current.id, result);
  }

  async listPrints(orderId: string): Promise<OrderPrint[]> {
    const order = await this.getById(orderId);
    return this.orderRepository.findPrintsByOrderId(order.id, true);
  }

  async linkPrint(orderId: string, input: LinkOrderPrintData): Promise<OrderPrint> {
    const order = await this.getById(orderId);
    assertOrderCanLinkPrint(order);

    const printJobId = validatePrintJobId(input.printJobId);
    const existingPrint = await this.orderRepository.findActivePrintByPrintJobId(printJobId);
    if (existingPrint) {
      throw new BusinessError("ORDER_PRINT_ALREADY_LINKED", "Print job is already linked to an active order.");
    }

    const print = await this.orderRepository.createPrint({ orderId: order.id, printJobId });
    await this.recalculateProgress(order.id);
    return print;
  }

  async unlinkPrint(orderId: string, printJobIdInput: string): Promise<OrderPrint> {
    const order = await this.getById(orderId);
    assertOrderCanLinkPrint(order);

    const printJobId = validatePrintJobId(printJobIdInput);
    const print = await this.orderRepository.findActivePrintByOrderAndPrintJobId(order.id, printJobId);
    if (!print) {
      throw new BusinessError("ORDER_PRINT_LINK_NOT_FOUND", "Order print link was not found.");
    }

    const unlinkedPrint = await this.orderRepository.updatePrint(print.id, { active: false });
    await this.recalculateProgress(order.id);
    return unlinkedPrint;
  }

  private async assertActiveCodeIsUnique(normalizedOrderCode: string, excludeId?: string): Promise<void> {
    const duplicatedOrder = await this.orderRepository.findActiveByNormalizedOrderCode(normalizedOrderCode, excludeId);
    if (duplicatedOrder) {
      throw new BusinessError("ORDER_CODE_ALREADY_EXISTS", "An active order with this code already exists.");
    }
  }
}
