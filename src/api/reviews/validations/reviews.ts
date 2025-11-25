import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    product_id: z.number().int().positive(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
  }),
});

export const updateReviewSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Review ID must be a number"),
  }),
  body: z
    .object({
      rating: z.number().int().min(1).max(5).optional(),
      comment: z.string().max(2000).optional(),
    })
    .refine((data) => data.rating !== undefined || data.comment !== undefined, {
      message: "At least rating or comment is required",
    }),
});

export const reviewIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Review ID must be a number"),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    productId: z.string().regex(/^\d+$/, "Product ID must be a number"),
  }),
});
