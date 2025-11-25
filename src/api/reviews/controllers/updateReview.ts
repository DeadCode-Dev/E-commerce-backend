import { Request, Response } from "express";
import ReviewModel from "@/models/reviews.model";

/**
 * Update a review (only by the review owner)
 */
export default async function updateReview(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const reviewId = Number(req.params.id);
    if (isNaN(reviewId) || reviewId <= 0) {
      res.status(400).json({ message: "Invalid review ID" });
      return;
    }

    // Get existing review
    const existingReview = await ReviewModel.findReviewById(reviewId);
    if (!existingReview) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    // Check ownership
    if (Number(existingReview.user_id) !== userId) {
      res.status(403).json({ message: "You can only update your own reviews" });
      return;
    }

    const { rating, comment } = req.body as {
      rating?: number;
      comment?: string;
    };

    const updateData: { rating?: number; comment?: string } = {};
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: "Nothing to update" });
      return;
    }

    const review = await ReviewModel.updateReview(reviewId, updateData);

    res.status(200).json({
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
