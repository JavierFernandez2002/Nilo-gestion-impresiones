import { z } from "zod";
import { PRINT_JOB_STATUSES } from "../domain/print-jobs/print-job.js";

const optionalInput = z.any().optional().nullable();
const activeQuerySchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}, z.boolean().optional());

export const listPrintJobsQuerySchema = z.object({
  status: z.enum(PRINT_JOB_STATUSES).optional(),
  active: activeQuerySchema,
  orderId: z.string().trim().min(1).optional()
});

export const createPrintJobSchema = z.object({
  orderId: z.any(),
  modelName: z.any(),
  modelCode: optionalInput,
  material: optionalInput,
  color: optionalInput,
  estimatedDurationHours: optionalInput,
  observations: optionalInput
}).strict();

export const updatePrintJobSchema = z.object({
  modelName: z.any().optional(),
  modelCode: optionalInput,
  material: optionalInput,
  color: optionalInput,
  estimatedDurationHours: optionalInput,
  observations: optionalInput
}).strict();

export type ListPrintJobsQueryInput = z.infer<typeof listPrintJobsQuerySchema>;
export type CreatePrintJobInput = z.infer<typeof createPrintJobSchema>;
export type UpdatePrintJobInput = z.infer<typeof updatePrintJobSchema>;
