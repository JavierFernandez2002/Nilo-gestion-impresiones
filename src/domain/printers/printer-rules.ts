import { BusinessError } from "../errors/business-error.js";
import { PRINTER_STATUSES, Printer, PrinterStatus } from "./printer.js";

const ipv4Segment = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const ipv4Regex = new RegExp(`^${ipv4Segment}\\.${ipv4Segment}\\.${ipv4Segment}\\.${ipv4Segment}$`);

export function normalizePrinterName(name: string): string {
  return name.trim().toLowerCase();
}

export function validatePrinterName(name: unknown): string {
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new BusinessError("PRINTER_NAME_REQUIRED", "Printer name is required.");
  }

  const trimmed = name.trim();
  if (trimmed.length > 80) {
    throw new BusinessError("PRINTER_NAME_REQUIRED", "Printer name must be between 1 and 80 characters.");
  }

  return trimmed;
}

export function validatePrinterStatus(status: unknown): PrinterStatus {
  if (typeof status !== "string" || !PRINTER_STATUSES.includes(status as PrinterStatus)) {
    throw new BusinessError("PRINTER_INVALID_STATUS", "Printer status is invalid.");
  }

  return status as PrinterStatus;
}

export function normalizeOptionalText(value: unknown, errorCode: "PRINTER_MODEL_INVALID" | "PRINTER_LOCATION_INVALID"): string | null | undefined {
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
  if (trimmed.length === 0 || trimmed.length > 100) {
    throw new BusinessError(errorCode);
  }

  return trimmed;
}

export function normalizeOptionalIp(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new BusinessError("PRINTER_INVALID_IP", "Printer WiFi IP must be a valid IPv4 address.");
  }

  const trimmed = value.trim();
  if (!ipv4Regex.test(trimmed)) {
    throw new BusinessError("PRINTER_INVALID_IP", "Printer WiFi IP must be a valid IPv4 address.");
  }

  return trimmed;
}

export function assertPrinterCanReceivePrint(printer: Printer): void {
  if (!printer.active) {
    throw new BusinessError("PRINTER_INACTIVE", "Inactive printers cannot receive prints.");
  }

  if (printer.status === "MANTENIMIENTO") {
    throw new BusinessError("PRINTER_IN_MAINTENANCE", "Printers in maintenance cannot receive prints.");
  }

  if (printer.status === "IMPRIMIENDO") {
    throw new BusinessError("PRINTER_ALREADY_PRINTING", "Printers already printing cannot receive another print.");
  }
}

export function isPrinterAvailableForAssignment(printer: Printer): boolean {
  return printer.active && printer.status === "LISTA";
}
