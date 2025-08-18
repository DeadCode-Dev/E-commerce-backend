import { describe, it, expect } from "@jest/globals";
import PasswordUtil from "utils/hashing.util";

describe("PasswordUtil", () => {
  describe("hashPassword", () => {
    it("should hash password successfully", async () => {
      const password = "testpassword123";
      const hashedPassword = await PasswordUtil.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(typeof hashedPassword).toBe("string");
      expect(hashedPassword.length).toBeGreaterThan(password.length);
    });

    it("should generate different hashes for same password", async () => {
      const password = "testpassword123";
      const hash1 = await PasswordUtil.hashPassword(password);
      const hash2 = await PasswordUtil.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("comparePasswords", () => {
    it("should return true for matching passwords", async () => {
      const password = "testpassword123";
      const hashedPassword = await PasswordUtil.hashPassword(password);

      const isMatch = await PasswordUtil.comparePasswords(
        password,
        hashedPassword,
      );
      expect(isMatch).toBe(true);
    });

    it("should return false for non-matching passwords", async () => {
      const password = "testpassword123";
      const wrongPassword = "wrongpassword";
      const hashedPassword = await PasswordUtil.hashPassword(password);

      const isMatch = await PasswordUtil.comparePasswords(
        wrongPassword,
        hashedPassword,
      );
      expect(isMatch).toBe(false);
    });

    it("should handle empty passwords", async () => {
      const hashedPassword = await PasswordUtil.hashPassword("test");

      const isMatch = await PasswordUtil.comparePasswords("", hashedPassword);
      expect(isMatch).toBe(false);
    });
  });
});
