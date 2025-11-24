import OrdersModel from "@/models/orders.model";
import { Request, Response } from "express";

export default async function getOrders(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    const orders = await OrdersModel.getAllOrders(limit, offset);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
