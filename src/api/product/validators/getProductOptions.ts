import { z } from "zod";

export const getProductOptions = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Product ID must be a valid number"),
  }),
});
