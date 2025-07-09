import { Request, Response } from "express";
import User from "modules/user/users.entity";
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB_USER: string;
      DB_HOST: string;
      DB_NAME: string;
      DB_PASSWORD: string;
      DB_PORT: string;
      CORS_ORIGIN: string;
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      PORT: string;
      Cookie_SECRET: string;
    }
  }
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

interface JwtPayload {
  id: number; // same as userId
  email: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
}
