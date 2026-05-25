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
  assignPrinter(id: string, printerId: string): Promise<PrintJob>;
  updateAndReleasePrinter(id: string, data: UpdatePrintJobData & {
    status?: PrintJobStatus;
    startedAt?: Date | null;
    finishedAt?: Date | null;
    cancelledAt?: Date | null;
    active?: boolean;
  }, printerStatus?: "LISTA"): Promise<PrintJob>;
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
        printerId: data.printerId ?? null,
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

  async assignPrinter(id: string, printerId: string): Promise<PrintJob> {
    return this.prisma.$transaction(async (tx) => {
      const updatedPrintJob = await tx.printJob.update({
        where: { id },
        data: {
          printerId,
          status: "CORRIENDO",
          startedAt: new Date()
        }
      });

      await tx.printer.update({
        where: { id: printerId },
        data: { status: "IMPRIMIENDO" }
      });

      return updatedPrintJob as PrintJob;
    }) as Promise<PrintJob>;
  }

  async updateAndReleasePrinter(
    id: string,
    data: UpdatePrintJobData & {
      status?: PrintJobStatus;
      startedAt?: Date | null;
      finishedAt?: Date | null;
      cancelledAt?: Date | null;
      active?: boolean;
    },
    printerStatus: "LISTA"
  ): Promise<PrintJob> {
    const current = await this.prisma.printJob.findUnique({ where: { id } });
    if (!current) {
      throw new Error("Print job not found.");
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPrintJob = await tx.printJob.update({
        where: { id },
        data: {
          ...data,
          printerId: null
        }
      });

      if (current.printerId) {
        await tx.printer.update({
          where: { id: current.printerId },
          data: { status: printerStatus }
        });
      }

      return updatedPrintJob as PrintJob;
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
