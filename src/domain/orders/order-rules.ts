import { BusinessError } from "../errors/business-error.js";
import { LinkedPrintStatus, ORDER_STATUSES, Order, OrderStatus } from "./order.js";

export function normalizeOrderCode(orderCode: string): string {
  return orderCode.trim().toLowerCase();
}

export function validateOrderCode(orderCode: unknown): string {
  if (typeof orderCode !== "string" || orderCode.trim().length === 0) {
    throw new BusinessError("ORDER_CODE_REQUIRED", "Order code is required.");
  }

  const trimmed = orderCode.trim();
  if (trimmed.length > 80) {
    throw new BusinessError("ORDER_CODE_REQUIRED", "Order code must be between 1 and 80 characters.");
  }

  return trimmed;
}

export function validateOrderStatus(status: unknown): OrderStatus {
  if (typeof status !== "string" || !ORDER_STATUSES.includes(status as OrderStatus)) {
    throw new BusinessError("ORDER_INVALID_STATUS", "Order status is invalid.");
  }

  return status as OrderStatus;
}

export function normalizeOptionalOrderText(
  value: unknown,
  errorCode: "ORDER_CUSTOMER_NAME_INVALID" | "ORDER_OBSERVATIONS_INVALID"
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
  if (trimmed.length === 0 || trimmed.length > 200) {
    throw new BusinessError(errorCode);
  }

  return trimmed;
}

export function normalizeOptionalDeliveryDate(value: unknown): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const date = value instanceof Date ? value : typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw new BusinessError("ORDER_ESTIMATED_DELIVERY_DATE_INVALID", "Estimated delivery date is invalid.");
  }

  return date;
}

export function validatePrintJobId(printJobId: unknown): string {
  if (typeof printJobId !== "string" || printJobId.trim().length === 0) {
    throw new BusinessError("ORDER_PRINT_JOB_ID_REQUIRED", "Print job id is required.");
  }

  return printJobId.trim();
}

export function assertOrderCanBeEdited(order: Order): void {
  if (order.status === "ENTREGADO") {
    throw new BusinessError("ORDER_ALREADY_DELIVERED", "Delivered orders cannot be changed.");
  }

  if (order.status === "CANCELADO") {
    throw new BusinessError("ORDER_ALREADY_CANCELLED", "Cancelled orders cannot be changed.");
  }
}

export function assertOrderCanLinkPrint(order: Order): void {
  if (!order.active) {
    throw new BusinessError("ORDER_INACTIVE", "Inactive orders cannot be changed.");
  }

  assertOrderCanBeEdited(order);
}

export function calculateOrderProgress(statuses: LinkedPrintStatus[]): { status: OrderStatus; progressPercentage: number } {
  const validPrints = statuses.filter((print) => print.status !== "CANCELADA");
  if (validPrints.length === 0) {
    return { status: "PENDIENTE", progressPercentage: 0 };
  }

  const finishedPrints = validPrints.filter((print) => print.status === "FINALIZADA").length;
  const progressPercentage = Math.round((finishedPrints / validPrints.length) * 100);

  if (progressPercentage === 100) {
    return { status: "LISTO_EN_TALLER", progressPercentage };
  }

  if (progressPercentage > 0) {
    return { status: "INCOMPLETO", progressPercentage };
  }

  return { status: "PENDIENTE", progressPercentage };
}
