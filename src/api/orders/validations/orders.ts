import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    customer_name: z.string().min(1).max(100),
    email: z.string().email().max(255),
    phone: z.string().min(5).max(30),
    address: z.string().min(1).max(500),
    city: z.string().min(1).max(100),
    postal_code: z.string().min(1).max(20),
    country: z.string().min(1).max(100),
    state: z.string().max(100).optional(),
    items: z
      .array(
        z.object({
          variant_id: z.number().int().positive(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Order ID must be a number"),
  }),
  body: z.object({
    status: z.enum(["pending", "processing", "completed", "cancelled"]),
  }),
});

export const getOrderByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Order ID must be a number"),
  }),
});

export const deleteOrderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Order ID must be a number"),
  }),
});

export const trackOrderSchema = z.object({
  params: z.object({
    tracking_number: z.string().min(1),
  }),
});

export const getOrdersByEmailSchema = z.object({
  query: z.object({
    email: z.string().email(),
  }),
});

export const updateShippingStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Shipping ID must be a number"),
  }),
  body: z
    .object({
      status: z
        .enum(["pending", "shipped", "delivered", "returned"])
        .optional(),
      tracking_number: z.string().min(1).optional(),
    })
    .refine((data) => data.status || data.tracking_number, {
      message: "At least status or tracking_number is required",
    }),
});
