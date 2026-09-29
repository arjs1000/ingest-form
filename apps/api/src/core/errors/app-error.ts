import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** An expected failure with a safe, client-facing message. Anything else is treated as a 500. */
export class AppError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown, message = 'Request validation failed') {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

/** 401. `code` distinguishes UNAUTHENTICATED, API_KEY_EXPIRED and API_KEY_REVOKED. */
export class UnauthenticatedError extends AppError {
  constructor(code = 'UNAUTHENTICATED', message = 'A valid API key is required') {
    super(401, code, message);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'The file is too large') {
    super(413, 'PAYLOAD_TOO_LARGE', message);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'Upload a PDF, JPG or PNG') {
    super(415, 'UNSUPPORTED_MEDIA_TYPE', message);
  }
}

/** 503 when a dependency (database) is not configured or reachable. */
export class ServiceUnavailableError extends AppError {
  constructor(code: string, message: string) {
    super(503, code, message);
  }
}
