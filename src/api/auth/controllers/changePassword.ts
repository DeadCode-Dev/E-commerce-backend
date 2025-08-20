import { Request, Response } from "express";
import User from "@/types/user/users.entity";
import PasswordUtil from "@/utils/hashing.util";
import UserModel from "@/shared/models/User.model";

export default async function changePassword(req: Request, res: Response) {
  const userEmail = (req.user as User).email;
  const { oldPassword, newPassword } = req.body;
  const isMatch = await PasswordUtil.comparePasswords(
    oldPassword,
    (req.user as User).password
  );
  if (!isMatch) {
    res.status(401).json({ message: "password is incorrect" });
    return;
  }
  await UserModel.changePassword(userEmail, newPassword);

  res.status(200).json({ message: "Password changed successfully" });
}
