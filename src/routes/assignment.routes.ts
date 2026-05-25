import { Router } from "express";
import { AssignmentController } from "../controllers/assignment.controller.js";
import { PrismaAssignmentRepository } from "../repositories/assignment.repository.js";
import { prisma } from "../repositories/prisma.js";
import { AssignmentService } from "../services/assignment.service.js";
import { asyncHandler } from "./async-handler.js";

const assignmentRepository = new PrismaAssignmentRepository(prisma);
const assignmentService = new AssignmentService(assignmentRepository);
const assignmentController = new AssignmentController(assignmentService);

export const assignmentRouter = Router();

assignmentRouter.post("/print-jobs", asyncHandler(assignmentController.assignPrintJobs));
