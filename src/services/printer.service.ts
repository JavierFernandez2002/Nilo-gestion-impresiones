import { BusinessError } from "../domain/errors/business-error.js";
import {
  assertPrinterCanReceivePrint,
  isPrinterAvailableForAssignment,
  normalizeOptionalIp,
  normalizeOptionalText,
  normalizePrinterName,
  validatePrinterName,
  validatePrinterStatus
} from "../domain/printers/printer-rules.js";
import { CreatePrinterData, Printer, PrinterStatus, UpdatePrinterData } from "../domain/printers/printer.js";
import { PrinterRepository } from "../repositories/printer.repository.js";

export class PrinterService {
  constructor(private readonly printerRepository: PrinterRepository) {}

  async listActive(): Promise<Printer[]> {
    return this.printerRepository.findActive();
  }

  async listAvailableForAssignment(): Promise<Printer[]> {
    const printers = await this.printerRepository.findActive();
    return printers.filter(isPrinterAvailableForAssignment);
  }

  async getById(id: string): Promise<Printer> {
    const printer = await this.printerRepository.findById(id);
    if (!printer) {
      throw new BusinessError("PRINTER_NOT_FOUND", "Printer was not found.");
    }

    return printer;
  }

  async create(input: CreatePrinterData): Promise<Printer> {
    const name = validatePrinterName(input.name);
    const normalizedName = normalizePrinterName(name);
    const status = input.status === undefined ? "LISTA" : validatePrinterStatus(input.status);

    if (status === "IMPRIMIENDO") {
      throw new BusinessError("PRINTER_INVALID_STATUS", "Printers cannot be created manually in printing status.");
    }

    await this.assertActiveNameIsUnique(normalizedName);

    return this.printerRepository.create({
      name,
      normalizedName,
      status,
      model: normalizeOptionalText(input.model, "PRINTER_MODEL_INVALID"),
      location: normalizeOptionalText(input.location, "PRINTER_LOCATION_INVALID"),
      ipWifi: normalizeOptionalIp(input.ipWifi)
    });
  }

  async update(id: string, input: UpdatePrinterData): Promise<Printer> {
    const current = await this.getById(id);
    const updateData: UpdatePrinterData & { normalizedName?: string } = {};

    if (input.name !== undefined) {
      const name = validatePrinterName(input.name);
      const normalizedName = normalizePrinterName(name);
      await this.assertActiveNameIsUnique(normalizedName, id);
      updateData.name = name;
      updateData.normalizedName = normalizedName;
    }

    const model = normalizeOptionalText(input.model, "PRINTER_MODEL_INVALID");
    const location = normalizeOptionalText(input.location, "PRINTER_LOCATION_INVALID");
    const ipWifi = normalizeOptionalIp(input.ipWifi);

    if (model !== undefined) {
      updateData.model = model;
    }

    if (location !== undefined) {
      updateData.location = location;
    }

    if (ipWifi !== undefined) {
      updateData.ipWifi = ipWifi;
    }

    return this.printerRepository.update(current.id, updateData);
  }

  async updateStatus(id: string, statusInput: PrinterStatus): Promise<Printer> {
    const current = await this.getById(id);
    const nextStatus = validatePrinterStatus(statusInput);

    if (!current.active) {
      throw new BusinessError("PRINTER_INACTIVE", "Inactive printers cannot change status.");
    }

    if (nextStatus === "IMPRIMIENDO") {
      throw new BusinessError("PRINTER_INVALID_STATUS", "Printing status is assigned only by print assignment flow.");
    }

    if (current.status === "IMPRIMIENDO" && nextStatus === "LISTA") {
      throw new BusinessError("PRINTER_HAS_ACTIVE_PRINT", "Printing printers can return to ready only by finishing or cancelling their active print.");
    }

    if (current.status === "IMPRIMIENDO" && nextStatus === "MANTENIMIENTO") {
      throw new BusinessError("PRINTER_HAS_ACTIVE_PRINT", "Printing printers cannot enter maintenance while they have an active print.");
    }

    return this.printerRepository.update(current.id, { status: nextStatus });
  }

  async delete(id: string): Promise<Printer> {
    const current = await this.getById(id);

    if (current.status === "IMPRIMIENDO") {
      throw new BusinessError("PRINTER_HAS_ACTIVE_PRINT", "Printing printers cannot be deleted while they have an active print.");
    }

    return this.printerRepository.update(current.id, { active: false });
  }

  assertCanReceivePrint(printer: Printer): void {
    assertPrinterCanReceivePrint(printer);
  }

  private async assertActiveNameIsUnique(normalizedName: string, excludeId?: string): Promise<void> {
    const duplicatedPrinter = await this.printerRepository.findActiveByNormalizedName(normalizedName, excludeId);
    if (duplicatedPrinter) {
      throw new BusinessError("PRINTER_NAME_ALREADY_EXISTS", "An active printer with this name already exists.");
    }
  }
}
