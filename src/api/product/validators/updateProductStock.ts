import { z } from "zod";

export const updateProductStock = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Product ID must be a valid number"),
  }),
  body: z.object({
    variant_id: z.number().min(1, "Variant ID must be a positive number"),
    stock: z.number().min(0, "Stock must be non-negative"),
  }),
});
