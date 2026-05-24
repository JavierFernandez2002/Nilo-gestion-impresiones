import { randomUUID } from "node:crypto";
import { OrderPrint } from "../../domain/orders/order.js";
import { CreatePrintJobData, PrintJob, PrintJobStatus, UpdatePrintJobData } from "../../domain/print-jobs/print-job.js";
import { PrintJobRepository } from "../../repositories/print-job.repository.js";

export class InMemoryPrintJobRepository implements PrintJobRepository {
  private printJobs: PrintJob[] = [];
  private orderPrints: OrderPrint[] = [];

  constructor(
    initialPrintJobs: PrintJob[] = [],
    initialOrderPrints: OrderPrint[] = [],
    private readonly hooks: {
      onCreateOrderPrint?: (data: { orderId: string; printJobId: string }) => Promise<void> | void;
      onUpdateOrderPrint?: (id: string, data: { active?: boolean }) => Promise<void> | void;
      onStatusChange?: (printJobId: string, status: PrintJobStatus) => Promise<void> | void;
    } = {}
  ) {
    this.printJobs = [...initialPrintJobs];
    this.orderPrints = [...initialOrderPrints];
  }

  findMany(filters: { status?: PrintJobStatus; active?: boolean; orderId?: string }): Promise<PrintJob[]> {
    const active = filters.active ?? true;
    return Promise.resolve(
      this.printJobs.filter((printJob) => {
        const matchesOrder = filters.orderId
          ? this.orderPrints.some((link) => link.printJobId === printJob.id && link.orderId === filters.orderId && link.active)
          : true;
        return printJob.active === active && (filters.status ? printJob.status === filters.status : true) && matchesOrder;
      })
    );
  }

  findById(id: string): Promise<PrintJob | null> {
    return Promise.resolve(this.printJobs.find((printJob) => printJob.id === id) ?? null);
  }

  async create(data: Omit<CreatePrintJobData, "orderId"> & { status: PrintJobStatus }): Promise<PrintJob> {
    const now = new Date();
    const printJob: PrintJob = {
      id: randomUUID(),
      modelName: data.modelName,
      modelCode: data.modelCode ?? null,
      material: data.material ?? null,
      color: data.color ?? null,
      estimatedDurationHours: data.estimatedDurationHours ?? null,
      status: data.status,
      startedAt: null,
      finishedAt: null,
      cancelledAt: null,
      observations: data.observations ?? null,
      active: true,
      createdAt: now,
      updatedAt: now
    };

    this.printJobs.push(printJob);
    return printJob;
  }

  async update(id: string, data: UpdatePrintJobData & {
    status?: PrintJobStatus;
    startedAt?: Date | null;
    finishedAt?: Date | null;
    cancelledAt?: Date | null;
    active?: boolean;
  }): Promise<PrintJob> {
    const index = this.printJobs.findIndex((printJob) => printJob.id === id);
    if (index === -1) {
      throw new Error("Print job not found in fake repository.");
    }

    const updatedPrintJob = {
      ...this.printJobs[index],
      ...data,
      updatedAt: new Date()
    };

    this.printJobs[index] = updatedPrintJob;
    if (data.status) {
      await this.hooks.onStatusChange?.(id, data.status);
    }
    return updatedPrintJob;
  }

  findActiveOrderPrintByPrintJobId(printJobId: string): Promise<OrderPrint | null> {
    return Promise.resolve(this.orderPrints.find((link) => link.printJobId === printJobId && link.active) ?? null);
  }

  async createOrderPrint(data: { orderId: string; printJobId: string }): Promise<OrderPrint> {
    const now = new Date();
    const orderPrint: OrderPrint = {
      id: randomUUID(),
      orderId: data.orderId,
      printJobId: data.printJobId,
      active: true,
      createdAt: now,
      updatedAt: now
    };

    this.orderPrints.push(orderPrint);
    await this.hooks.onCreateOrderPrint?.(data);
    return orderPrint;
  }

  async updateOrderPrint(id: string, data: { active?: boolean }): Promise<OrderPrint> {
    const index = this.orderPrints.findIndex((link) => link.id === id);
    if (index === -1) {
      throw new Error("Order print not found in fake repository.");
    }

    const updatedOrderPrint = {
      ...this.orderPrints[index],
      ...data,
      updatedAt: new Date()
    };

    this.orderPrints[index] = updatedOrderPrint;
    await this.hooks.onUpdateOrderPrint?.(id, data);
    return updatedOrderPrint;
  }
}
