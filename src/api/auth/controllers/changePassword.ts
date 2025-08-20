import { Request, Response } from "express";
import User from "@/types/user/users.entity";
import PasswordUtil from "@/utils/hashing.util";
import UserModel from "@/shared/models/User.model";
import responder from "@/utils/send.util";
import responses from "@/shared/responses";

export default async function changePassword(req: Request, res: Response) {
  const userEmail = (req.user as User).email;
  const { oldPassword, newPassword } = req.body;
  const isMatch = await PasswordUtil.comparePasswords(
    oldPassword,
    (req.user as User).password
  );
  if (!isMatch) {
    responder(res, responses.api.resetPassword.passwordsDoNotMatch);
    return;
  }
  await UserModel.changePassword(userEmail, newPassword);

  responder(res, responses.api.resetPassword.resetPasswordSuccessfully);
}
