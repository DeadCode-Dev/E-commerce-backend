import { Request, Response } from "express";
import ReviewModel from "@/models/reviews.model";

/**
 * Get recent reviews (public - for homepage)
 */
export default async function getRecentReviews(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const reviews = await ReviewModel.getRecentReviews(limit);

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
