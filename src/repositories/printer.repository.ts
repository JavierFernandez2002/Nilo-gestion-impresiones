import { PrismaClient } from "@prisma/client";
import { CreatePrinterData, Printer, PrinterStatus, UpdatePrinterData } from "../domain/printers/printer.js";

export interface PrinterRepository {
  findActive(): Promise<Printer[]>;
  findById(id: string): Promise<Printer | null>;
  findActiveByNormalizedName(normalizedName: string, excludeId?: string): Promise<Printer | null>;
  create(data: CreatePrinterData & { normalizedName: string; status: PrinterStatus }): Promise<Printer>;
  update(id: string, data: UpdatePrinterData & { normalizedName?: string; status?: PrinterStatus; active?: boolean }): Promise<Printer>;
}

export class PrismaPrinterRepository implements PrinterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findActive(): Promise<Printer[]> {
    return this.prisma.printer.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" }
    }) as Promise<Printer[]>;
  }

  findById(id: string): Promise<Printer | null> {
    return this.prisma.printer.findUnique({ where: { id } }) as Promise<Printer | null>;
  }

  findActiveByNormalizedName(normalizedName: string, excludeId?: string): Promise<Printer | null> {
    return this.prisma.printer.findFirst({
      where: {
        normalizedName,
        active: true,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    }) as Promise<Printer | null>;
  }

  create(data: CreatePrinterData & { normalizedName: string; status: PrinterStatus }): Promise<Printer> {
    return this.prisma.printer.create({
      data: {
        name: data.name,
        normalizedName: data.normalizedName,
        status: data.status,
        model: data.model ?? null,
        location: data.location ?? null,
        ipWifi: data.ipWifi ?? null,
        active: true
      }
    }) as Promise<Printer>;
  }

  update(id: string, data: UpdatePrinterData & { normalizedName?: string; status?: PrinterStatus; active?: boolean }): Promise<Printer> {
    return this.prisma.printer.update({
      where: { id },
      data
    }) as Promise<Printer>;
  }
}
