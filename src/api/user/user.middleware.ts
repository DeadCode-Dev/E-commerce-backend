import { NextFunction, Request, Response } from "express";
import User from "types/user/users.entity";
import UserSchema from "./user.schema";
import { UpdateUserType } from "./user.type";

export default class UserMiddleware {
  static async updateUser(
    req: Request,
    res: Response,
    next: NextFunction,
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
}
