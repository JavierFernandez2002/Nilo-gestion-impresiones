import { BusinessError } from "../errors/business-error.js";
import { ASSIGNMENT_STRATEGIES, AssignmentRequest, AssignmentStrategy } from "./assignment.js";

export function validateAssignmentStrategy(strategy: unknown): AssignmentStrategy {
  if (typeof strategy !== "string" || !ASSIGNMENT_STRATEGIES.includes(strategy as AssignmentStrategy)) {
    throw new BusinessError("ASSIGNMENT_INVALID_STRATEGY", "Assignment strategy is invalid.");
  }

  return strategy as AssignmentStrategy;
}

export function assertAssignmentRequestIsValid(input: AssignmentRequest): void {
  if (input.strategy === "POR_DURACION") {
    if (input.maxEstimatedDurationHours === undefined) {
      throw new BusinessError(
        "ASSIGNMENT_DURATION_REQUIRED",
        "Maximum estimated duration is required for duration assignment."
      );
    }

    if (
      typeof input.maxEstimatedDurationHours !== "number" ||
      !Number.isFinite(input.maxEstimatedDurationHours) ||
      input.maxEstimatedDurationHours <= 0
    ) {
      throw new BusinessError(
        "ASSIGNMENT_DURATION_INVALID",
        "Maximum estimated duration must be a positive number."
      );
    }
  }

  if (input.strategy === "POR_LARGO_PEDIDO") {
    const hasMin = input.minPendingPrints !== undefined;
    const hasMax = input.maxPendingPrints !== undefined;

    if (!hasMin && !hasMax) {
      throw new BusinessError(
        "ASSIGNMENT_ORDER_LENGTH_FILTER_REQUIRED",
        "At least one pending print count filter is required for order length assignment."
      );
    }

    if (hasMin) {
      validatePendingPrintCount(input.minPendingPrints, "ASSIGNMENT_ORDER_LENGTH_INVALID");
    }

    if (hasMax) {
      validatePendingPrintCount(input.maxPendingPrints, "ASSIGNMENT_ORDER_LENGTH_INVALID");
    }

    if (
      hasMin &&
      hasMax &&
      (input.minPendingPrints as number) > (input.maxPendingPrints as number)
    ) {
      throw new BusinessError(
        "ASSIGNMENT_ORDER_LENGTH_INVALID",
        "Minimum pending prints cannot be greater than maximum pending prints."
      );
    }
  }
}

export function validatePendingPrintCount(
  value: unknown,
  errorCode: "ASSIGNMENT_ORDER_LENGTH_INVALID"
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new BusinessError(errorCode, "Pending print count filters must be positive integers.");
  }

  return value;
}
