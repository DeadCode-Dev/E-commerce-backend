import crypto from "crypto";

export class SessionUtil {
  static generateUniqueToken(): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString("hex");
    return `${timestamp}_${randomBytes}`;
  }

  static generateSessionId(): string {
    return crypto.randomUUID();
  }
}

export default SessionUtil;
