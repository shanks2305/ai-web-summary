export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class QuotaExceededError extends AppError {
  constructor(options?: { cause?: unknown; message?: string }) {
    super(
      options?.message ?? "API quota exceeded",
      "QUOTA_EXCEEDED",
      429,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "QuotaExceededError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isQuotaExceededError(error: unknown): error is QuotaExceededError {
  return error instanceof QuotaExceededError;
}
