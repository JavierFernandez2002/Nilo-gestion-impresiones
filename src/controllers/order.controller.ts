import { Request, Response } from "express";
import { linkOrderPrintSchema, createOrderSchema, listOrdersQuerySchema, updateOrderSchema } from "../schemas/order.schemas.js";
import { OrderService } from "../services/order.service.js";

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  list = async (request: Request, response: Response): Promise<void> => {
    const query = listOrdersQuerySchema.parse(request.query);
    const orders = await this.orderService.list(query);
    response.json({ data: orders });
  };

  getById = async (request: Request, response: Response): Promise<void> => {
    const order = await this.orderService.getById(getParam(request, "id"));
    response.json({ data: order });
  };

  create = async (request: Request, response: Response): Promise<void> => {
    const input = createOrderSchema.parse(request.body);
    const order = await this.orderService.create(input);
    response.status(201).json({ data: order });
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const input = updateOrderSchema.parse(request.body);
    const order = await this.orderService.update(getParam(request, "id"), input);
    response.json({ data: order });
  };

  cancel = async (request: Request, response: Response): Promise<void> => {
    const order = await this.orderService.cancel(getParam(request, "id"));
    response.json({ data: order });
  };

  deliver = async (request: Request, response: Response): Promise<void> => {
    const order = await this.orderService.deliver(getParam(request, "id"));
    response.json({ data: order });
  };

  recalculateProgress = async (request: Request, response: Response): Promise<void> => {
    const order = await this.orderService.recalculateProgress(getParam(request, "id"));
    response.json({ data: order });
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    const order = await this.orderService.delete(getParam(request, "id"));
    response.json({ data: order });
  };

  listPrints = async (request: Request, response: Response): Promise<void> => {
    const prints = await this.orderService.listPrints(getParam(request, "id"));
    response.json({ data: prints });
  };

  linkPrint = async (request: Request, response: Response): Promise<void> => {
    const input = linkOrderPrintSchema.parse(request.body);
    const print = await this.orderService.linkPrint(getParam(request, "id"), input);
    response.status(201).json({ data: print });
  };

  unlinkPrint = async (request: Request, response: Response): Promise<void> => {
    const print = await this.orderService.unlinkPrint(getParam(request, "id"), getParam(request, "printJobId"));
    response.json({ data: print });
  };
}

function getParam(request: Request, paramName: string): string {
  const value = request.params[paramName];
  return Array.isArray(value) ? value[0] : value;
}
