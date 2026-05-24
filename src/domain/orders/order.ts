export const ORDER_STATUSES = ["PENDIENTE", "INCOMPLETO", "LISTO_EN_TALLER", "ENTREGADO", "CANCELADO"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Order {
  id: string;
  orderCode: string;
  normalizedOrderCode: string;
  customerName: string | null;
  status: OrderStatus;
  progressPercentage: number;
  estimatedDeliveryDate: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  observations: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderPrint {
  id: string;
  orderId: string;
  printJobId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderData {
  orderCode: string;
  customerName?: string | null;
  estimatedDeliveryDate?: Date | string | null;
  observations?: string | null;
}

export interface UpdateOrderData {
  orderCode?: string;
  customerName?: string | null;
  estimatedDeliveryDate?: Date | string | null;
  observations?: string | null;
}

export interface LinkOrderPrintData {
  printJobId: string;
}

export interface LinkedPrintStatus {
  printJobId: string;
  status: string | null;
}
