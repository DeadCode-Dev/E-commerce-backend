// Base exception class
export abstract class BaseException extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation exception
export class ValidationException extends BaseException {
  public readonly errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  constructor(
    message: string,
    errors: Array<{ field: string; message: string; code: string }> = [],
    code = "VALIDATION_ERROR"
  ) {
    super(message, code, 422);
    this.errors = errors;
  }
}

// Not found exception
export class NotFoundException extends BaseException {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier ${identifier} not found`
      : `${resource} not found`;
    super(message, "NOT_FOUND", 404);
  }
}

// Unauthorized exception
export class UnauthorizedException extends BaseException {
  constructor(message = "Unauthorized access") {
    super(message, "UNAUTHORIZED", 401);
  }
}

// Forbidden exception
export class ForbiddenException extends BaseException {
  constructor(message = "Access forbidden") {
    super(message, "FORBIDDEN", 403);
  }
}

// Conflict exception
export class ConflictException extends BaseException {
  constructor(message: string, code = "CONFLICT") {
    super(message, code, 409);
  }
}

// Business logic exception
export class BusinessLogicException extends BaseException {
  constructor(message: string, code: string) {
    super(message, code, 400);
  }
}

// External service exception
export class ExternalServiceException extends BaseException {
  constructor(service: string, message?: string) {
    const errorMessage = message
      ? `External service error (${service}): ${message}`
      : `External service error: ${service}`;
    super(errorMessage, "EXTERNAL_SERVICE_ERROR", 503);
  }
}

// Database exception
export class DatabaseException extends BaseException {
  constructor(message: string) {
    super(message, "DATABASE_ERROR", 500, false);
  }
}

// File upload exception
export class FileUploadException extends BaseException {
  constructor(message: string, code = "UPLOAD_FAILED") {
    super(message, code, 400);
  }
}
