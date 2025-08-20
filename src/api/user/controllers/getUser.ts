import User from "@/types/user/users.entity";
import { Request, Response } from "express";
export default async function getUser(req: Request, res: Response) {
  const { username, email, phone, id, created_at, updated_at, role } =
    req.user as User;

  res.status(200).json({
    username,
    email,
    phone,
    id,
    created_at,
    updated_at,
    role,
  });
}
