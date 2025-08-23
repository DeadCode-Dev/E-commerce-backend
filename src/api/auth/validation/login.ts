import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().max(100),
    password: z.string().min(6).max(255),
  }),
});
