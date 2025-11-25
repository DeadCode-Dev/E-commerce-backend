import { Request, Response } from "express";
import PaymentsModel from "@/models/payments.model";
import OrdersModel from "@/models/orders.model";

/**
 * Mark a payment as paid (Cash on Delivery collected)
 */
export default async function markPaymentPaid(
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

    if (existingPayment.is_paid) {
      res.status(400).json({ message: "Payment is already marked as paid" });
      return;
    }

    // Mark payment as paid
    const payment = await PaymentsModel.markAsPaid(paymentId);

    // Update order status to processing when payment is received
    if (existingPayment.order_id) {
      await OrdersModel.updateOrderStatus(
        existingPayment.order_id,
        "processing"
      );
    }

    res.status(200).json({
      message: "Payment marked as paid",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
