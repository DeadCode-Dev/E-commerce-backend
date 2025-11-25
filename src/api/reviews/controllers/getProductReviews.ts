import { Request, Response } from "express";
import ReviewModel from "@/models/reviews.model";

/**
 * Get reviews for a specific product (public)
 */
export default async function getProductReviews(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const productId = Number(req.params.productId);

    if (isNaN(productId) || productId <= 0) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const reviews = await ReviewModel.findReviewsByProductId(productId);

    res.status(200).json({
      product_id: productId,
      reviews,
      total: reviews.length,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
