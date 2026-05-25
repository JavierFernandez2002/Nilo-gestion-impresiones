import { Router } from "express";
import { StatisticsController } from "../controllers/statistics.controller.js";
import { PrismaStatisticsRepository } from "../repositories/statistics.repository.js";
import { prisma } from "../repositories/prisma.js";
import { StatisticsService } from "../services/statistics.service.js";
import { asyncHandler } from "./async-handler.js";

const statisticsRepository = new PrismaStatisticsRepository(prisma);
const statisticsService = new StatisticsService(statisticsRepository);
const statisticsController = new StatisticsController(statisticsService);

export const statisticsRouter = Router();

statisticsRouter.get("/production", asyncHandler(statisticsController.getProductionStatistics));
