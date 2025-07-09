import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export default class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  static async comparePasswords(raw: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(raw, hashed);
  }

  static async generateToken(
    user: { id: number; email: string; role: string; exp?: number },
    secretKey: string,
  ): Promise<string> {
    return jwt.sign({ ...user }, secretKey);
  }
}
