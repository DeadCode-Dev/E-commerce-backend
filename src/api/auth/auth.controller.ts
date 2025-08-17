import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import AuthModel from "./auth.model";
import AuthService from "./auth.service";
import { LoginType, RegisterType } from "./auth.type";
import UserModel from "../../shared/User.model";
import PasswordUtil from "../../utils/hashing.util";
import Mailler from "../../utils/mailler.util";
import OTPCache from "../../shared/otp.model";
import User from "../../types/user/users.entity";

class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      console.log(req.ip, req.headers["user-agent"]);
      const body = req.body as LoginType;

      const user = await UserModel.findUserByEmail(body.email);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const isMatch = await PasswordUtil.comparePasswords(
        body.password,
        user.password,
      );
      if (!isMatch) {
        res.status(401).json({ message: "Invalid credentials" });
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
        process.env.JWT_SECRET,
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
        process.env.JWT_REFRESH_SECRET,
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

      res.status(200).json({
        message: "User Logined successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const body = req.body as RegisterType;

      const existingUser = await UserModel.findUserByEmail(body.email);
      console.log(existingUser);
      if (existingUser) {
        res.status(400).json({ message: "User already exists" });
        return;
      }

      const hashedPassword = await PasswordUtil.hashPassword(body.password);
      if (!hashedPassword) {
        res.status(500).json({ message: "Error hashing password" });
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
        process.env.JWT_SECRET,
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
        process.env.JWT_REFRESH_SECRET,
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

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const token = req.signedCookies.refresh_token;
      if (!token) {
        res.status(400).json({ message: "No session found" });
        return;
      }

      await AuthModel.DeleteSession(token);

      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.signedCookies.refresh_token;
      if (!refreshToken) {
        res.status(401).json({ message: "No refresh token provided" });
        return;
      }

      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!,
      ) as jwt.JwtPayload;
      if (!decoded) {
        res.status(403).json({ message: "Invalid refresh token" });
        return;
      }

      const user = await UserModel.findUserByEmail(decoded.email);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const newAccessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" },
      );

      res.cookie("access_token", newAccessToken, {
        maxAge: 15 * 60 * 1000,
        httpOnly: true,
        signed: true,
      });

      res.status(200).json({ message: "Access token refreshed successfully" });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
  static async resetPassword(req: Request, res: Response) {
    const { email } = req.body;

    const user = await UserModel.findUserByEmail(email);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const otp = OTPCache.generateOTP();
    OTPCache.addOTP(email, otp);
    Mailler.sendOTP(email, otp);

    res.status(200).json({ message: "OTP sent To Email successfully" });
    res.redirect("/auth/reset-password");
  }

  static async changePassword(req: Request, res: Response) {
    const userEmail = (req.user as User).email;
    const { oldPassword, newPassword } = req.body;
    const isMatch = await PasswordUtil.comparePasswords(
      oldPassword,
      (req.user as User).password,
    );
    if (!isMatch) {
      res.status(401).json({ message: "password is incorrect" });
      return;
    }
    await UserModel.changePassword(userEmail, newPassword);

    res.status(200).json({ message: "Password changed successfully" });
  }
}

export default AuthController;
// This code defines an AuthController class that handles user authentication operations such as login, registration, and logout.
