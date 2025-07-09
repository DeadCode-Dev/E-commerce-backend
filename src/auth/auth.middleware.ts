import { Request, Response, NextFunction } from "express";
import AuthSchema from "./auth.schema";
import { ZodError } from "zod";

export default class AuthMiddleware {
  static async validateRegister(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await AuthSchema.registerSchema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
    }
  }
  static async validateLogin(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthSchema.loginSchema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
    }
  }
}
