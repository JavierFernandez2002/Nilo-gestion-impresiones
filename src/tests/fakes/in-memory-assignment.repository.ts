import {
  AssignmentCandidate,
  AssignmentItem,
  AssignmentRequest
} from "../../domain/assignments/assignment.js";
import { AssignmentRepository } from "../../repositories/assignment.repository.js";
import { Order, OrderPrint } from "../../domain/orders/order.js";
import { Printer } from "../../domain/printers/printer.js";
import { PrintJob } from "../../domain/print-jobs/print-job.js";

export class InMemoryAssignmentRepository implements AssignmentRepository {
  constructor(
    private readonly printers: Printer[] = [],
    private readonly orders: Order[] = [],
    private readonly orderPrints: OrderPrint[] = [],
    private readonly printJobs: PrintJob[] = []
  ) {
    this.printers = printers.map((printer) => ({ ...printer }));
    this.orders = orders.map((order) => ({ ...order }));
    this.orderPrints = orderPrints.map((orderPrint) => ({ ...orderPrint }));
    this.printJobs = printJobs.map((printJob) => ({ ...printJob }));
  }

  async findAvailablePrinters(): Promise<Printer[]> {
    return [...this.printers]
      .filter((printer) => printer.active && printer.status === "LISTA")
      .sort(comparePrinters);
  }

  async findCandidates(request: AssignmentRequest): Promise<AssignmentCandidate[]> {
    const eligibleLinks = this.orderPrints.filter((link) => {
      const order = this.orders.find((item) => item.id === link.orderId);
      const printJob = this.printJobs.find((item) => item.id === link.printJobId);
      return Boolean(
        link.active &&
          order &&
          order.active &&
          order.status !== "ENTREGADO" &&
          order.status !== "CANCELADO" &&
          printJob &&
          printJob.active &&
          printJob.status === "PENDIENTE" &&
          printJob.printerId === null
      );
    });

    const counts = new Map<string, number>();
    for (const link of eligibleLinks) {
      counts.set(link.orderId, (counts.get(link.orderId) ?? 0) + 1);
    }

    const candidates = eligibleLinks
      .map((link) => {
        const order = this.orders.find((item) => item.id === link.orderId)!;
        const printJob = this.printJobs.find((item) => item.id === link.printJobId)!;

        return {
          printJobId: link.printJobId,
          orderId: link.orderId,
          estimatedDurationHours: printJob.estimatedDurationHours,
          orderCreatedAt: order.createdAt,
          orderPrintCreatedAt: link.createdAt,
          printJobCreatedAt: printJob.createdAt,
          pendingPrintCount: counts.get(link.orderId) ?? 0
        };
      })
      .filter((candidate) => this.matchesStrategy(candidate, request))
      .sort(compareCandidates);

    return candidates;
  }

  async assignPrintJobToPrinter(candidate: AssignmentCandidate, printerId: string): Promise<AssignmentItem> {
    const now = new Date();
    const printJobIndex = this.printJobs.findIndex((item) => item.id === candidate.printJobId);
    const printerIndex = this.printers.findIndex((item) => item.id === printerId);

    if (printJobIndex === -1 || printerIndex === -1) {
      throw new Error("Assignment entities not found in fake repository.");
    }

    this.printJobs[printJobIndex] = {
      ...this.printJobs[printJobIndex],
      status: "CORRIENDO",
      startedAt: now,
      printerId,
      updatedAt: now
    };

    this.printers[printerIndex] = {
      ...this.printers[printerIndex],
      status: "IMPRIMIENDO",
      updatedAt: now
    };

    return {
      printJobId: candidate.printJobId,
      printerId,
      orderId: candidate.orderId,
      status: "CORRIENDO",
      printerStatus: "IMPRIMIENDO"
    };
  }

  private matchesStrategy(candidate: AssignmentCandidate, request: AssignmentRequest): boolean {
    if (request.strategy === "AUTOMATICO") {
      return true;
    }

    if (request.strategy === "POR_DURACION") {
      return (
        candidate.estimatedDurationHours !== null &&
        candidate.estimatedDurationHours <= (request.maxEstimatedDurationHours ?? 0)
      );
    }

    if (request.minPendingPrints !== undefined && candidate.pendingPrintCount < request.minPendingPrints) {
      return false;
    }

    if (request.maxPendingPrints !== undefined && candidate.pendingPrintCount > request.maxPendingPrints) {
      return false;
    }

    return true;
  }
}

function comparePrinters(left: Printer, right: Printer): number {
  const byCreated = left.createdAt.getTime() - right.createdAt.getTime();
  if (byCreated !== 0) {
    return byCreated;
  }

  return left.id.localeCompare(right.id);
}

function compareCandidates(left: AssignmentCandidate, right: AssignmentCandidate): number {
  const byOrder = left.orderCreatedAt.getTime() - right.orderCreatedAt.getTime();
  if (byOrder !== 0) {
    return byOrder;
  }

  const byLink = left.orderPrintCreatedAt.getTime() - right.orderPrintCreatedAt.getTime();
  if (byLink !== 0) {
    return byLink;
  }

  const byPrintJob = left.printJobCreatedAt.getTime() - right.printJobCreatedAt.getTime();
  if (byPrintJob !== 0) {
    return byPrintJob;
  }

  return left.printJobId.localeCompare(right.printJobId);
}
