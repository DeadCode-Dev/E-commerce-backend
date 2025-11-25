import { Request, Response } from "express";
import PaymentsModel from "@/models/payments.model";

/**
 * Get payment stats (total, paid, unpaid counts and amounts)
 */
export default async function getPaymentStats(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const stats = await PaymentsModel.getPaymentStats();

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
