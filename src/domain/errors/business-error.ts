export type BusinessErrorCode =
  | "PRINTER_NAME_REQUIRED"
  | "PRINTER_NAME_ALREADY_EXISTS"
  | "PRINTER_INVALID_STATUS"
  | "PRINTER_NOT_FOUND"
  | "PRINTER_IN_MAINTENANCE"
  | "PRINTER_ALREADY_PRINTING"
  | "PRINTER_HAS_ACTIVE_PRINT"
  | "PRINTER_INACTIVE"
  | "PRINTER_INVALID_IP"
  | "PRINTER_MODEL_INVALID"
  | "PRINTER_LOCATION_INVALID";

export class BusinessError extends Error {
  constructor(
    public readonly code: BusinessErrorCode,
    message: string = code
  ) {
    super(message);
    this.name = "BusinessError";
  }
}
