import { ZodError } from "zod";
import { BusinessError } from "./business-error.js";

const conflictCodes = new Set([
  "PRINTER_NAME_ALREADY_EXISTS",
  "PRINTER_HAS_ACTIVE_PRINT",
  "PRINTER_ALREADY_PRINTING",
  "PRINTER_IN_MAINTENANCE",
  "PRINTER_INACTIVE"
]);

const badRequestCodes = new Set([
  "PRINTER_NAME_REQUIRED",
  "PRINTER_INVALID_STATUS",
  "PRINTER_INVALID_IP",
  "PRINTER_MODEL_INVALID",
  "PRINTER_LOCATION_INVALID"
]);

export function mapErrorToHttp(error: unknown): { status: number; body: unknown } {
  if (error instanceof BusinessError) {
    if (error.code === "PRINTER_NOT_FOUND") {
      return { status: 404, body: { code: error.code, message: error.message } };
    }

    if (conflictCodes.has(error.code)) {
      return { status: 409, body: { code: error.code, message: error.message } };
    }

    if (badRequestCodes.has(error.code)) {
      return { status: 400, body: { code: error.code, message: error.message } };
    }
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        code: "VALIDATION_ERROR",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      }
    };
  }

  return { status: 500, body: { code: "INTERNAL_SERVER_ERROR" } };
}
