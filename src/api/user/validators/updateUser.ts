import { z } from "zod";

export const updateUserSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().max(100).optional(),
    phone: z.string().max(20).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;