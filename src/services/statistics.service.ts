import { ProductionStatisticsRequest, ProductionStatisticsResult } from "../domain/statistics/production-statistics.js";
import {
  assertValidDateRange,
  formatIsoWeek,
  formatUtcDay,
  formatUtcMonth,
  groupFinishedPrintEvents,
  roundToTwoDecimals
} from "../domain/statistics/statistics-rules.js";
import { StatisticsRepository } from "../repositories/statistics.repository.js";

export class StatisticsService {
  constructor(private readonly statisticsRepository: StatisticsRepository) {}

  async getProductionStatistics(input: ProductionStatisticsRequest): Promise<ProductionStatisticsResult> {
    assertValidDateRange(input);

    const range = { from: input.from, to: input.to };
    const [finishedEvents, maintenancePrinterCount, cancelledPrintJobCount] = await Promise.all([
      this.statisticsRepository.findFinishedPrintEvents(range),
      this.statisticsRepository.countMaintenancePrinters(),
      this.statisticsRepository.countCancelledPrintJobs(range)
    ]);

    const result: ProductionStatisticsResult = {
      finishedPrintsByDay: groupFinishedPrintEvents(finishedEvents, formatUtcDay),
      finishedPrintsByWeek: groupFinishedPrintEvents(finishedEvents, formatIsoWeek),
      finishedPrintsByMonth: groupFinishedPrintEvents(finishedEvents, formatUtcMonth),
      maintenancePrinterCount,
      cancelledPrintJobCount
    };

    if (input.includeUtilization) {
      const printerCounts = await this.statisticsRepository.countActivePrinters();
      result.printerUtilizationPercentage =
        printerCounts.activeTotal === 0 ? 0 : roundToTwoDecimals((printerCounts.activePrinting / printerCounts.activeTotal) * 100);
    }

    if (input.includeOrders) {
      const orderCounts = await this.statisticsRepository.countOrdersByStatus();
      result.readyOrderCount = orderCounts.ready;
      result.deliveredOrderCount = orderCounts.delivered;
    }

    return result;
  }
}
