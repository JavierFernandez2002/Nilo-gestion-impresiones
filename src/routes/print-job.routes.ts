import { Router } from "express";
import { PrintJobController } from "../controllers/print-job.controller.js";
import { PrismaOrderRepository } from "../repositories/order.repository.js";
import { PrismaPrintJobRepository } from "../repositories/print-job.repository.js";
import { PrismaPrinterRepository } from "../repositories/printer.repository.js";
import { prisma } from "../repositories/prisma.js";
import { OrderService } from "../services/order.service.js";
import { PrintJobService } from "../services/print-job.service.js";
import { PrinterService } from "../services/printer.service.js";
import { asyncHandler } from "./async-handler.js";

const orderRepository = new PrismaOrderRepository(prisma);
const orderService = new OrderService(orderRepository);
const printJobRepository = new PrismaPrintJobRepository(prisma);
const printerRepository = new PrismaPrinterRepository(prisma);
const printerService = new PrinterService(printerRepository);
const printJobService = new PrintJobService(printJobRepository, orderService, printerService);
const printJobController = new PrintJobController(printJobService);

export const printJobRouter = Router();

printJobRouter.get("/", asyncHandler(printJobController.list));
printJobRouter.get("/:id", asyncHandler(printJobController.getById));
printJobRouter.post("/", asyncHandler(printJobController.create));
printJobRouter.put("/:id", asyncHandler(printJobController.update));
printJobRouter.patch("/:id/assign-printer", asyncHandler(printJobController.assignPrinter));
printJobRouter.patch("/:id/cancel", asyncHandler(printJobController.cancel));
printJobRouter.patch("/:id/finish", asyncHandler(printJobController.finish));
printJobRouter.delete("/:id", asyncHandler(printJobController.delete));
