import { PrismaClient } from "@prisma/client";
import {
  CreateOrderData,
  LinkedPrintStatus,
  Order,
  OrderPrint,
  OrderStatus,
  UpdateOrderData
} from "../domain/orders/order.js";

export interface OrderRepository {
  findMany(filters: { status?: OrderStatus; active?: boolean }): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  findActiveByNormalizedOrderCode(normalizedOrderCode: string, excludeId?: string): Promise<Order | null>;
  create(data: CreateOrderData & { normalizedOrderCode: string; status: OrderStatus; progressPercentage: number }): Promise<Order>;
  update(id: string, data: UpdateOrderData & {
    normalizedOrderCode?: string;
    status?: OrderStatus;
    progressPercentage?: number;
    deliveredAt?: Date | null;
    cancelledAt?: Date | null;
    active?: boolean;
  }): Promise<Order>;
  findPrintsByOrderId(orderId: string, active?: boolean): Promise<OrderPrint[]>;
  findActivePrintByPrintJobId(printJobId: string): Promise<OrderPrint | null>;
  findActivePrintByOrderAndPrintJobId(orderId: string, printJobId: string): Promise<OrderPrint | null>;
  createPrint(data: { orderId: string; printJobId: string }): Promise<OrderPrint>;
  updatePrint(id: string, data: { active?: boolean }): Promise<OrderPrint>;
  getLinkedPrintStatuses(orderId: string): Promise<LinkedPrintStatus[]>;
}

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(filters: { status?: OrderStatus; active?: boolean }): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: {
        active: filters.active ?? true,
        ...(filters.status ? { status: filters.status } : {})
      },
      orderBy: { createdAt: "desc" }
    }) as Promise<Order[]>;
  }

  findById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({ where: { id } }) as Promise<Order | null>;
  }

  findActiveByNormalizedOrderCode(normalizedOrderCode: string, excludeId?: string): Promise<Order | null> {
    return this.prisma.order.findFirst({
      where: {
        normalizedOrderCode,
        active: true,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    }) as Promise<Order | null>;
  }

  create(data: CreateOrderData & { normalizedOrderCode: string; status: OrderStatus; progressPercentage: number }): Promise<Order> {
    return this.prisma.order.create({
      data: {
        orderCode: data.orderCode,
        normalizedOrderCode: data.normalizedOrderCode,
        customerName: data.customerName ?? null,
        status: data.status,
        progressPercentage: data.progressPercentage,
        estimatedDeliveryDate: data.estimatedDeliveryDate ? new Date(data.estimatedDeliveryDate) : null,
        observations: data.observations ?? null,
        active: true
      }
    }) as Promise<Order>;
  }

  update(id: string, data: UpdateOrderData & {
    normalizedOrderCode?: string;
    status?: OrderStatus;
    progressPercentage?: number;
    deliveredAt?: Date | null;
    cancelledAt?: Date | null;
    active?: boolean;
  }): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data
    }) as Promise<Order>;
  }

  findPrintsByOrderId(orderId: string, active = true): Promise<OrderPrint[]> {
    return this.prisma.orderPrint.findMany({
      where: { orderId, active },
      orderBy: { createdAt: "desc" }
    }) as Promise<OrderPrint[]>;
  }

  findActivePrintByPrintJobId(printJobId: string): Promise<OrderPrint | null> {
    return this.prisma.orderPrint.findFirst({
      where: { printJobId, active: true }
    }) as Promise<OrderPrint | null>;
  }

  findActivePrintByOrderAndPrintJobId(orderId: string, printJobId: string): Promise<OrderPrint | null> {
    return this.prisma.orderPrint.findFirst({
      where: { orderId, printJobId, active: true }
    }) as Promise<OrderPrint | null>;
  }

  createPrint(data: { orderId: string; printJobId: string }): Promise<OrderPrint> {
    return this.prisma.orderPrint.create({
      data: {
        orderId: data.orderId,
        printJobId: data.printJobId,
        active: true
      }
    }) as Promise<OrderPrint>;
  }

  updatePrint(id: string, data: { active?: boolean }): Promise<OrderPrint> {
    return this.prisma.orderPrint.update({
      where: { id },
      data
    }) as Promise<OrderPrint>;
  }

  async getLinkedPrintStatuses(orderId: string): Promise<LinkedPrintStatus[]> {
    const prints = await this.prisma.orderPrint.findMany({
      where: { orderId, active: true },
      include: { printJob: true },
      orderBy: { createdAt: "desc" }
    });

    return prints.map((print) => ({ printJobId: print.printJobId, status: print.printJob.status }));
  }
}
