import { Request, Response } from "express";
import { CreatePrintJobData, UpdatePrintJobData } from "../domain/print-jobs/print-job.js";
import { createPrintJobSchema, listPrintJobsQuerySchema, updatePrintJobSchema } from "../schemas/print-job.schemas.js";
import { PrintJobService } from "../services/print-job.service.js";

export class PrintJobController {
  constructor(private readonly printJobService: PrintJobService) {}

  list = async (request: Request, response: Response): Promise<void> => {
    const query = listPrintJobsQuerySchema.parse(request.query);
    const printJobs = await this.printJobService.list(query);
    response.json({ data: printJobs });
  };

  getById = async (request: Request, response: Response): Promise<void> => {
    const printJob = await this.printJobService.getById(getParam(request, "id"));
    response.json({ data: printJob });
  };

  create = async (request: Request, response: Response): Promise<void> => {
    const input = createPrintJobSchema.parse(request.body);
    const printJob = await this.printJobService.create(input as CreatePrintJobData);
    response.status(201).json({ data: printJob });
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const input = updatePrintJobSchema.parse(request.body);
    const printJob = await this.printJobService.update(getParam(request, "id"), input as UpdatePrintJobData);
    response.json({ data: printJob });
  };

  cancel = async (request: Request, response: Response): Promise<void> => {
    const printJob = await this.printJobService.cancel(getParam(request, "id"));
    response.json({ data: printJob });
  };

  finish = async (request: Request, response: Response): Promise<void> => {
    const printJob = await this.printJobService.finish(getParam(request, "id"));
    response.json({ data: printJob });
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    const printJob = await this.printJobService.delete(getParam(request, "id"));
    response.json({ data: printJob });
  };
}

function getParam(request: Request, paramName: string): string {
  const value = request.params[paramName];
  return Array.isArray(value) ? value[0] : value;
}
