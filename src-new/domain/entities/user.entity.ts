import { EntityId, UserRole } from "../../shared/types/api.types";
import { Email } from "../value-objects/email.vo";
import { Password } from "../value-objects/password.vo";

export interface UserProps {
  id: EntityId;
  email: Email;
  password: Password;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(
    props: Omit<UserProps, "id" | "createdAt" | "updatedAt">
  ): User {
    const now = new Date();
    return new User({
      ...props,
      id: 0, // Will be set by repository
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  // Getters
  get id(): EntityId {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get password(): Password {
    return this.props.password;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }

  get emailVerificationToken(): string | undefined {
    return this.props.emailVerificationToken;
  }

  get passwordResetToken(): string | undefined {
    return this.props.passwordResetToken;
  }

  get passwordResetExpires(): Date | undefined {
    return this.props.passwordResetExpires;
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  updateProfile(firstName: string, lastName: string): void {
    this.props.firstName = firstName;
    this.props.lastName = lastName;
    this.props.updatedAt = new Date();
  }

  changePassword(newPassword: Password): void {
    this.props.password = newPassword;
    this.props.updatedAt = new Date();
  }

  verifyEmail(): void {
    this.props.isEmailVerified = true;
    this.props.emailVerificationToken = undefined;
    this.props.updatedAt = new Date();
  }

  generateEmailVerificationToken(): string {
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    this.props.emailVerificationToken = token;
    this.props.updatedAt = new Date();
    return token;
  }

  generatePasswordResetToken(): string {
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    this.props.passwordResetToken = token;
    this.props.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    this.props.updatedAt = new Date();
    return token;
  }

  resetPassword(newPassword: Password): void {
    this.props.password = newPassword;
    this.props.passwordResetToken = undefined;
    this.props.passwordResetExpires = undefined;
    this.props.updatedAt = new Date();
  }

  recordLogin(): void {
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  canResetPassword(): boolean {
    if (!this.props.passwordResetToken || !this.props.passwordResetExpires) {
      return false;
    }
    return new Date() < this.props.passwordResetExpires;
  }

  hasRole(role: UserRole): boolean {
    return this.props.role === role;
  }

  isAdmin(): boolean {
    return this.props.role === "admin";
  }

  isCustomer(): boolean {
    return this.props.role === "customer";
  }

  isVendor(): boolean {
    return this.props.role === "vendor";
  }

  // Convert to plain object for persistence
  toPersistence(): UserProps {
    return { ...this.props };
  }

  // Convert to public representation (without sensitive data)
  toPublic(): Omit<
    UserProps,
    "password" | "passwordResetToken" | "emailVerificationToken"
  > {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      password,
      passwordResetToken,
      emailVerificationToken,
      ...publicProps
    } = this.props;
    return {
      ...publicProps,
      email: this.props.email, // Email value object will handle its own serialization
    };
  }
}
