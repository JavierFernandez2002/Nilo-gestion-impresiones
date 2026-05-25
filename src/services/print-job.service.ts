import { BusinessError } from "../domain/errors/business-error.js";
import { Order } from "../domain/orders/order.js";
import { CreatePrintJobData, PrintJob, PrintJobStatus, UpdatePrintJobData } from "../domain/print-jobs/print-job.js";
import {
  assertPrintJobCanBeAssigned,
  assertPrintJobCanBeCancelled,
  assertPrintJobCanBeDeleted,
  assertPrintJobCanBeEdited,
  assertPrintJobCanBeFinished,
  normalizeOptionalDuration,
  normalizeOptionalPrintJobText,
  validateModelName,
  validateOrderId
} from "../domain/print-jobs/print-job-rules.js";
import { PrintJobRepository } from "../repositories/print-job.repository.js";
import { OrderService } from "./order.service.js";
import { PrinterService } from "./printer.service.js";

export class PrintJobService {
  constructor(
    private readonly printJobRepository: PrintJobRepository,
    private readonly orderService: OrderService,
    private readonly printerService: PrinterService
  ) {}

  list(filters: { status?: PrintJobStatus; active?: boolean; orderId?: string } = {}): Promise<PrintJob[]> {
    return this.printJobRepository.findMany({
      active: filters.active ?? true,
      status: filters.status,
      orderId: filters.orderId
    });
  }

  async getById(id: string): Promise<PrintJob> {
    const printJob = await this.printJobRepository.findById(id);
    if (!printJob) {
      throw new BusinessError("PRINT_JOB_NOT_FOUND", "Print job was not found.");
    }

    return printJob;
  }

  async create(input: CreatePrintJobData): Promise<PrintJob> {
    const orderId = validateOrderId(input.orderId);
    const order = await this.orderService.getById(orderId);
    this.assertOrderAcceptsPrintJobs(order);

    const printJob = await this.printJobRepository.create({
      modelName: validateModelName(input.modelName),
      modelCode: normalizeOptionalPrintJobText(input.modelCode, "PRINT_JOB_MODEL_FIELD_INVALID"),
      material: normalizeOptionalPrintJobText(input.material, "PRINT_JOB_MODEL_FIELD_INVALID"),
      color: normalizeOptionalPrintJobText(input.color, "PRINT_JOB_MODEL_FIELD_INVALID"),
      estimatedDurationHours: normalizeOptionalDuration(input.estimatedDurationHours),
      observations: normalizeOptionalPrintJobText(input.observations, "PRINT_JOB_OBSERVATIONS_INVALID", 500),
      status: "PENDIENTE"
    });

    await this.printJobRepository.createOrderPrint({ orderId: order.id, printJobId: printJob.id });
    await this.orderService.recalculateProgress(order.id);
    return printJob;
  }

  async update(id: string, input: UpdatePrintJobData): Promise<PrintJob> {
    const current = await this.getById(id);
    assertPrintJobCanBeEdited(current);

    const updateData: UpdatePrintJobData = {};
    if (input.modelName !== undefined) {
      updateData.modelName = validateModelName(input.modelName);
    }

    const modelCode = normalizeOptionalPrintJobText(input.modelCode, "PRINT_JOB_MODEL_FIELD_INVALID");
    const material = normalizeOptionalPrintJobText(input.material, "PRINT_JOB_MODEL_FIELD_INVALID");
    const color = normalizeOptionalPrintJobText(input.color, "PRINT_JOB_MODEL_FIELD_INVALID");
    const estimatedDurationHours = normalizeOptionalDuration(input.estimatedDurationHours);
    const observations = normalizeOptionalPrintJobText(input.observations, "PRINT_JOB_OBSERVATIONS_INVALID", 500);

    if (modelCode !== undefined) {
      updateData.modelCode = modelCode;
    }

    if (material !== undefined) {
      updateData.material = material;
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    if (estimatedDurationHours !== undefined) {
      updateData.estimatedDurationHours = estimatedDurationHours;
    }

    if (observations !== undefined) {
      updateData.observations = observations;
    }

    return this.printJobRepository.update(current.id, updateData);
  }

  async assignPrinter(id: string, printerId: string): Promise<PrintJob> {
    const current = await this.getById(id);
    assertPrintJobCanBeAssigned(current);

    const printer = await this.printerService.getById(printerId);
    this.printerService.assertCanReceivePrint(printer);

    return this.printJobRepository.assignPrinter(current.id, printer.id);
  }

  async cancel(id: string): Promise<PrintJob> {
    const current = await this.getById(id);
    assertPrintJobCanBeCancelled(current);

    const cancelledPrintJob = await this.printJobRepository.updateAndReleasePrinter(current.id, {
      status: "CANCELADA",
      cancelledAt: new Date()
    }, "LISTA");
    await this.recalculateLinkedOrder(current.id);
    return cancelledPrintJob;
  }

  async finish(id: string): Promise<PrintJob> {
    const current = await this.getById(id);
    assertPrintJobCanBeFinished(current);

    const finishedPrintJob = await this.printJobRepository.updateAndReleasePrinter(current.id, {
      status: "FINALIZADA",
      finishedAt: new Date()
    }, "LISTA");
    await this.recalculateLinkedOrder(current.id);
    return finishedPrintJob;
  }

  async delete(id: string): Promise<PrintJob> {
    const current = await this.getById(id);
    assertPrintJobCanBeDeleted(current);

    const deletedPrintJob = await this.printJobRepository.update(current.id, { active: false });
    const activeLink = await this.printJobRepository.findActiveOrderPrintByPrintJobId(current.id);
    if (activeLink) {
      await this.printJobRepository.updateOrderPrint(activeLink.id, { active: false });
      await this.orderService.recalculateProgress(activeLink.orderId);
    }

    return deletedPrintJob;
  }

  private assertOrderAcceptsPrintJobs(order: Order): void {
    if (!order.active || order.status === "ENTREGADO" || order.status === "CANCELADO") {
      throw new BusinessError("PRINT_JOB_ORDER_NOT_AVAILABLE", "Print jobs can only be created for active open orders.");
    }
  }

  private async recalculateLinkedOrder(printJobId: string): Promise<void> {
    const activeLink = await this.printJobRepository.findActiveOrderPrintByPrintJobId(printJobId);
    if (activeLink) {
      await this.orderService.recalculateProgress(activeLink.orderId);
    }
  }
}
