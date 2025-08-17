import { Request, Response } from "express";
import UserModel from "shared/User.model";
import User from "types/user/users.entity";
import PasswordUtil from "utils/hashing.util";

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

  // static async resetPassword(req: Request, res: Response) {
  //     const userId = (req.user as User).id;
  //     const { newPassword } = req.body;
  //     const user = await UserModel.findUserByEmail((req.user as User).email);
  //     if (!user) {
  //         return res.status(404).json({ message: "User not found" });
  //     }

  //     UserModel.resetPassword(userId, newPassword);

  //     res.status(200).json({ message: "Password reset successfully" });
  // }

  static async changePassword(req: Request, res: Response) {
    const userEmail = (req.user as User).email;
    const { oldPassword, newPassword } = req.body;
    const isMatch = await PasswordUtil.comparePasswords(oldPassword, (req.user as User).password);
    if (!isMatch) {
      return res.status(401).json({ message: "password is incorrect" });
    }
    await UserModel.changePassword(userEmail, newPassword);

    res.status(200).json({ message: "Password changed successfully" });
  }
}
