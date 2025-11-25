import { Request, Response } from "express";
import ReviewModel from "@/models/reviews.model";

/**
 * Get all reviews by the authenticated user
 */
export default async function getUserReviews(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const reviews = await ReviewModel.findReviewsByUserId(userId);

    res.status(200).json({
      reviews,
      total: reviews.length,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
