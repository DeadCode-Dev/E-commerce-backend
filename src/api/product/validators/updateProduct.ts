import { z } from "zod";

const variantSchema = z.object({
  id: z.number().optional(), // Optional for new variants
  size: z.string().min(1).max(100).optional(),
  color: z.string().min(1).max(100).optional(),
  stock: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
});

export const updateProduct = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Product ID must be a valid number"),
  }),
  body: z
    .object({
      // Simple update fields (backward compatibility)
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(1000).optional(),

      // Merge-based update structure
      product: z
        .object({
          name: z.string().min(1).max(100).optional(),
          description: z.string().max(1000).optional(),
        })
        .optional(),

      variants: z.array(variantSchema).optional(),

      categories: z.array(z.string().min(1).max(100)).optional(),

      last_updated: z.string().optional(), // For conflict detection
    })
    .refine(
      (data) => {
        // At least one field should be provided and not empty
        return (
          (typeof data.name === "string" && data.name.trim().length > 0) ||
          (typeof data.description === "string" && data.description.trim().length > 0) ||
          (data.product &&
            ((typeof data.product.name === "string" && data.product.name.trim().length > 0) ||
             (typeof data.product.description === "string" && data.product.description.trim().length > 0))) ||
          (Array.isArray(data.variants) && data.variants.length > 0) ||
          (Array.isArray(data.categories) && data.categories.length > 0)
        );
      },
      {
        message: "At least one field must be provided for update",
      }
    ),
});
