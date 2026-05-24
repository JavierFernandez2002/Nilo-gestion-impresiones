import { Router } from "express";
import { OrderController } from "../controllers/order.controller.js";
import { PrismaOrderRepository } from "../repositories/order.repository.js";
import { prisma } from "../repositories/prisma.js";
import { OrderService } from "../services/order.service.js";
import { asyncHandler } from "./async-handler.js";

const orderRepository = new PrismaOrderRepository(prisma);
const orderService = new OrderService(orderRepository);
const orderController = new OrderController(orderService);

export const orderRouter = Router();

orderRouter.get("/", asyncHandler(orderController.list));
orderRouter.get("/:id", asyncHandler(orderController.getById));
orderRouter.post("/", asyncHandler(orderController.create));
orderRouter.put("/:id", asyncHandler(orderController.update));
orderRouter.patch("/:id/cancel", asyncHandler(orderController.cancel));
orderRouter.patch("/:id/deliver", asyncHandler(orderController.deliver));
orderRouter.patch("/:id/recalculate-progress", asyncHandler(orderController.recalculateProgress));
orderRouter.delete("/:id", asyncHandler(orderController.delete));
orderRouter.get("/:id/prints", asyncHandler(orderController.listPrints));
orderRouter.post("/:id/prints", asyncHandler(orderController.linkPrint));
orderRouter.delete("/:id/prints/:printJobId", asyncHandler(orderController.unlinkPrint));
