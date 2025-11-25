import { Request, Response } from "express";
import ReviewModel from "@/models/reviews.model";

/**
 * Delete a review (by owner or admin)
 */
export default async function deleteReview(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

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

    // Check ownership or admin
    const isOwner = Number(existingReview.user_id) === userId;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        message: "You can only delete your own reviews",
      });
      return;
    }

    await ReviewModel.deleteReview(reviewId);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
