import { Request, Response, NextFunction } from "express";
import AuthSchema from "./auth.schema";
import User from "types/user/users.entity";
import {
  RegisterType,
  ChangePasswordType,
  ResetPasswordType,
} from "./auth.type";

export default class AuthMiddleware {
  static async validateRegister(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const { username, email, password, phone } = req.body as User;
    const registerPayloadSchema = AuthSchema.registerSchema.safeParse({
      username,
      email,
      password,
      phone,
    });
    if (!registerPayloadSchema.success) {
      res.status(400).json({
        message: "Validation error",
        errors: registerPayloadSchema.error.errors,
      });
      return;
    }
    req.user = registerPayloadSchema.data as RegisterType;
    next();
  }
  static async validateLogin(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body as User;
    const loginPayloadSchema = AuthSchema.loginSchema.safeParse({
      email,
      password,
    });
    if (!loginPayloadSchema.success) {
      res.status(400).json({
        message: "Validation error",
        errors: loginPayloadSchema.error.errors,
      });
      return;
    }
    req.user = loginPayloadSchema.data as User;
    next();
  }
  static async changePassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { oldPassword, newPassword } = req.body as ResetPasswordType;

    const resetPasswordValidate = AuthSchema.changePasswordSchema.safeParse({
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
    next: NextFunction,
  ): Promise<void> {
    const { email } = req.body as Partial<User>;
    const changePasswordValidate = AuthSchema.resetPasswordSchema.safeParse({
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
