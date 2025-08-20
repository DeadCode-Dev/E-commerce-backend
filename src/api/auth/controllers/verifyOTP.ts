import OTPCache from "@/shared/models/otp.model";
import responses from "@/shared/responses";
import responder from "@/utils/send.util";
import { Request, Response } from "express";

export default async function verifyOTP(req: Request, res: Response) {
  const { email, otp } = req.body;

  const isValid = OTPCache.verifyOTP(email, otp);
  if (!isValid) {
    responder(res, responses.auth.resetPassword.invalidOTP);
    return;
  }

  OTPCache.deleteOTP(email);
  responder(res, responses.auth.resetPassword.validOTP);
}
