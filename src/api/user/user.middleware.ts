import { NextFunction, Request, Response } from "express";
import User from "types/user/users.entity";
import UserSchema from "./user.schema";
import {
  ChangePasswordType,
  ResetPasswordType,
  UpdateUserType,
} from "./user.type";

export default class UserMiddleware {
  static async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { username, email, phone } = req.body as User;

    const userPayloadValidate = UserSchema.updateUserSchema.safeParse({
      username,
      email,
      phone,
    });
    if (!userPayloadValidate.success) {
      res.status(400).json({
        message: "Validation error",
        errors: userPayloadValidate.error.errors,
      });
      return;
    }
    req.body = userPayloadValidate.data as UpdateUserType;
    next();
  }

  static async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { oldPassword, newPassword } = req.body as ResetPasswordType;

    const resetPasswordValidate = UserSchema.changePasswordSchema.safeParse({
      oldPassword,
      newPassword,
    });
    if (!resetPasswordValidate.success) {
      res.status(400).json({
        message: "Validation error",
        errors: resetPasswordValidate.error.errors,
      });
      return;
    }
    req.body = resetPasswordValidate.data as ResetPasswordType;
    next();
  }

  static async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { email } = req.body as Partial<User>;
    const changePasswordValidate = UserSchema.resetPasswordSchema.safeParse({
      email,
    });
    if (!changePasswordValidate.success) {
      res.status(400).json({
        message: "Validation error",
        errors: changePasswordValidate.error.errors,
      });
      return;
    }
    req.body = changePasswordValidate.data as ChangePasswordType;
    next();
  }
}
