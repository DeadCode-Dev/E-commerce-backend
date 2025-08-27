import OTPCache from "@/services/otp.service";
import responses from "@/services/responses";
import responder from "@/services/responder.service";
import { Request, Response } from "express";

export default async function verifyOTP(req: Request, res: Response) {
  const { email, otp } = req.body;

  const isValid = OTPCache.verifyOTP(email, otp);
  if (!isValid) {
    responder(res, responses.api.resetPassword.invalidOTP);
    return;
  }

  OTPCache.deleteOTP(email);
  responder(res, responses.api.resetPassword.validOTP);
}
