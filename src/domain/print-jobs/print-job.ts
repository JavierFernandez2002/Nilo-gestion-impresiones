export const PRINT_JOB_STATUSES = ["PENDIENTE", "CORRIENDO", "FINALIZADA", "CANCELADA"] as const;

export type PrintJobStatus = (typeof PRINT_JOB_STATUSES)[number];

export interface PrintJob {
  id: string;
  printerId: string | null;
  modelName: string;
  modelCode: string | null;
  material: string | null;
  color: string | null;
  estimatedDurationHours: number | null;
  status: PrintJobStatus;
  startedAt: Date | null;
  finishedAt: Date | null;
  cancelledAt: Date | null;
  observations: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePrintJobData {
  orderId: string;
  printerId?: string | null;
  modelName: string;
  modelCode?: string | null;
  material?: string | null;
  color?: string | null;
  estimatedDurationHours?: number | null;
  observations?: string | null;
}

export interface UpdatePrintJobData {
  printerId?: string | null;
  modelName?: string;
  modelCode?: string | null;
  material?: string | null;
  color?: string | null;
  estimatedDurationHours?: number | null;
  observations?: string | null;
}
