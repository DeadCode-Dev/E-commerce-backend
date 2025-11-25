import { Request, Response } from "express";
import PaymentsModel from "@/models/payments.model";

/**
 * Get all payments with filtering by paid/unpaid status
 */
export default async function getPayments(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const isPaid = req.query.is_paid as string | undefined;

    // Filter by paid status if provided
    if (isPaid === "true") {
      const payments = await PaymentsModel.getPaidPayments(limit, offset);
      res.status(200).json(payments);
      return;
    }

    if (isPaid === "false") {
      const payments = await PaymentsModel.getUnpaidPayments(limit, offset);
      res.status(200).json(payments);
      return;
    }

    // Get all payments with pagination
    const payments = await PaymentsModel.getAllPayments(limit, offset);
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
