import zod from "zod";

export default class UserSchema {
  static updateUserSchema = zod.object({
    username: zod
      .string()
      .min(3, "Username must be at least 3 characters long")
      .optional(),
    email: zod.string().email("Invalid email address").optional(),
    phone: zod.string().optional(),
  });

  static changePasswordSchema = zod.object({
    oldPassword: zod
      .string()
      .min(8, "Old password must be at least 8 characters long"),
    newPassword: zod
      .string()
      .min(8, "New password must be at least 8 characters long"),
  });

  static resetPasswordSchema = zod.object({
    email: zod.string().email("Invalid email address"),
  });
}
