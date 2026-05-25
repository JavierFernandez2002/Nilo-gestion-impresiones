import { z } from "zod";
import { ASSIGNMENT_STRATEGIES } from "../domain/assignments/assignment.js";

const positiveIntegerSchema = z.number().int().positive();

const automaticAssignmentSchema = z
  .object({
    strategy: z.literal("AUTOMATICO")
  })
  .strict();

const durationAssignmentSchema = z
  .object({
    strategy: z.literal("POR_DURACION"),
    maxEstimatedDurationHours: z.number().positive()
  })
  .strict();

const orderLengthAssignmentSchema = z
  .object({
    strategy: z.literal("POR_LARGO_PEDIDO"),
    minPendingPrints: positiveIntegerSchema.optional(),
    maxPendingPrints: positiveIntegerSchema.optional()
  })
  .strict()
  .refine((value) => value.minPendingPrints !== undefined || value.maxPendingPrints !== undefined, {
    message: "At least one pending print count filter is required."
  })
  .refine(
    (value) =>
      value.minPendingPrints === undefined ||
      value.maxPendingPrints === undefined ||
      value.minPendingPrints <= value.maxPendingPrints,
    {
      message: "Minimum pending prints cannot be greater than maximum pending prints."
    }
  );

export const assignmentRequestSchema = z.union([
  automaticAssignmentSchema,
  durationAssignmentSchema,
  orderLengthAssignmentSchema
]);

export const assignmentStrategySchema = z.enum(ASSIGNMENT_STRATEGIES);

export type AssignmentRequestInput = z.infer<typeof assignmentRequestSchema>;
