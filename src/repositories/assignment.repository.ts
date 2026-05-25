import { PrismaClient } from "@prisma/client";
import { AssignmentCandidate, AssignmentItem, AssignmentRequest } from "../domain/assignments/assignment.js";
import { PrintJob } from "../domain/print-jobs/print-job.js";
import { Order, OrderPrint } from "../domain/orders/order.js";
import { Printer } from "../domain/printers/printer.js";

export interface AssignmentRepository {
  findAvailablePrinters(): Promise<Printer[]>;
  findCandidates(request: AssignmentRequest): Promise<AssignmentCandidate[]>;
  assignPrintJobToPrinter(candidate: AssignmentCandidate, printerId: string): Promise<AssignmentItem>;
}

export class PrismaAssignmentRepository implements AssignmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAvailablePrinters(): Promise<Printer[]> {
    return this.prisma.printer.findMany({
      where: { active: true, status: "LISTA" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    }) as Promise<Printer[]>;
  }

  async findCandidates(request: AssignmentRequest): Promise<AssignmentCandidate[]> {
    const activeOrderPrints = await this.prisma.orderPrint.findMany({
      where: {
        active: true,
        order: {
          active: true,
          status: { notIn: ["ENTREGADO", "CANCELADO"] }
        },
        printJob: {
          active: true,
          status: "PENDIENTE",
          printerId: null
        }
      },
      include: {
        order: true,
        printJob: true
      }
    });

    const candidates = this.mapCandidates(activeOrderPrints);
    const filtered = this.filterCandidatesByStrategy(candidates, request);
    return filtered.sort(compareCandidates);
  }

  async assignPrintJobToPrinter(candidate: AssignmentCandidate, printerId: string): Promise<AssignmentItem> {
    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.printJob.update({
        where: { id: candidate.printJobId },
        data: {
          status: "CORRIENDO",
          startedAt: now,
          printerId
        }
      });

      await tx.printer.update({
        where: { id: printerId },
        data: { status: "IMPRIMIENDO" }
      });
    });

    return {
      printJobId: candidate.printJobId,
      printerId,
      orderId: candidate.orderId,
      status: "CORRIENDO",
      printerStatus: "IMPRIMIENDO"
    };
  }

  private mapCandidates(orderPrints: Array<OrderPrint & { order: Order; printJob: PrintJob }>): AssignmentCandidate[] {
    const pendingCountByOrderId = new Map<string, number>();
    for (const link of orderPrints) {
      pendingCountByOrderId.set(link.orderId, (pendingCountByOrderId.get(link.orderId) ?? 0) + 1);
    }

    return orderPrints.map((link) => ({
      printJobId: link.printJobId,
      orderId: link.orderId,
      estimatedDurationHours: link.printJob.estimatedDurationHours,
      orderCreatedAt: link.order.createdAt,
      orderPrintCreatedAt: link.createdAt,
      printJobCreatedAt: link.printJob.createdAt,
      pendingPrintCount: pendingCountByOrderId.get(link.orderId) ?? 0
    }));
  }

  private filterCandidatesByStrategy(candidates: AssignmentCandidate[], request: AssignmentRequest): AssignmentCandidate[] {
    if (request.strategy === "AUTOMATICO") {
      return candidates;
    }

    if (request.strategy === "POR_DURACION") {
      return candidates.filter(
        (candidate) =>
          candidate.estimatedDurationHours !== null &&
          candidate.estimatedDurationHours <= (request.maxEstimatedDurationHours ?? 0)
      );
    }

    const hasMin = request.minPendingPrints !== undefined;
    const hasMax = request.maxPendingPrints !== undefined;
    return candidates.filter((candidate) => {
      if (hasMin && candidate.pendingPrintCount < (request.minPendingPrints as number)) {
        return false;
      }

      if (hasMax && candidate.pendingPrintCount > (request.maxPendingPrints as number)) {
        return false;
      }

      return true;
    });
  }
}

function compareCandidates(left: AssignmentCandidate, right: AssignmentCandidate): number {
  const byOrder = left.orderCreatedAt.getTime() - right.orderCreatedAt.getTime();
  if (byOrder !== 0) return byOrder;

  const byLink = left.orderPrintCreatedAt.getTime() - right.orderPrintCreatedAt.getTime();
  if (byLink !== 0) return byLink;

  const byPrint = left.printJobCreatedAt.getTime() - right.printJobCreatedAt.getTime();
  if (byPrint !== 0) return byPrint;

  return left.printJobId.localeCompare(right.printJobId);
}
