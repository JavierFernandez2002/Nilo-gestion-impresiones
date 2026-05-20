import { Request, Response } from "express";
import { PrinterService } from "../services/printer.service.js";
import { createPrinterSchema, updatePrinterSchema, updatePrinterStatusSchema } from "../schemas/printer.schemas.js";

export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  list = async (_request: Request, response: Response): Promise<void> => {
    const printers = await this.printerService.listActive();
    response.json({ data: printers });
  };

  getById = async (request: Request, response: Response): Promise<void> => {
    const printer = await this.printerService.getById(getParam(request, "id"));
    response.json({ data: printer });
  };

  create = async (request: Request, response: Response): Promise<void> => {
    const input = createPrinterSchema.parse(request.body);
    const printer = await this.printerService.create(input);
    response.status(201).json({ data: printer });
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const input = updatePrinterSchema.parse(request.body);
    const printer = await this.printerService.update(getParam(request, "id"), input);
    response.json({ data: printer });
  };

  updateStatus = async (request: Request, response: Response): Promise<void> => {
    const input = updatePrinterStatusSchema.parse(request.body);
    const printer = await this.printerService.updateStatus(getParam(request, "id"), input.status);
    response.json({ data: printer });
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    const printer = await this.printerService.delete(getParam(request, "id"));
    response.json({ data: printer });
  };
}

function getParam(request: Request, paramName: string): string {
  const value = request.params[paramName];
  return Array.isArray(value) ? value[0] : value;
}
