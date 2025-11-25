import { Request, Response } from "express";
import PaymentsModel from "@/models/payments.model";

/**
 * Get payment by order ID
 */
export default async function getPaymentByOrderId(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const orderId = Number(req.params.orderId);

    if (isNaN(orderId) || orderId <= 0) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const payment = await PaymentsModel.findPaymentByOrderId(orderId);

    if (!payment) {
      res.status(404).json({ message: "Payment not found for this order" });
      return;
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
