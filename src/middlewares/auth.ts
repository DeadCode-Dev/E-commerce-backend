import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "shared/types";
import UserModel from "../shared/User.model";
import User from "types/user/users.entity";

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.signedCookies.refresh_token;
  if (!token) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const secret = process.env.JWT_REFRESH_SECRET;
  jwt.verify(
    token,
    secret,
    (err: jwt.VerifyErrors | null, decoded: object | string | undefined) => {
      if (err) {
        res.status(500).json({ message: "Internal server error" });
        return;
      }
      const payload = decoded as JwtPayload;
      if (!payload || !payload.email) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      // You can attach the user info to req.user here if needed
      UserModel.findUserByEmail(payload.email)
        .then((user: User | null) => {
          if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
          }
          req.user = user;
          next();
        })
        .catch((error) => {
          console.error("Error finding user:", error);
          res.status(500).json({ message: "Internal server error" });
        });
    }
  );
};

export const Role = (Role: User["role"]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user && req.user.role === Role) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden" });
    }
  };
};
