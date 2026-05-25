import { Order, OrderStatus } from "../../domain/orders/order.js";
import { PrintJob } from "../../domain/print-jobs/print-job.js";
import { Printer } from "../../domain/printers/printer.js";
import { DateRange, FinishedPrintEvent } from "../../domain/statistics/production-statistics.js";
import { OrderStatusCounts, PrinterCounts, StatisticsRepository } from "../../repositories/statistics.repository.js";

export class InMemoryStatisticsRepository implements StatisticsRepository {
  constructor(
    private readonly printJobs: PrintJob[] = [],
    private readonly printers: Printer[] = [],
    private readonly orders: Order[] = []
  ) {}

  findFinishedPrintEvents(range: DateRange): Promise<FinishedPrintEvent[]> {
    return Promise.resolve(
      this.printJobs
        .filter(
          (printJob) =>
            printJob.active &&
            printJob.status === "FINALIZADA" &&
            printJob.finishedAt !== null &&
            isWithinRange(printJob.finishedAt, range)
        )
        .map((printJob) => ({ finishedAt: printJob.finishedAt as Date }))
        .sort((left, right) => left.finishedAt.getTime() - right.finishedAt.getTime())
    );
  }

  countCancelledPrintJobs(range: DateRange): Promise<number> {
    const hasRange = Boolean(range.from || range.to);
    return Promise.resolve(
      this.printJobs.filter((printJob) => {
        if (!printJob.active || printJob.status !== "CANCELADA") {
          return false;
        }

        if (!hasRange) {
          return true;
        }

        return printJob.cancelledAt !== null && isWithinRange(printJob.cancelledAt, range);
      }).length
    );
  }

  countMaintenancePrinters(): Promise<number> {
    return Promise.resolve(this.printers.filter((printer) => printer.active && printer.status === "MANTENIMIENTO").length);
  }

  countActivePrinters(): Promise<PrinterCounts> {
    const activePrinters = this.printers.filter((printer) => printer.active);
    return Promise.resolve({
      activeTotal: activePrinters.length,
      activePrinting: activePrinters.filter((printer) => printer.status === "IMPRIMIENDO").length
    });
  }

  countOrdersByStatus(): Promise<OrderStatusCounts> {
    return Promise.resolve({
      ready: this.countActiveOrdersByStatus("LISTO_EN_TALLER"),
      delivered: this.countActiveOrdersByStatus("ENTREGADO")
    });
  }

  private countActiveOrdersByStatus(status: OrderStatus): number {
    return this.orders.filter((order) => order.active && order.status === status).length;
  }
}

function isWithinRange(date: Date, range: DateRange): boolean {
  if (range.from && date.getTime() < range.from.getTime()) {
    return false;
  }

  if (range.to && date.getTime() > range.to.getTime()) {
    return false;
  }

  return true;
}
