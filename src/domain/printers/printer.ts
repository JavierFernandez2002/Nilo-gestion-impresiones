export const PRINTER_STATUSES = ["LISTA", "IMPRIMIENDO", "MANTENIMIENTO"] as const;

export type PrinterStatus = (typeof PRINTER_STATUSES)[number];

export interface Printer {
  id: string;
  name: string;
  normalizedName: string;
  status: PrinterStatus;
  model: string | null;
  location: string | null;
  ipWifi: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePrinterData {
  name: string;
  status?: PrinterStatus;
  model?: string | null;
  location?: string | null;
  ipWifi?: string | null;
}

export interface UpdatePrinterData {
  name?: string;
  model?: string | null;
  location?: string | null;
  ipWifi?: string | null;
}
