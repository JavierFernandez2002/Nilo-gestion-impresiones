export const ASSIGNMENT_STRATEGIES = ["AUTOMATICO", "POR_DURACION", "POR_LARGO_PEDIDO"] as const;

export type AssignmentStrategy = (typeof ASSIGNMENT_STRATEGIES)[number];

export interface AssignmentRequest {
  strategy: AssignmentStrategy;
  maxEstimatedDurationHours?: number;
  minPendingPrints?: number;
  maxPendingPrints?: number;
}

export interface AssignmentCandidate {
  printJobId: string;
  orderId: string;
  estimatedDurationHours: number | null;
  orderCreatedAt: Date;
  orderPrintCreatedAt: Date;
  printJobCreatedAt: Date;
  pendingPrintCount: number;
}

export interface AssignmentItem {
  printJobId: string;
  printerId: string;
  orderId: string;
  status: "CORRIENDO";
  printerStatus: "IMPRIMIENDO";
}

export interface AssignmentResult {
  strategy: AssignmentStrategy;
  assignedCount: number;
  availablePrinterCount: number;
  eligiblePrintJobCount: number;
  assignments: AssignmentItem[];
}
