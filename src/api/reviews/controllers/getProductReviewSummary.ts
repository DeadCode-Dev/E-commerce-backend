import { Request, Response } from "express";
import ReviewModel from "@/models/reviews.model";

/**
 * Get review summary for a product (average rating, distribution)
 */
export default async function getProductReviewSummary(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const productId = Number(req.params.productId);

    if (isNaN(productId) || productId <= 0) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const summary = await ReviewModel.getProductReviewSummary(productId);

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
