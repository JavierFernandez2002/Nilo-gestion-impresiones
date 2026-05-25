import { Request, Response } from "express";
import { AssignmentService } from "../services/assignment.service.js";
import { assignmentRequestSchema } from "../schemas/assignment.schemas.js";

export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  assignPrintJobs = async (request: Request, response: Response): Promise<void> => {
    const input = assignmentRequestSchema.parse(request.body);
    const result = await this.assignmentService.assignPendingPrints(input);
    response.json({ data: result });
  };
}
