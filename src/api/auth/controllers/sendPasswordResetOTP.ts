import UserModel from "@/models/User.model";
import OTPCache from "@/shared/models/otp.model";
import responses from "@/shared/responses";
import Mailler from "@/utils/mailler.util";
import responder from "@/utils/send.util";
import { Request, Response } from "express";

export default async function sendPasswordResetOTP(
  req: Request,
  res: Response
) {
  const { email } = req.body;

  const user = await UserModel.findUserByEmail(email);
  if (!user) {
    responder(res, responses.api.resetPassword.userNotFound);
    return;
  }

  const otp = OTPCache.generateOTP();
  OTPCache.addOTP(email, otp);
  Mailler.sendOTP(email, otp);

  responder(res, responses.api.resetPassword.resetPasswordSuccessfully);
}
