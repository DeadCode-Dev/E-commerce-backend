import UserModel from "@/shared/models/User.model";
import responses from "@/shared/responses";
import responder from "@/utils/send.util";
import { Request, Response } from "express";
import otpModel from "@/shared/models/otp.model";

export default async function resetPassword(req: Request, res: Response) {
  const { email, newPassword, confirmPassword, otp } = req.body;
  const isValidOTP = otpModel.verifyOTP(email, otp);

  if (!isValidOTP) {
    responder(res, responses.api.resetPassword.invalidOTP);
    return;
  }
  // Check if passwords match
  if (newPassword !== confirmPassword) {
    responder(res, responses.api.resetPassword.passwordsDoNotMatch);
    return;
  }

  // Update password
  const user = await UserModel.changePassword(email, newPassword);
  if (!user) {
    responder(res, responses.api.resetPassword.userNotFound);
    return;
  }

  responder(res, responses.api.resetPassword.resetPasswordSuccessfully);
}
