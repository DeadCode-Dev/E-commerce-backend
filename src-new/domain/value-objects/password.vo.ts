import { ValidationException } from "../../shared/exceptions";
import bcrypt from "bcrypt";

export class Password {
  private readonly value: string;
  private readonly isHashed: boolean;

  private constructor(password: string, isHashed = false) {
    if (!isHashed) {
      this.validate(password);
    }
    this.value = password;
    this.isHashed = isHashed;
  }

  private validate(password: string): void {
    if (!password) {
      throw new ValidationException("Password is required", [
        {
          field: "password",
          message: "Password is required",
          code: "REQUIRED",
        },
      ]);
    }

    if (password.length < 8 || password.length > 128) {
      throw new ValidationException("Password length is invalid", [
        {
          field: "password",
          message: "Password must be between 8 and 128 characters",
          code: "INVALID_LENGTH",
        },
      ]);
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new ValidationException("Password must contain lowercase letter", [
        {
          field: "password",
          message: "Password must contain at least one lowercase letter",
          code: "MISSING_LOWERCASE",
        },
      ]);
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new ValidationException("Password must contain uppercase letter", [
        {
          field: "password",
          message: "Password must contain at least one uppercase letter",
          code: "MISSING_UPPERCASE",
        },
      ]);
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      throw new ValidationException("Password must contain number", [
        {
          field: "password",
          message: "Password must contain at least one number",
          code: "MISSING_NUMBER",
        },
      ]);
    }
  }

  getValue(): string {
    return this.value;
  }

  getIsHashed(): boolean {
    return this.isHashed;
  }

  async hash(): Promise<Password> {
    if (this.isHashed) {
      return this;
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(this.value, saltRounds);
    return new Password(hashedPassword, true);
  }

  async compare(plainPassword: string): Promise<boolean> {
    if (!this.isHashed) {
      throw new Error("Cannot compare with unhashed password");
    }

    return bcrypt.compare(plainPassword, this.value);
  }

  // For persistence - returns the hashed value
  toString(): string {
    if (!this.isHashed) {
      throw new Error("Cannot convert unhashed password to string");
    }
    return this.value;
  }

  // Static factory methods
  static create(password: string): Password {
    return new Password(password, false);
  }

  static fromHash(hashedPassword: string): Password {
    return new Password(hashedPassword, true);
  }

  // Validation without creating instance
  static isValid(password: string): boolean {
    try {
      new Password(password);
      return true;
    } catch {
      return false;
    }
  }

  // Generate a random password
  static generateRandom(length = 12): Password {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";

    // Ensure at least one character from each required category
    password += "a"; // lowercase
    password += "A"; // uppercase
    password += "1"; // number

    // Fill the rest randomly
    for (let i = 3; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Shuffle the password
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    return new Password(password, false);
  }
}
