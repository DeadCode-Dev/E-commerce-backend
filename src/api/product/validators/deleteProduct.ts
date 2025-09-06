import { z } from "zod";

export const deleteProduct = z.object({
  body: z.object({
    product_id: z.number().min(1),
  }),
});