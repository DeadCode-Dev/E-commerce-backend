import { Request, Response, NextFunction } from "express";
import AuthSchema from "./auth.schema";
import User from "types/user/users.entity";
import { RegisterType } from "./auth.type";

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
}
