import { Request, Response } from "express";
import UserModel from "@/shared/User.model";
import User from "@/types/user/users.entity";
export default class UserController {
  // Add methods for user-related operations here
  // For example:
  static async getUser(req: Request, res: Response) {
    const { username, email, phone, id, created_at, updated_at, role } =
      req.user as User;

    res.status(200).json({
      username,
      email,
      phone,
      id,
      created_at,
      updated_at,
      role,
    });
  }

  static async updateUser(req: Request, res: Response) {
    const { email, phone, username } = req.body;
    const userId = (req.user as User).id;

    UserModel.updateUser(userId, {
      email,
      phone,
      username,
    });

    res.status(200).json({ message: "User updated successfully" });
  }

  static async deleteUser(req: Request, res: Response) {
    const userId = (req.user as User).id;

    UserModel.deleteUser(userId);

    res.status(200).json({ message: "User deleted successfully" });
  }
}
