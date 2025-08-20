import { Request, Response } from "express";
import User from "@/types/user/users.entity";
import UserModel from "@/shared/models/User.model";

export default async function deleteUser(req: Request, res: Response) {
  const userId = (req.user as User).id;

  UserModel.deleteUser(userId);

  res.status(200).json({ message: "User deleted successfully" });
}
