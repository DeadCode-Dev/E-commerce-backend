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
}
