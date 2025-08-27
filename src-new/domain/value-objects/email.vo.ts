import { ValidationException } from "../../shared/exceptions";

export class Email {
  private readonly value: string;

  constructor(email: string) {
    this.validate(email);
    this.value = email.toLowerCase().trim();
  }

  private validate(email: string): void {
    if (!email) {
      throw new ValidationException("Email is required", [
        { field: "email", message: "Email is required", code: "REQUIRED" },
      ]);
    }

    if (email.length < 5 || email.length > 255) {
      throw new ValidationException("Email length is invalid", [
        {
          field: "email",
          message: "Email must be between 5 and 255 characters",
          code: "INVALID_LENGTH",
        },
      ]);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationException("Email format is invalid", [
        {
          field: "email",
          message: "Please provide a valid email address",
          code: "INVALID_FORMAT",
        },
      ]);
    }
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split("@")[1];
  }

  getLocalPart(): string {
    return this.value.split("@")[0];
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  // For JSON serialization
  toJSON(): string {
    return this.value;
  }

  // Static factory method
  static create(email: string): Email {
    return new Email(email);
  }

  // Validation without creating instance
  static isValid(email: string): boolean {
    try {
      new Email(email);
      return true;
    } catch {
      return false;
    }
  }
}
