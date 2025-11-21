import { z } from "zod";

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(6).max(255),
    newPassword: z.string().min(6).max(255),
  }),
});
