import { randomUUID } from "node:crypto";
import {
  CreateOrderData,
  LinkedPrintStatus,
  Order,
  OrderPrint,
  OrderStatus,
  UpdateOrderData
} from "../../domain/orders/order.js";
import { OrderRepository } from "../../repositories/order.repository.js";

export class InMemoryOrderRepository implements OrderRepository {
  private orders: Order[] = [];
  private prints: OrderPrint[] = [];
  private printStatuses = new Map<string, string | null>();

  constructor(initialOrders: Order[] = [], initialPrints: OrderPrint[] = [], printStatuses: Record<string, string | null> = {}) {
    this.orders = [...initialOrders];
    this.prints = [...initialPrints];
    this.printStatuses = new Map(Object.entries(printStatuses));
  }

  setPrintStatus(printJobId: string, status: string | null): void {
    this.printStatuses.set(printJobId, status);
  }

  findMany(filters: { status?: OrderStatus; active?: boolean }): Promise<Order[]> {
    const active = filters.active ?? true;
    return Promise.resolve(
      this.orders.filter((order) => order.active === active && (filters.status ? order.status === filters.status : true))
    );
  }

  findById(id: string): Promise<Order | null> {
    return Promise.resolve(this.orders.find((order) => order.id === id) ?? null);
  }

  findActiveByNormalizedOrderCode(normalizedOrderCode: string, excludeId?: string): Promise<Order | null> {
    return Promise.resolve(
      this.orders.find(
        (order) => order.active && order.normalizedOrderCode === normalizedOrderCode && order.id !== excludeId
      ) ?? null
    );
  }

  create(data: CreateOrderData & { normalizedOrderCode: string; status: OrderStatus; progressPercentage: number }): Promise<Order> {
    const now = new Date();
    const order: Order = {
      id: randomUUID(),
      orderCode: data.orderCode,
      normalizedOrderCode: data.normalizedOrderCode,
      customerName: data.customerName ?? null,
      status: data.status,
      progressPercentage: data.progressPercentage,
      estimatedDeliveryDate: data.estimatedDeliveryDate ? new Date(data.estimatedDeliveryDate) : null,
      deliveredAt: null,
      cancelledAt: null,
      observations: data.observations ?? null,
      active: true,
      createdAt: now,
      updatedAt: now
    };

    this.orders.push(order);
    return Promise.resolve(order);
  }

  update(id: string, data: UpdateOrderData & {
    normalizedOrderCode?: string;
    status?: OrderStatus;
    progressPercentage?: number;
    deliveredAt?: Date | null;
    cancelledAt?: Date | null;
    active?: boolean;
  }): Promise<Order> {
    const index = this.orders.findIndex((order) => order.id === id);
    if (index === -1) {
      throw new Error("Order not found in fake repository.");
    }

    const updatedOrder: Order = {
      ...this.orders[index],
      ...data,
      estimatedDeliveryDate:
        data.estimatedDeliveryDate === undefined
          ? this.orders[index].estimatedDeliveryDate
          : data.estimatedDeliveryDate === null
            ? null
            : new Date(data.estimatedDeliveryDate),
      updatedAt: new Date()
    };

    this.orders[index] = updatedOrder;
    return Promise.resolve(updatedOrder);
  }

  findPrintsByOrderId(orderId: string, active = true): Promise<OrderPrint[]> {
    return Promise.resolve(this.prints.filter((print) => print.orderId === orderId && print.active === active));
  }

  findActivePrintByPrintJobId(printJobId: string): Promise<OrderPrint | null> {
    return Promise.resolve(this.prints.find((print) => print.printJobId === printJobId && print.active) ?? null);
  }

  findActivePrintByOrderAndPrintJobId(orderId: string, printJobId: string): Promise<OrderPrint | null> {
    return Promise.resolve(
      this.prints.find((print) => print.orderId === orderId && print.printJobId === printJobId && print.active) ?? null
    );
  }

  createPrint(data: { orderId: string; printJobId: string }): Promise<OrderPrint> {
    const now = new Date();
    const print: OrderPrint = {
      id: randomUUID(),
      orderId: data.orderId,
      printJobId: data.printJobId,
      active: true,
      createdAt: now,
      updatedAt: now
    };

    this.prints.push(print);
    return Promise.resolve(print);
  }

  updatePrint(id: string, data: { active?: boolean }): Promise<OrderPrint> {
    const index = this.prints.findIndex((print) => print.id === id);
    if (index === -1) {
      throw new Error("Order print not found in fake repository.");
    }

    const updatedPrint: OrderPrint = {
      ...this.prints[index],
      ...data,
      updatedAt: new Date()
    };

    this.prints[index] = updatedPrint;
    return Promise.resolve(updatedPrint);
  }

  async getLinkedPrintStatuses(orderId: string): Promise<LinkedPrintStatus[]> {
    const prints = await this.findPrintsByOrderId(orderId, true);
    return prints.map((print) => ({
      printJobId: print.printJobId,
      status: this.printStatuses.get(print.printJobId) ?? null
    }));
  }
}
