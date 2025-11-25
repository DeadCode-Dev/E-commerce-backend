import { Request, Response } from "express";
import PaymentsModel from "@/models/payments.model";

/**
 * Mark a payment as unpaid (refund/cancel)
 */
export default async function markPaymentUnpaid(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const paymentId = Number(req.params.id);

    if (isNaN(paymentId) || paymentId <= 0) {
      res.status(400).json({ message: "Invalid payment ID" });
      return;
    }

    // Get payment to check current status
    const existingPayment = await PaymentsModel.findPaymentById(paymentId);
    if (!existingPayment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    if (!existingPayment.is_paid) {
      res.status(400).json({ message: "Payment is already unpaid" });
      return;
    }

    // Mark payment as unpaid
    const payment = await PaymentsModel.markAsUnpaid(paymentId);

    res.status(200).json({
      message: "Payment marked as unpaid",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
