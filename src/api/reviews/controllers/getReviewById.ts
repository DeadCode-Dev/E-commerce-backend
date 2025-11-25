import { Request, Response } from "express";
import ReviewModel from "@/models/reviews.model";

/**
 * Get a single review by ID
 */
export default async function getReviewById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const reviewId = Number(req.params.id);

    if (isNaN(reviewId) || reviewId <= 0) {
      res.status(400).json({ message: "Invalid review ID" });
      return;
    }

    const review = await ReviewModel.findReviewById(reviewId);

    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
