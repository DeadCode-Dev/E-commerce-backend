import { Cache } from "@/services/cache.service";
/**
 * OTPCache is a utility class for managing One-Time Passwords (OTPs) in memory.
 * It allows generating, storing, retrieving, and verifying OTPs with an optional time-to-live (TTL).
 */
class OTPCache {
  private cache: Cache<string>;

  constructor() {
    this.cache = new Cache<string>();
  }

  generateOTP(): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
  }

  addOTP(userEmail: string, otp: string, ttl: number = 5 * 60 * 1000) {
    this.cache.set(userEmail, otp, ttl);
  }

  getOTP(userEmail: string): string | undefined {
    return this.cache.get(userEmail);
  }

  verifyOTP(userEmail: string, otp: string): boolean {
    const cachedOTP = this.cache.get(userEmail);
    return cachedOTP === otp;
  }

  deleteOTP(userEmail: string) {
    this.cache.delete(userEmail);
  }
}

export default new OTPCache();
