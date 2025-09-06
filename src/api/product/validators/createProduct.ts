import { z } from "zod";

export const createProduct = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
  }),
});

export const createProductVariants = z.object({
  body: z.object({
    product_id: z.number().min(1),
    variants: z.array(
      z.object({
        size: z.string().min(1).max(100),
        color: z.string().min(1).max(100),
        hex: z.string().min(4).max(7),
        stock: z.number().min(0).optional(),
        price: z.number().min(0),
      })
    ),
  }),
});
