export interface ProductionStatisticsRequest {
  from?: Date;
  to?: Date;
  includeUtilization: boolean;
  includeOrders: boolean;
}

export interface TimeBucketCount {
  period: string;
  count: number;
}

export interface ProductionStatisticsResult {
  finishedPrintsByDay: TimeBucketCount[];
  finishedPrintsByWeek: TimeBucketCount[];
  finishedPrintsByMonth: TimeBucketCount[];
  maintenancePrinterCount: number;
  cancelledPrintJobCount: number;
  printerUtilizationPercentage?: number;
  readyOrderCount?: number;
  deliveredOrderCount?: number;
}

export interface FinishedPrintEvent {
  finishedAt: Date;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}
