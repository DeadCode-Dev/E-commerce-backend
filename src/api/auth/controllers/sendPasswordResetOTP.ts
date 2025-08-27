import UserModel from "@/models/User.model";
import OTPCache from "@/services/otp.service";
import responses from "@/services/responses";
import Mailler from "@/services/mailler.service";
import responder from "@/services/responder.service";
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
