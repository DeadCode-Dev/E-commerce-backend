import { User } from "../../../domain/entities/user.entity";
import { Email } from "../../../domain/value-objects/email.vo";
import { Password } from "../../../domain/value-objects/password.vo";
import { UserRepository } from "../../../domain/repositories/user.repository";
import {
  ValidationException,
  ConflictException,
} from "../../../shared/exceptions";
import { UserRole } from "../../../shared/types/api.types";

export interface RegisterUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface RegisterUserResult {
  user: User;
  emailVerificationToken: string;
}

export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(dto: RegisterUserDto): Promise<RegisterUserResult> {
    // Validate input
    this.validateInput(dto);

    // Create value objects
    const email = Email.create(dto.email);
    const password = Password.create(dto.password);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await password.hash();

    // Create user entity
    const user = User.create({
      email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: (dto.role || UserRole.CUSTOMER) as UserRole,
      isEmailVerified: false,
      isActive: true,
    });

    // Generate email verification token
    const emailVerificationToken = user.generateEmailVerificationToken();

    // Save user
    const savedUser = await this.userRepository.create(user);

    return {
      user: savedUser,
      emailVerificationToken,
    };
  }

  private validateInput(dto: RegisterUserDto): void {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!dto.email?.trim()) {
      errors.push({
        field: "email",
        message: "Email is required",
        code: "REQUIRED",
      });
    }

    if (!dto.password?.trim()) {
      errors.push({
        field: "password",
        message: "Password is required",
        code: "REQUIRED",
      });
    }

    if (!dto.firstName?.trim()) {
      errors.push({
        field: "firstName",
        message: "First name is required",
        code: "REQUIRED",
      });
    } else if (dto.firstName.length < 2 || dto.firstName.length > 50) {
      errors.push({
        field: "firstName",
        message: "First name must be between 2 and 50 characters",
        code: "INVALID_LENGTH",
      });
    }

    if (!dto.lastName?.trim()) {
      errors.push({
        field: "lastName",
        message: "Last name is required",
        code: "REQUIRED",
      });
    } else if (dto.lastName.length < 2 || dto.lastName.length > 50) {
      errors.push({
        field: "lastName",
        message: "Last name must be between 2 and 50 characters",
        code: "INVALID_LENGTH",
      });
    }

    if (dto.role && !Object.values(UserRole).includes(dto.role)) {
      errors.push({
        field: "role",
        message: "Role must be either customer or vendor",
        code: "INVALID_VALUE",
      });
    }

    if (errors.length > 0) {
      throw new ValidationException("Registration validation failed", errors);
    }
  }
}
