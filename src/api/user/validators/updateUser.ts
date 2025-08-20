import { z } from "zod";

export const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;