import { z } from "zod";
import UserSchema from "./user.schema";

export type UpdateUserType = z.infer<typeof UserSchema.updateUserSchema>;
export type ResetPasswordType = z.infer<typeof UserSchema.changePasswordSchema>;
export type ChangePasswordType = z.infer<typeof UserSchema.resetPasswordSchema>;
