import { Request, Response } from "express";
import OrdersModel from "@/models/orders.model";

export default async function deleteOrder(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const orderId = Number(req.params.id);

    if (isNaN(orderId) || orderId <= 0) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const deleted = await OrdersModel.deleteOrder(orderId);

    if (!deleted) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
