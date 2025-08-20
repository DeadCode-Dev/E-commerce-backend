import UserModel from "@/shared/models/User.model";
import PasswordUtil from "@/utils/hashing.util";
import { Request, Response } from "express";
import AuthService from "../auth.service";
import AuthModel from "../auth.model";
import responses from "@/shared/responses";
import responder from "@/utils/send.util";
async function Login(req: Request, res: Response) {
  try {
    const body = req.body;

    const user = await UserModel.findUserByEmail(body.email);
    if (!user) {
      responder(res, responses.api.login.userNotFound);
      return;
    }
    const isMatch = await PasswordUtil.comparePasswords(
      body.password,
      user.password
    );
    if (!isMatch) {
      responder(res, responses.api.login.wrongPassword);
      return;
    }
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
    const expiresRefreshTokenIn =
      Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days
    const refreshToken = await AuthService.generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        exp: expiresRefreshTokenIn, // 30 days
      },
      process.env.JWT_REFRESH_SECRET
    );
    const expiresAt = new Date(expiresRefreshTokenIn * 1000);

    await AuthModel.CreateSession(user.id, refreshToken, expiresAt);

    res.cookie("access_token", accessToken, {
      expires: new Date(expiresAccessTokenIn * 1000), // Convert to milliseconds
      httpOnly: true,
      signed: true,
    });

    res.cookie("refresh_token", refreshToken, {
      expires: expiresAt,
      httpOnly: true,
      signed: true,
    });

    responder(res, responses.api.login.success);
  } catch (error) {
    console.error("Login error:", error);
    responder(res, responses.Error.internalServerError);
  }
}

export default Login;
