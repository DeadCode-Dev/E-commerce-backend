import dotenv from "dotenv";
import { EnvironmentConfig } from "../shared/types/api.types";

// Load environment variables
dotenv.config();

class ConfigService {
  private readonly config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): EnvironmentConfig {
    return {
      NODE_ENV:
        (process.env.NODE_ENV as "development" | "production" | "test") ||
        "development",
      PORT: parseInt(process.env.PORT || "3000", 10),
      DATABASE_URL: process.env.DATABASE_URL || "",
      JWT_SECRET: process.env.JWT_SECRET || "",
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
      REDIS_URL: process.env.REDIS_URL,
      EMAIL_HOST: process.env.EMAIL_HOST || "",
      EMAIL_PORT: parseInt(process.env.EMAIL_PORT || "587", 10),
      EMAIL_USER: process.env.EMAIL_USER || "",
      EMAIL_PASS: process.env.EMAIL_PASS || "",
      UPLOAD_PATH: process.env.UPLOAD_PATH || "./uploads",
      MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || "5242880", 10), // 5MB default
    };
  }

  private validateConfig(): void {
    const requiredEnvVars = [
      "DATABASE_URL",
      "JWT_SECRET",
      "EMAIL_HOST",
      "EMAIL_USER",
      "EMAIL_PASS",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !this.config[varName as keyof EnvironmentConfig]
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }

    // Validate specific values
    if (this.config.PORT < 1 || this.config.PORT > 65535) {
      throw new Error("PORT must be between 1 and 65535");
    }

    if (this.config.EMAIL_PORT < 1 || this.config.EMAIL_PORT > 65535) {
      throw new Error("EMAIL_PORT must be between 1 and 65535");
    }

    if (this.config.MAX_FILE_SIZE < 1024) {
      throw new Error("MAX_FILE_SIZE must be at least 1KB");
    }
  }

  // Getters for configuration values
  get nodeEnv(): string {
    return this.config.NODE_ENV;
  }

  get port(): number {
    return this.config.PORT;
  }

  get databaseUrl(): string {
    return this.config.DATABASE_URL;
  }

  get jwtSecret(): string {
    return this.config.JWT_SECRET;
  }

  get jwtExpiresIn(): string {
    return this.config.JWT_EXPIRES_IN;
  }

  get redisUrl(): string | undefined {
    return this.config.REDIS_URL;
  }

  get emailConfig(): {
    host: string;
    port: number;
    user: string;
    pass: string;
  } {
    return {
      host: this.config.EMAIL_HOST,
      port: this.config.EMAIL_PORT,
      user: this.config.EMAIL_USER,
      pass: this.config.EMAIL_PASS,
    };
  }

  get uploadConfig(): {
    path: string;
    maxFileSize: number;
  } {
    return {
      path: this.config.UPLOAD_PATH,
      maxFileSize: this.config.MAX_FILE_SIZE,
    };
  }

  // Utility methods
  isDevelopment(): boolean {
    return this.config.NODE_ENV === "development";
  }

  isProduction(): boolean {
    return this.config.NODE_ENV === "production";
  }

  isTest(): boolean {
    return this.config.NODE_ENV === "test";
  }

  // Database configuration
  getDatabaseConfig() {
    const url = new URL(this.config.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || "5432", 10),
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
      ssl: this.isProduction() ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }

  // CORS configuration
  getCorsConfig() {
    const allowedOrigins = this.isDevelopment()
      ? [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:5173",
        ]
      : (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);

    return {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    };
  }

  // Rate limiting configuration
  getRateLimitConfig() {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: this.isDevelopment() ? 1000 : 100, // Limit each IP to 100 requests per windowMs in production
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    };
  }

  // JWT configuration
  getJwtConfig() {
    return {
      secret: this.config.JWT_SECRET,
      accessTokenExpiresIn: this.config.JWT_EXPIRES_IN,
      refreshTokenExpiresIn: "7d",
      algorithm: "HS256" as const,
    };
  }

  // Get all config (for debugging in development)
  getAllConfig(): EnvironmentConfig {
    if (!this.isDevelopment()) {
      throw new Error("getAllConfig() is only available in development mode");
    }
    return { ...this.config };
  }
}

// Export singleton instance
export const configService = new ConfigService();
export default configService;
