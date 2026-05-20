import { randomUUID } from "node:crypto";
import { CreatePrinterData, Printer, PrinterStatus, UpdatePrinterData } from "../../domain/printers/printer.js";
import { PrinterRepository } from "../../repositories/printer.repository.js";

export class InMemoryPrinterRepository implements PrinterRepository {
  private printers: Printer[] = [];

  constructor(initialPrinters: Printer[] = []) {
    this.printers = [...initialPrinters];
  }

  findActive(): Promise<Printer[]> {
    return Promise.resolve(this.printers.filter((printer) => printer.active));
  }

  findById(id: string): Promise<Printer | null> {
    return Promise.resolve(this.printers.find((printer) => printer.id === id) ?? null);
  }

  findActiveByNormalizedName(normalizedName: string, excludeId?: string): Promise<Printer | null> {
    return Promise.resolve(
      this.printers.find(
        (printer) => printer.active && printer.normalizedName === normalizedName && printer.id !== excludeId
      ) ?? null
    );
  }

  create(data: CreatePrinterData & { normalizedName: string; status: PrinterStatus }): Promise<Printer> {
    const now = new Date();
    const printer: Printer = {
      id: randomUUID(),
      name: data.name,
      normalizedName: data.normalizedName,
      status: data.status,
      model: data.model ?? null,
      location: data.location ?? null,
      ipWifi: data.ipWifi ?? null,
      active: true,
      createdAt: now,
      updatedAt: now
    };

    this.printers.push(printer);
    return Promise.resolve(printer);
  }

  update(id: string, data: UpdatePrinterData & { normalizedName?: string; status?: PrinterStatus; active?: boolean }): Promise<Printer> {
    const index = this.printers.findIndex((printer) => printer.id === id);
    if (index === -1) {
      throw new Error("Printer not found in fake repository.");
    }

    const updatedPrinter: Printer = {
      ...this.printers[index],
      ...data,
      updatedAt: new Date()
    };

    this.printers[index] = updatedPrinter;
    return Promise.resolve(updatedPrinter);
  }
}
