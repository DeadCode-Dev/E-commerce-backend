import { Router } from "express";
import { isAuthenticated } from "@/middlewares/auth";
import validate from "@/middlewares/validate";

// Controllers
import createReview from "./controllers/createReview";
import getProductReviews from "./controllers/getProductReviews";
import getProductReviewSummary from "./controllers/getProductReviewSummary";
import getUserReviews from "./controllers/getUserReviews";
import getReviewById from "./controllers/getReviewById";
import updateReview from "./controllers/updateReview";
import deleteReview from "./controllers/deleteReview";
import getRecentReviews from "./controllers/getRecentReviews";

// Validations
import {
  createReviewSchema,
  updateReviewSchema,
  reviewIdSchema,
  productIdSchema,
} from "./validations/reviews";

const router = Router();

// ==================== Public Routes ====================

// Get recent reviews (for homepage)
router.get("/recent", getRecentReviews);

// Get reviews for a product
router.get("/product/:productId", validate(productIdSchema), getProductReviews);

// Get review summary for a product (average, distribution)
router.get(
  "/product/:productId/summary",
  validate(productIdSchema),
  getProductReviewSummary
);

// Get single review by ID
router.get("/:id", validate(reviewIdSchema), getReviewById);

// ==================== Protected Routes ====================

// Create a review (authenticated users only)
router.post("/", isAuthenticated, validate(createReviewSchema), createReview);

// Get user's own reviews
router.get("/user/me", isAuthenticated, getUserReviews);

// Update own review
router.patch(
  "/:id",
  isAuthenticated,
  validate(updateReviewSchema),
  updateReview
);

// Delete own review (or admin can delete any)
router.delete("/:id", isAuthenticated, validate(reviewIdSchema), deleteReview);

// Search reviews (admin)

export default router;
