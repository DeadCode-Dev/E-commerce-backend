import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email().max(100),
    password: z.string().min(6).max(255),
    username: z.string().min(3).max(50),
    phone: z.string().max(20),
  }),
});
