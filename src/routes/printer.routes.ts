import { Router } from "express";
import { PrinterController } from "../controllers/printer.controller.js";
import { PrismaPrinterRepository } from "../repositories/printer.repository.js";
import { prisma } from "../repositories/prisma.js";
import { PrinterService } from "../services/printer.service.js";
import { asyncHandler } from "./async-handler.js";

const printerRepository = new PrismaPrinterRepository(prisma);
const printerService = new PrinterService(printerRepository);
const printerController = new PrinterController(printerService);

export const printerRouter = Router();

printerRouter.get("/", asyncHandler(printerController.list));
printerRouter.get("/:id", asyncHandler(printerController.getById));
printerRouter.post("/", asyncHandler(printerController.create));
printerRouter.put("/:id", asyncHandler(printerController.update));
printerRouter.patch("/:id/status", asyncHandler(printerController.updateStatus));
printerRouter.delete("/:id", asyncHandler(printerController.delete));
