import { BusinessError } from "../errors/business-error.js";
import { PrintJob, PRINT_JOB_STATUSES, PrintJobStatus } from "./print-job.js";

export function validatePrintJobStatus(status: unknown): PrintJobStatus {
  if (typeof status !== "string" || !PRINT_JOB_STATUSES.includes(status as PrintJobStatus)) {
    throw new BusinessError("PRINT_JOB_INVALID_STATUS", "Print job status is invalid.");
  }

  return status as PrintJobStatus;
}

export function validateOrderId(orderId: unknown): string {
  if (typeof orderId !== "string" || orderId.trim().length === 0) {
    throw new BusinessError("PRINT_JOB_ORDER_ID_REQUIRED", "Order id is required.");
  }

  return orderId.trim();
}

export function validateModelName(modelName: unknown): string {
  if (typeof modelName !== "string" || modelName.trim().length === 0) {
    throw new BusinessError("PRINT_JOB_MODEL_NAME_REQUIRED", "Model name is required.");
  }

  const trimmed = modelName.trim();
  if (trimmed.length > 120) {
    throw new BusinessError("PRINT_JOB_MODEL_NAME_REQUIRED", "Model name must be between 1 and 120 characters.");
  }

  return trimmed;
}

export function normalizeOptionalPrintJobText(
  value: unknown,
  errorCode: "PRINT_JOB_MODEL_FIELD_INVALID" | "PRINT_JOB_OBSERVATIONS_INVALID",
  maxLength = 100
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new BusinessError(errorCode);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    throw new BusinessError(errorCode);
  }

  return trimmed;
}

export function normalizeOptionalDuration(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new BusinessError("PRINT_JOB_ESTIMATED_DURATION_INVALID", "Estimated duration must be a positive number.");
  }

  return value;
}

export function assertPrintJobCanBeEdited(printJob: PrintJob): void {
  if (!printJob.active) {
    throw new BusinessError("PRINT_JOB_INACTIVE", "Inactive print jobs cannot be changed.");
  }

  if (printJob.status === "FINALIZADA" || printJob.status === "CANCELADA") {
    throw new BusinessError("PRINT_JOB_CANNOT_BE_CHANGED", "Finished or cancelled print jobs cannot be changed.");
  }
}

export function assertPrintJobCanBeAssigned(printJob: PrintJob): void {
  if (!printJob.active) {
    throw new BusinessError("PRINT_JOB_INACTIVE", "Inactive print jobs cannot be changed.");
  }

  if (printJob.status !== "PENDIENTE") {
    throw new BusinessError("PRINT_JOB_CANNOT_BE_ASSIGNED", "Only pending print jobs can be assigned to a printer.");
  }
}

export function assertPrintJobCanBeCancelled(printJob: PrintJob): void {
  if (!printJob.active) {
    throw new BusinessError("PRINT_JOB_INACTIVE", "Inactive print jobs cannot be changed.");
  }

  if (printJob.status !== "PENDIENTE" && printJob.status !== "CORRIENDO") {
    throw new BusinessError("PRINT_JOB_CANNOT_BE_CANCELLED", "Only pending or running print jobs can be cancelled.");
  }
}

export function assertPrintJobCanBeFinished(printJob: PrintJob): void {
  if (!printJob.active) {
    throw new BusinessError("PRINT_JOB_INACTIVE", "Inactive print jobs cannot be changed.");
  }

  if (printJob.status !== "CORRIENDO") {
    throw new BusinessError("PRINT_JOB_CANNOT_BE_FINISHED", "Only running print jobs can be finished.");
  }
}

export function assertPrintJobCanBeDeleted(printJob: PrintJob): void {
  if (printJob.status === "CORRIENDO") {
    throw new BusinessError("PRINT_JOB_CANNOT_BE_DELETED_WHEN_RUNNING", "Running print jobs cannot be deleted.");
  }
}
