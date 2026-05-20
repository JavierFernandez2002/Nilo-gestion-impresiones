import { describe, expect, it } from "vitest";
import { BusinessError } from "../domain/errors/business-error.js";
import { Printer } from "../domain/printers/printer.js";
import { normalizePrinterName } from "../domain/printers/printer-rules.js";
import { PrinterService } from "../services/printer.service.js";
import { InMemoryPrinterRepository } from "./fakes/in-memory-printer.repository.js";

function makePrinter(overrides: Partial<Printer> = {}): Printer {
  const now = new Date();
  const name = overrides.name ?? "Nilo 01";

  return {
    id: overrides.id ?? "printer-1",
    name,
    normalizedName: overrides.normalizedName ?? normalizePrinterName(name),
    status: overrides.status ?? "LISTA",
    model: overrides.model ?? null,
    location: overrides.location ?? null,
    ipWifi: overrides.ipWifi ?? null,
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now
  };
}

async function expectBusinessError(action: () => Promise<unknown>, code: string): Promise<void> {
  await expect(action()).rejects.toMatchObject({ code });
}

describe("PrinterService", () => {
  it("creates a valid printer as active and ready by default", async () => {
    const service = new PrinterService(new InMemoryPrinterRepository());

    const printer = await service.create({ name: " Nilo 01 " });

    expect(printer.name).toBe("Nilo 01");
    expect(printer.normalizedName).toBe("nilo 01");
    expect(printer.active).toBe(true);
    expect(printer.status).toBe("LISTA");
  });

  it("fails when creating a printer without name", async () => {
    const service = new PrinterService(new InMemoryPrinterRepository());

    await expectBusinessError(() => service.create({ name: "   " }), "PRINTER_NAME_REQUIRED");
  });

  it("fails when creating a duplicated active printer name ignoring case and external spaces", async () => {
    const repository = new InMemoryPrinterRepository([makePrinter({ name: "Nilo 01" })]);
    const service = new PrinterService(repository);

    await expectBusinessError(() => service.create({ name: "  nilo 01 " }), "PRINTER_NAME_ALREADY_EXISTS");
  });

  it("allows reusing a name from an inactive printer", async () => {
    const repository = new InMemoryPrinterRepository([makePrinter({ name: "Nilo 01", active: false })]);
    const service = new PrinterService(repository);

    const printer = await service.create({ name: "nilo 01" });

    expect(printer.name).toBe("nilo 01");
  });

  it("fails when creating with invalid status or manual printing status", async () => {
    const service = new PrinterService(new InMemoryPrinterRepository());

    await expectBusinessError(
      () => service.create({ name: "Nilo 01", status: "FUERA_DE_LINEA" as never }),
      "PRINTER_INVALID_STATUS"
    );
    await expectBusinessError(() => service.create({ name: "Nilo 02", status: "IMPRIMIENDO" }), "PRINTER_INVALID_STATUS");
  });

  it("validates model, location and IPv4 when updating", async () => {
    const repository = new InMemoryPrinterRepository([makePrinter()]);
    const service = new PrinterService(repository);

    await expectBusinessError(() => service.update("printer-1", { model: "" }), "PRINTER_MODEL_INVALID");
    await expectBusinessError(() => service.update("printer-1", { location: "   " }), "PRINTER_LOCATION_INVALID");
    await expectBusinessError(() => service.update("printer-1", { ipWifi: "999.1.1.1" }), "PRINTER_INVALID_IP");

    const printer = await service.update("printer-1", {
      model: "Bambu Lab P1S",
      location: "Taller A",
      ipWifi: "192.168.1.20"
    });

    expect(printer.model).toBe("Bambu Lab P1S");
    expect(printer.location).toBe("Taller A");
    expect(printer.ipWifi).toBe("192.168.1.20");
  });

  it("soft deletes a printer", async () => {
    const repository = new InMemoryPrinterRepository([makePrinter()]);
    const service = new PrinterService(repository);

    const printer = await service.delete("printer-1");

    expect(printer.active).toBe(false);
  });

  it("does not list inactive printers as available for assignment", async () => {
    const repository = new InMemoryPrinterRepository([
      makePrinter({ id: "ready", status: "LISTA", active: true }),
      makePrinter({ id: "inactive", status: "LISTA", active: false }),
      makePrinter({ id: "maintenance", status: "MANTENIMIENTO", active: true })
    ]);
    const service = new PrinterService(repository);

    const availablePrinters = await service.listAvailableForAssignment();

    expect(availablePrinters).toHaveLength(1);
    expect(availablePrinters[0]?.id).toBe("ready");
  });

  it("does not allow manually changing a printer to printing", async () => {
    const repository = new InMemoryPrinterRepository([makePrinter()]);
    const service = new PrinterService(repository);

    await expectBusinessError(() => service.updateStatus("printer-1", "IMPRIMIENDO"), "PRINTER_INVALID_STATUS");
  });

  it("does not allow sending a printing printer to maintenance", async () => {
    const repository = new InMemoryPrinterRepository([makePrinter({ status: "IMPRIMIENDO" })]);
    const service = new PrinterService(repository);

    await expectBusinessError(() => service.updateStatus("printer-1", "MANTENIMIENTO"), "PRINTER_HAS_ACTIVE_PRINT");
  });

  it("does not allow deleting a printing printer", async () => {
    const repository = new InMemoryPrinterRepository([makePrinter({ status: "IMPRIMIENDO" })]);
    const service = new PrinterService(repository);

    await expectBusinessError(() => service.delete("printer-1"), "PRINTER_HAS_ACTIVE_PRINT");
  });

  it("maps printer availability business failures", () => {
    const service = new PrinterService(new InMemoryPrinterRepository());

    expect(() => service.assertCanReceivePrint(makePrinter({ active: false }))).toThrow(BusinessError);
    expect(() => service.assertCanReceivePrint(makePrinter({ status: "MANTENIMIENTO" }))).toThrow(BusinessError);
    expect(() => service.assertCanReceivePrint(makePrinter({ status: "IMPRIMIENDO" }))).toThrow(BusinessError);
  });
});
