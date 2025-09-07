import { z } from "zod";

export const getProductById = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Product ID must be a valid number"),
  }),
});
