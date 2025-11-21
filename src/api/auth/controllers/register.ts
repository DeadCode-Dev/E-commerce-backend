import { Request, Response } from "express";
import UserModel from "@/models/User.model";
import PasswordUtil from "@/services/hashing.service";
import AuthService from "../../../services/auth.service";
import AuthModel from "../../../models/sessions.model";
import responder from "@/services/responder.service";
import responses from "@/services/responses";

export default async function register(req: Request, res: Response) {
  try {
    const body = req.body;

    const existingUser = await UserModel.findUserByEmail(body.email);
    if (existingUser) {
      responder(res, responses.api.register.userExists);
      return;
    }

    const hashedPassword = await PasswordUtil.hashPassword(body.password);
    if (!hashedPassword) {
      responder(res, responses.Error.internalServerError);
      return;
    }

    const newUser = await UserModel.createUser({
      email: body.email,
      password: hashedPassword,
      username: body.username,
      phone: body.phone,
    });
    const expiresAccessTokenIn = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minutes
    const accessToken = await AuthService.generateToken(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        exp: expiresAccessTokenIn, // 15 minutes
      },
      process.env.JWT_SECRET
    );
    const expiresRefreshTokenIn =
      Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days
    const refreshToken = await AuthService.generateToken(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        exp: expiresRefreshTokenIn, // 30 days
      },
      process.env.JWT_REFRESH_SECRET
    );
    const expiresAt = new Date(expiresRefreshTokenIn * 1000);

    await AuthModel.CreateSession(newUser.id, refreshToken, expiresAt);

    res.cookie("access_token", accessToken, {
      expires: new Date(expiresAccessTokenIn * 1000), // Convert to milliseconds
      httpOnly: true,
      signed: true,
    });

    res.cookie("refresh_token", refreshToken, {
      expires: new Date(expiresRefreshTokenIn * 1000),
      httpOnly: true,
      signed: true,
    });

    responder(res, responses.api.register.success);
  } catch (error) {
    console.error("Registration error:", error);
    responder(res, responses.Error.internalServerError);
  }
}
