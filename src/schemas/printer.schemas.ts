import { z } from "zod";
import { PRINTER_STATUSES } from "../domain/printers/printer.js";

const optionalString = z.string().trim().optional().nullable();

export const createPrinterSchema = z.object({
  name: z.string(),
  status: z.enum(PRINTER_STATUSES).optional(),
  model: optionalString,
  location: optionalString,
  ipWifi: optionalString
});

export const updatePrinterSchema = z.object({
  name: z.string().optional(),
  model: optionalString,
  location: optionalString,
  ipWifi: optionalString
});

export const updatePrinterStatusSchema = z.object({
  status: z.enum(PRINTER_STATUSES)
});

export type CreatePrinterInput = z.infer<typeof createPrinterSchema>;
export type UpdatePrinterInput = z.infer<typeof updatePrinterSchema>;
export type UpdatePrinterStatusInput = z.infer<typeof updatePrinterStatusSchema>;
