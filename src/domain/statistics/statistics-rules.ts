import { BusinessError } from "../errors/business-error.js";
import { DateRange, FinishedPrintEvent, TimeBucketCount } from "./production-statistics.js";

export function assertValidDateRange(range: DateRange): void {
  if (range.from && range.to && range.from.getTime() > range.to.getTime()) {
    throw new BusinessError("STATISTICS_INVALID_DATE_RANGE", "Statistics date range must have from before or equal to to.");
  }
}

export function formatUtcDay(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export function formatUtcMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

export function formatIsoWeek(date: Date): string {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);

  const weekYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${weekYear}-W${pad2(week)}`;
}

export function groupFinishedPrintEvents(events: FinishedPrintEvent[], formatPeriod: (date: Date) => string): TimeBucketCount[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    const period = formatPeriod(event.finishedAt);
    counts.set(period, (counts.get(period) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([period, count]) => ({ period, count }));
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}
