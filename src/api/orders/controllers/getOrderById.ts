import { Request, Response } from "express";
import OrdersModel from "@/models/orders.model";

export default async function getOrderById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const orderId = Number(req.params.id);

    if (isNaN(orderId) || orderId <= 0) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const order = await OrdersModel.getOrderWithDetails(orderId);

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
