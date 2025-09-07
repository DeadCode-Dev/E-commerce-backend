import { z } from "zod";

export const getProductVariants = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Product ID must be a valid number"),
  }),
  query: z.object({
    size: z.string().optional(),
    color: z.string().optional(),
  }),
});
