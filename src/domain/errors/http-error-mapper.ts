import { ZodError } from "zod";
import { BusinessError } from "./business-error.js";

const conflictCodes = new Set([
  "PRINTER_NAME_ALREADY_EXISTS",
  "PRINTER_HAS_ACTIVE_PRINT",
  "PRINTER_ALREADY_PRINTING",
  "PRINTER_IN_MAINTENANCE",
  "PRINTER_INACTIVE",
  "ORDER_CODE_ALREADY_EXISTS",
  "ORDER_ALREADY_DELIVERED",
  "ORDER_ALREADY_CANCELLED",
  "ORDER_INACTIVE",
  "ORDER_PRINT_ALREADY_LINKED",
  "ORDER_CANNOT_BE_DELIVERED_UNLESS_READY",
  "ORDER_CANNOT_BE_DELETED_WHEN_DELIVERED",
  "PRINT_JOB_ORDER_NOT_AVAILABLE",
  "PRINT_JOB_INACTIVE",
  "PRINT_JOB_CANNOT_BE_CHANGED",
  "ASSIGNMENT_INVALID_STRATEGY",
  "ASSIGNMENT_DURATION_REQUIRED",
  "ASSIGNMENT_DURATION_INVALID",
  "ASSIGNMENT_ORDER_LENGTH_FILTER_REQUIRED",
  "ASSIGNMENT_ORDER_LENGTH_INVALID",
  "PRINT_JOB_CANNOT_BE_CANCELLED",
  "PRINT_JOB_CANNOT_BE_FINISHED",
  "PRINT_JOB_CANNOT_BE_DELETED_WHEN_RUNNING"
]);

const badRequestCodes = new Set([
  "PRINTER_NAME_REQUIRED",
  "PRINTER_INVALID_STATUS",
  "PRINTER_INVALID_IP",
  "PRINTER_MODEL_INVALID",
  "PRINTER_LOCATION_INVALID",
  "ORDER_CODE_REQUIRED",
  "ORDER_INVALID_STATUS",
  "ORDER_CUSTOMER_NAME_INVALID",
  "ORDER_OBSERVATIONS_INVALID",
  "ORDER_ESTIMATED_DELIVERY_DATE_INVALID",
  "ORDER_PRINT_JOB_ID_REQUIRED",
  "PRINT_JOB_MODEL_NAME_REQUIRED",
  "PRINT_JOB_MODEL_FIELD_INVALID",
  "PRINT_JOB_ESTIMATED_DURATION_INVALID",
  "PRINT_JOB_OBSERVATIONS_INVALID",
  "PRINT_JOB_ORDER_ID_REQUIRED",
  "PRINT_JOB_INVALID_STATUS",
  "STATISTICS_INVALID_DATE_RANGE"
]);

const notFoundCodes = new Set([
  "PRINTER_NOT_FOUND",
  "ORDER_NOT_FOUND",
  "ORDER_PRINT_NOT_FOUND",
  "ORDER_PRINT_LINK_NOT_FOUND",
  "PRINT_JOB_NOT_FOUND"
]);

export function mapErrorToHttp(error: unknown): { status: number; body: unknown } {
  if (error instanceof BusinessError) {
    if (notFoundCodes.has(error.code)) {
      return { status: 404, body: errorBody(error.code, error.message) };
    }

    if (conflictCodes.has(error.code)) {
      return { status: 409, body: errorBody(error.code, error.message) };
    }

    if (badRequestCodes.has(error.code)) {
      return { status: 400, body: errorBody(error.code, error.message) };
    }
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      body: errorBody(
        "VALIDATION_ERROR",
        error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
      )
    };
  }

  return { status: 500, body: errorBody("INTERNAL_SERVER_ERROR", "Internal server error.") };
}

function errorBody(code: string, message: string): { error: { code: string; message: string } } {
  return { error: { code, message } };
}
