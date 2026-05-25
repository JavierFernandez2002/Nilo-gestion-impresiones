import { PrismaClient } from "@prisma/client";
import { DateRange, FinishedPrintEvent } from "../domain/statistics/production-statistics.js";

export interface PrinterCounts {
  activeTotal: number;
  activePrinting: number;
}

export interface OrderStatusCounts {
  ready: number;
  delivered: number;
}

export interface StatisticsRepository {
  findFinishedPrintEvents(range: DateRange): Promise<FinishedPrintEvent[]>;
  countCancelledPrintJobs(range: DateRange): Promise<number>;
  countMaintenancePrinters(): Promise<number>;
  countActivePrinters(): Promise<PrinterCounts>;
  countOrdersByStatus(): Promise<OrderStatusCounts>;
}

export class PrismaStatisticsRepository implements StatisticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findFinishedPrintEvents(range: DateRange): Promise<FinishedPrintEvent[]> {
    const printJobs = await this.prisma.printJob.findMany({
      where: {
        active: true,
        status: "FINALIZADA",
        finishedAt: {
          not: null,
          ...(range.from ? { gte: range.from } : {}),
          ...(range.to ? { lte: range.to } : {})
        }
      },
      select: { finishedAt: true },
      orderBy: { finishedAt: "asc" }
    });

    return printJobs
      .filter((printJob): printJob is { finishedAt: Date } => printJob.finishedAt !== null)
      .map((printJob) => ({ finishedAt: printJob.finishedAt }));
  }

  countCancelledPrintJobs(range: DateRange): Promise<number> {
    const hasRange = Boolean(range.from || range.to);
    return this.prisma.printJob.count({
      where: {
        active: true,
        status: "CANCELADA",
        ...(hasRange
          ? {
              cancelledAt: {
                not: null,
                ...(range.from ? { gte: range.from } : {}),
                ...(range.to ? { lte: range.to } : {})
              }
            }
          : {})
      }
    });
  }

  countMaintenancePrinters(): Promise<number> {
    return this.prisma.printer.count({
      where: { active: true, status: "MANTENIMIENTO" }
    });
  }

  async countActivePrinters(): Promise<PrinterCounts> {
    const [activeTotal, activePrinting] = await Promise.all([
      this.prisma.printer.count({ where: { active: true } }),
      this.prisma.printer.count({ where: { active: true, status: "IMPRIMIENDO" } })
    ]);

    return { activeTotal, activePrinting };
  }

  async countOrdersByStatus(): Promise<OrderStatusCounts> {
    const [ready, delivered] = await Promise.all([
      this.prisma.order.count({ where: { active: true, status: "LISTO_EN_TALLER" } }),
      this.prisma.order.count({ where: { active: true, status: "ENTREGADO" } })
    ]);

    return { ready, delivered };
  }
}
