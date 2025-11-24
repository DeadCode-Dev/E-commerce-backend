import { Request, Response } from "express";
import OrdersModel from "@/models/orders.model";

const VALID_STATUSES = ["pending", "processing", "completed", "cancelled"];

export default async function updateOrderStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body as { status: string };

    if (isNaN(orderId) || orderId <= 0) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
      return;
    }

    const order = await OrdersModel.updateOrderStatus(orderId, status);

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
