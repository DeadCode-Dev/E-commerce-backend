import { Response, Request } from "express";
import AuthModel from "../../../models/sessions.model";
import responder from "@/services/responder.service";
import responses from "@/services/responses";

export default async function logout(req: Request, res: Response) {
  try {
    const token = req.signedCookies.refresh_token;
    if (!token) {
      responder(res, responses.api.logout.noSession);
      return;
    }

    await AuthModel.DeleteSession(token);

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    responder(res, responses.api.logout.success);
  } catch (error) {
    console.error("Logout error:", error);
    responder(res, responses.Error.internalServerError);
  }
}
