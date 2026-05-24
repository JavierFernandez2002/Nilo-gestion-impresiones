import { z } from "zod";
import { ORDER_STATUSES } from "../domain/orders/order.js";

const optionalString = z.string().trim().optional().nullable();
const optionalDateString = z.string().datetime().optional().nullable();
const activeQuerySchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}, z.boolean().optional());

export const listOrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  active: activeQuerySchema
});

export const createOrderSchema = z.object({
  orderCode: z.string(),
  customerName: optionalString,
  estimatedDeliveryDate: optionalDateString,
  observations: optionalString
});

export const updateOrderSchema = z.object({
  orderCode: z.string().optional(),
  customerName: optionalString,
  estimatedDeliveryDate: optionalDateString,
  observations: optionalString
});

export const linkOrderPrintSchema = z.object({
  printJobId: z.string()
});

export type ListOrdersQueryInput = z.infer<typeof listOrdersQuerySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type LinkOrderPrintInput = z.infer<typeof linkOrderPrintSchema>;
