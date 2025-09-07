import { z } from "zod";

export const searchProducts = z.object({
  query: z.object({
    name: z.string().optional(),
    category: z.string().optional(),
    minPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "Min price must be a valid number")
      .optional(),
    maxPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "Max price must be a valid number")
      .optional(),
    size: z.string().optional(),
    color: z.string().optional(),
    inStock: z.string().optional(),
    sortBy: z.enum(["name", "price", "created_at", "popularity"]).optional(),
    sortOrder: z.enum(["ASC", "DESC"]).optional(),
    limit: z.string().regex(/^\d+$/, "Limit must be a valid number").optional(),
    offset: z
      .string()
      .regex(/^\d+$/, "Offset must be a valid number")
      .optional(),
  }),
});
