import { Response, Request } from "express";
import AuthModel from "../auth.model";
import responder from "@/utils/send.util";
import responses from "@/shared/responses";
import User from "@/types/user/users.entity";
import AuthService from "../auth.service";

export default async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = req.signedCookies.refresh_token;
    if (!refreshToken) {
      responder(res, responses.api.refresh.noToken);
      return;
    }

    const session = await AuthModel.GetSession(refreshToken);
    if (!session) {
      responder(res, responses.api.refresh.invalidToken);
      return;
    }

    if (session.expires_at < new Date()) {
      res.clearCookie("refresh_token");
      res.clearCookie("access_token");
      responder(res, responses.api.refresh.tokenExpired);
      return;
    }

    const user = req.user as User;

    const expiresAccessTokenIn = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minutes
    const accessToken = await AuthService.generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        exp: expiresAccessTokenIn, // 15 minutes
      },
      process.env.JWT_SECRET
    );

    res.cookie("access_token", accessToken, {
      expires: new Date(expiresAccessTokenIn * 1000), // Convert to milliseconds
      httpOnly: true,
      signed: true,
    });

    responder(res, responses.api.refresh.success);
  } catch (error) {
    console.error("Refresh token error:", error);
    responder(res, responses.Error.internalServerError);
  }
}
