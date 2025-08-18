import { describe, it, expect, beforeEach } from "@jest/globals";
import OTPCache from "shared/otp.model";

describe("OTPCache", () => {
  const testEmail = "test@example.com";

  beforeEach(() => {
    // Clear cache before each test
    OTPCache.deleteOTP(testEmail);
  });

  describe("generateOTP", () => {
    it("should generate 6-digit OTP", () => {
      const otp = OTPCache.generateOTP();

      expect(otp).toMatch(/^\d{6}$/);
      expect(otp.length).toBe(6);
    });

    it("should generate different OTPs", () => {
      const otp1 = OTPCache.generateOTP();
      const otp2 = OTPCache.generateOTP();

      // While there's a small chance they could be the same, it's highly unlikely
      expect(otp1).not.toBe(otp2);
    });
  });

  describe("addOTP and getOTP", () => {
    it("should store and retrieve OTP", () => {
      const otp = "123456";

      OTPCache.addOTP(testEmail, otp);
      const retrievedOTP = OTPCache.getOTP(testEmail);

      expect(retrievedOTP).toBe(otp);
    });

    it("should return undefined for non-existent email", () => {
      const retrievedOTP = OTPCache.getOTP("nonexistent@example.com");
      expect(retrievedOTP).toBeUndefined();
    });

    it("should overwrite existing OTP", () => {
      const otp1 = "123456";
      const otp2 = "654321";

      OTPCache.addOTP(testEmail, otp1);
      OTPCache.addOTP(testEmail, otp2);

      const retrievedOTP = OTPCache.getOTP(testEmail);
      expect(retrievedOTP).toBe(otp2);
    });
  });

  describe("verifyOTP", () => {
    it("should verify correct OTP", () => {
      const otp = "123456";

      OTPCache.addOTP(testEmail, otp);
      const isValid = OTPCache.verifyOTP(testEmail, otp);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect OTP", () => {
      const otp = "123456";
      const wrongOTP = "654321";

      OTPCache.addOTP(testEmail, otp);
      const isValid = OTPCache.verifyOTP(testEmail, wrongOTP);

      expect(isValid).toBe(false);
    });

    it("should reject OTP for non-existent email", () => {
      const isValid = OTPCache.verifyOTP("nonexistent@example.com", "123456");
      expect(isValid).toBe(false);
    });
  });

  describe("deleteOTP", () => {
    it("should delete OTP", () => {
      const otp = "123456";

      OTPCache.addOTP(testEmail, otp);
      OTPCache.deleteOTP(testEmail);

      const retrievedOTP = OTPCache.getOTP(testEmail);
      expect(retrievedOTP).toBeUndefined();
    });

    it("should handle deleting non-existent OTP", () => {
      expect(() => {
        OTPCache.deleteOTP("nonexistent@example.com");
      }).not.toThrow();
    });
  });
});
