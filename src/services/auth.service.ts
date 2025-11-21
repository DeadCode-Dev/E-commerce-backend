import jwt from "jsonwebtoken";

export default class AuthService {
  static async generateToken(
    user: { id: number; email: string; role: string; exp?: number },
    secretKey: string,
  ): Promise<string> {
    return jwt.sign({ ...user }, secretKey);
  }
}
