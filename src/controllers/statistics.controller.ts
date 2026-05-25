import { Request, Response } from "express";
import { productionStatisticsQuerySchema } from "../schemas/statistics.schemas.js";
import { StatisticsService } from "../services/statistics.service.js";

export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  getProductionStatistics = async (request: Request, response: Response): Promise<void> => {
    const input = productionStatisticsQuerySchema.parse(request.query);
    const statistics = await this.statisticsService.getProductionStatistics(input);
    response.json({ data: statistics });
  };
}
