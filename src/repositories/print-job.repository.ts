import { PrismaClient } from "@prisma/client";
import { CreatePrintJobData, PrintJob, PrintJobStatus, UpdatePrintJobData } from "../domain/print-jobs/print-job.js";
import { OrderPrint } from "../domain/orders/order.js";

export interface PrintJobRepository {
  findMany(filters: { status?: PrintJobStatus; active?: boolean; orderId?: string }): Promise<PrintJob[]>;
  findById(id: string): Promise<PrintJob | null>;
  create(data: Omit<CreatePrintJobData, "orderId"> & { status: PrintJobStatus }): Promise<PrintJob>;
  update(id: string, data: UpdatePrintJobData & {
    status?: PrintJobStatus;
    startedAt?: Date | null;
    finishedAt?: Date | null;
    cancelledAt?: Date | null;
    active?: boolean;
  }): Promise<PrintJob>;
  findActiveOrderPrintByPrintJobId(printJobId: string): Promise<OrderPrint | null>;
  createOrderPrint(data: { orderId: string; printJobId: string }): Promise<OrderPrint>;
  updateOrderPrint(id: string, data: { active?: boolean }): Promise<OrderPrint>;
}

export class PrismaPrintJobRepository implements PrintJobRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(filters: { status?: PrintJobStatus; active?: boolean; orderId?: string }): Promise<PrintJob[]> {
    return this.prisma.printJob.findMany({
      where: {
        active: filters.active ?? true,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.orderId ? { orderLinks: { some: { orderId: filters.orderId, active: true } } } : {})
      },
      orderBy: { createdAt: "desc" }
    }) as Promise<PrintJob[]>;
  }

  findById(id: string): Promise<PrintJob | null> {
    return this.prisma.printJob.findUnique({ where: { id } }) as Promise<PrintJob | null>;
  }

  create(data: Omit<CreatePrintJobData, "orderId"> & { status: PrintJobStatus }): Promise<PrintJob> {
    return this.prisma.printJob.create({
      data: {
        modelName: data.modelName,
        modelCode: data.modelCode ?? null,
        material: data.material ?? null,
        color: data.color ?? null,
        estimatedDurationHours: data.estimatedDurationHours ?? null,
        status: data.status,
        observations: data.observations ?? null,
        active: true
      }
    }) as Promise<PrintJob>;
  }

  update(id: string, data: UpdatePrintJobData & {
    status?: PrintJobStatus;
    startedAt?: Date | null;
    finishedAt?: Date | null;
    cancelledAt?: Date | null;
    active?: boolean;
  }): Promise<PrintJob> {
    return this.prisma.printJob.update({
      where: { id },
      data
    }) as Promise<PrintJob>;
  }

  findActiveOrderPrintByPrintJobId(printJobId: string): Promise<OrderPrint | null> {
    return this.prisma.orderPrint.findFirst({
      where: { printJobId, active: true }
    }) as Promise<OrderPrint | null>;
  }

  createOrderPrint(data: { orderId: string; printJobId: string }): Promise<OrderPrint> {
    return this.prisma.orderPrint.create({
      data: {
        orderId: data.orderId,
        printJobId: data.printJobId,
        active: true
      }
    }) as Promise<OrderPrint>;
  }

  updateOrderPrint(id: string, data: { active?: boolean }): Promise<OrderPrint> {
    return this.prisma.orderPrint.update({
      where: { id },
      data
    }) as Promise<OrderPrint>;
  }
}
