import { Request, Response } from "express";
import User from "@/types/user/users.entity";
import PasswordUtil from "@/services/hashing.service";
import UserModel from "@/models/User.model";
import responder from "@/services/responder.service";
import responses from "@/services/responses";

export default async function changePassword(req: Request, res: Response) {
  const userEmail = (req.user as User).email;
  const { oldPassword, newPassword } = req.body;
  const isMatch = await PasswordUtil.comparePasswords(
    oldPassword,
    (req.user as User).password,
  );
  if (!isMatch) {
    responder(res, responses.api.resetPassword.passwordsDoNotMatch);
    return;
  }
  await UserModel.changePassword(userEmail, newPassword);

  responder(res, responses.api.resetPassword.resetPasswordSuccessfully);
}
