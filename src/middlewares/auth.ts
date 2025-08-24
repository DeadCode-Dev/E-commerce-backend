import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "@/shared/models/types";
import UserModel from "../models/User.model";
import User from "types/user/users.entity";

/**
 * Middleware to check if the user is authenticated via access token
 */
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.signedCookies.refresh_token;
    if (!token) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const secret = process.env.JWT_ACCESS_SECRET as string;

    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded || !decoded.email) {
      res.status(401).json({ message: "Invalid token payload" });
      return;
    }

    UserModel.findUserByEmail(decoded.email)
      .then((user: User | null) => {
        if (!user) {
          res.status(404).json({ message: "User not found" });
          return;
        }
        req.user = user; // attach user to request
        next();
      })
      .catch((error) => {
        console.error("Error finding user:", error);
        res.status(500).json({ message: "Internal server error" });
      });
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Role-based access control middleware
 */
export const Role =
  (role: User["role"]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden" });
    }
  };
