import { Request, Response } from "express";
import ReviewModel from "@/models/reviews.model";

/**
 * Create a new review for a product
 * Requires authentication
 */
export default async function createReview(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { product_id, rating, comment } = req.body as {
      product_id: number;
      rating: number;
      comment?: string;
    };

    // Check if user has already reviewed this product
    const hasReviewed = await ReviewModel.hasUserReviewedProduct(
      userId,
      product_id
    );
    if (hasReviewed) {
      res.status(400).json({
        message: "You have already reviewed this product",
      });
      return;
    }

    const review = await ReviewModel.createReview({
      user_id: String(userId),
      product_id,
      rating,
      comment: comment || "",
    });

    res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
