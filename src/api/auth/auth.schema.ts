import zod from "zod";

export default class AuthSchema {
  static registerSchema = zod.object({
    username: zod
      .string()
      .min(3, "Username must be at least 3 characters long"),
    email: zod.string().email("Invalid email address"),
    password: zod
      .string()
      .min(8, "Password must be at least 8 characters long"),
    phone: zod.string(),
  });

  static loginSchema = zod.object({
    email: zod.string().email("Invalid email address"),
    password: zod
      .string()
      .min(8, "Password must be at least 8 characters long"),
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
