import { User } from "../../../domain/entities/user.entity";
import { Email } from "../../../domain/value-objects/email.vo";
import { UserRepository } from "../../../domain/repositories/user.repository";
import {
  ValidationException,
  UnauthorizedException,
} from "../../../shared/exceptions";

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface LoginUserResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
  ) {}

  async execute(dto: LoginUserDto): Promise<LoginUserResult> {
    // Validate input
    this.validateInput(dto);

    // Create email value object
    const email = Email.create(dto.email);

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated");
    }

    // Verify password
    const isPasswordValid = await user.password.compare(dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Record login
    user.recordLogin();
    await this.userRepository.update(user);

    // Generate tokens
    const tokens = await this.jwtService.generateTokenPair({
      user_id: user.id,
      email: user.email.getValue(),
      role: user.role,
    });

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private validateInput(dto: LoginUserDto): void {
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

    if (errors.length > 0) {
      throw new ValidationException("Login validation failed", errors);
    }
  }
}

// JWT Service interface (will be implemented in infrastructure layer)
export interface JwtService {
  generateTokenPair(payload: {
    user_id: number;
    email: string;
    role: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;

  verifyAccessToken(token: string): Promise<{
    user_id: number;
    email: string;
    role: string;
  }>;

  verifyRefreshToken(token: string): Promise<{
    user_id: number;
    email: string;
    role: string;
  }>;
}
