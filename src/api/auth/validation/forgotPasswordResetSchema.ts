import { z } from "zod";

export const forgotPasswordResetSchema = z.object({
  body: z.object({
    email: z.string().email(),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
    otp: z.string().length(6),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  }),
});
