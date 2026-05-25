import {
  AssignmentItem,
  AssignmentRequest,
  AssignmentResult
} from "../domain/assignments/assignment.js";
import { assertAssignmentRequestIsValid } from "../domain/assignments/assignment-rules.js";
import { AssignmentRepository } from "../repositories/assignment.repository.js";

export class AssignmentService {
  constructor(private readonly assignmentRepository: AssignmentRepository) {}

  async assignPendingPrints(input: AssignmentRequest): Promise<AssignmentResult> {
    assertAssignmentRequestIsValid(input);

    const availablePrinters = await this.assignmentRepository.findAvailablePrinters();
    const candidates = await this.assignmentRepository.findCandidates(input);
    const limit = Math.min(availablePrinters.length, candidates.length);
    const assignments: AssignmentItem[] = [];

    for (let index = 0; index < limit; index += 1) {
      const candidate = candidates[index];
      const printer = availablePrinters[index];
      if (!candidate || !printer) {
        break;
      }

      assignments.push(await this.assignmentRepository.assignPrintJobToPrinter(candidate, printer.id));
    }

    return {
      strategy: input.strategy,
      assignedCount: assignments.length,
      availablePrinterCount: availablePrinters.length,
      eligiblePrintJobCount: candidates.length,
      assignments
    };
  }
}
