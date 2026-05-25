import { z } from "zod";

const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional().default(false));

const fromDateSchema = z.preprocess(parseDateQueryValue("from"), z.date().optional());
const toDateSchema = z.preprocess(parseDateQueryValue("to"), z.date().optional());

export const productionStatisticsQuerySchema = z.object({
  from: fromDateSchema,
  to: toDateSchema,
  includeUtilization: booleanQuerySchema,
  includeOrders: booleanQuerySchema
});

export type ProductionStatisticsQueryInput = z.infer<typeof productionStatisticsQuerySchema>;

function parseDateQueryValue(bound: "from" | "to"): (value: unknown) => unknown {
  return (value: unknown): unknown => {
    if (value === undefined || value instanceof Date) {
      return value;
    }

    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return Number.NaN;
    }

    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) && bound === "to" ? `${trimmed}T23:59:59.999Z` : trimmed;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? Number.NaN : date;
  };
}
