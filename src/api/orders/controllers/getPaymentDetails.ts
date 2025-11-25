import { Request, Response } from "express";
import PaymentsModel from "@/models/payments.model";

/**
 * Get payment details with order and customer info
 */
export default async function getPaymentDetails(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const paymentId = Number(req.params.id);

    if (isNaN(paymentId) || paymentId <= 0) {
      res.status(400).json({ message: "Invalid payment ID" });
      return;
    }

    const paymentDetails =
      await PaymentsModel.getPaymentWithOrderDetails(paymentId);

    if (!paymentDetails) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    res.status(200).json(paymentDetails);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
