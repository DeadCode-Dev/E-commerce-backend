import User from "@/types/user/users.entity";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
