// Common types used across the application

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  meta?: {
    pagination?: PaginationMeta;
    filters?: Record<string, unknown>;
    sorting?: SortingMeta;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SortingMeta {
  field: string;
  order: "asc" | "desc";
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortingParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FilterParams {
  [key: string]: string | number | boolean | Date | undefined;
}

export interface SearchParams
  extends PaginationParams,
    SortingParams,
    FilterParams {
  search?: string;
}

// Database related types
export interface DatabaseRecord {
  id: number;
  created_at: Date;
  updated_at: Date;
}

export interface AuditableRecord extends DatabaseRecord {
  created_by?: number;
  updated_by?: number;
}

// Authentication types
export interface JwtPayload {
  user_id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
}

// Request types
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// File upload types
export interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

export interface ProcessedImage {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
}

// Common enums
export enum UserRole {
  ADMIN = "admin",
  CUSTOMER = "customer",
  VENDOR = "vendor",
}

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum ProductStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  OUT_OF_STOCK = "out_of_stock",
  DISCONTINUED = "discontinued",
}

// Environment types
export interface EnvironmentConfig {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REDIS_URL?: string;
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  UPLOAD_PATH: string;
  MAX_FILE_SIZE: number;
}

export type EntityId = number;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
