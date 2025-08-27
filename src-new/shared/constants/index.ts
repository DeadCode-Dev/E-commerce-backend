// Application constants

export const API_ROUTES = {
  AUTH: {
    BASE: "/api/v1/auth",
    LOGIN: "/login",
    REGISTER: "/register",
    LOGOUT: "/logout",
    REFRESH: "/refresh",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    VERIFY_EMAIL: "/verify-email",
  },
  USERS: {
    BASE: "/api/v1/users",
    PROFILE: "/profile",
    UPDATE_PROFILE: "/profile",
    DELETE_ACCOUNT: "/account",
  },
  PRODUCTS: {
    BASE: "/api/v1/products",
    CATEGORIES: "/categories",
    VARIANTS: "/variants",
    REVIEWS: "/reviews",
    SEARCH: "/search",
  },
  ORDERS: {
    BASE: "/api/v1/orders",
    ITEMS: "/items",
    HISTORY: "/history",
    CANCEL: "/cancel",
  },
  CART: {
    BASE: "/api/v1/cart",
    ADD: "/add",
    REMOVE: "/remove",
    UPDATE: "/update",
    CLEAR: "/clear",
  },
  UPLOADS: {
    BASE: "/api/v1/uploads",
    IMAGES: "/images",
    DOCUMENTS: "/documents",
  },
} as const;

export const ERROR_CODES = {
  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Authentication errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Business logic errors
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  ORDER_CANNOT_BE_CANCELLED: "ORDER_CANNOT_BE_CANCELLED",
  PAYMENT_FAILED: "PAYMENT_FAILED",

  // System errors
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",

  // File upload errors
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  UPLOAD_FAILED: "UPLOAD_FAILED",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const VALIDATION_RULES = {
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 255,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  PRODUCT: {
    NAME_MAX_LENGTH: 255,
    DESCRIPTION_MAX_LENGTH: 2000,
    MIN_PRICE: 0,
    MAX_PRICE: 999999.99,
  },
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    ALLOWED_DOCUMENT_TYPES: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
} as const;

export const CACHE_KEYS = {
  USER_PROFILE: (userId: number) => `user:profile:${userId}`,
  PRODUCT_DETAILS: (productId: number) => `product:details:${productId}`,
  CART: (userId: number) => `cart:${userId}`,
  CATEGORIES: "categories:all",
  POPULAR_PRODUCTS: "products:popular",
  SESSION: (sessionId: string) => `session:${sessionId}`,
} as const;

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: "15m",
  REFRESH_TOKEN_EXPIRES_IN: "7d",
  RESET_TOKEN_EXPIRES_IN: "1h",
  VERIFY_TOKEN_EXPIRES_IN: "24h",
} as const;

export const EMAIL_TEMPLATES = {
  WELCOME: "welcome",
  PASSWORD_RESET: "password-reset",
  ORDER_CONFIRMATION: "order-confirmation",
  ORDER_SHIPPED: "order-shipped",
  EMAIL_VERIFICATION: "email-verification",
} as const;

export const SORT_ORDERS = ["asc", "desc"] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export const USER_ROLES = ["admin", "customer", "vendor"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "completed",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PRODUCT_STATUSES = [
  "active",
  "inactive",
  "out_of_stock",
  "discontinued",
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
