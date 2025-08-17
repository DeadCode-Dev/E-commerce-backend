import { z } from "zod";
import AuthSchema from "./auth.schema";

export type RegisterType = z.infer<typeof AuthSchema.registerSchema>;
export type LoginType = z.infer<typeof AuthSchema.loginSchema>;
export type ResetPasswordType = z.infer<typeof AuthSchema.changePasswordSchema>;
export type ChangePasswordType = z.infer<typeof AuthSchema.resetPasswordSchema>;
