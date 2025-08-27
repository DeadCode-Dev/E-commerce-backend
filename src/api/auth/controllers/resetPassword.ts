import UserModel from "@/models/User.model";
import responses from "@/services/responses";
import responder from "@/services/responder.service";
import { Request, Response } from "express";
import otpModel from "@/services/otp.service";

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
