/**
 * Typed application errors.
 * Map these to HTTP status codes only at the API / route boundary.
 */

export type ErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "DOMAIN_RULE"
  | "SERVICE_UNAVAILABLE"
  | "UPSTREAM"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** User-facing copy for outages — never mention Postgres/Prisma/Docker. */
export const SERVICE_UNAVAILABLE_MESSAGE = "Service unavailable";

export function serviceUnavailableError(): AppError {
  return new AppError("SERVICE_UNAVAILABLE", SERVICE_UNAVAILABLE_MESSAGE);
}

export function isDatabaseUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as {
    name?: string;
    message?: string;
    code?: string;
  };

  const name = err.name ?? "";
  const message = err.message ?? "";
  const code = err.code ?? "";

  if (
    name === "PrismaClientInitializationError" ||
    name === "PrismaClientKnownRequestError" ||
    name === "PrismaClientRustPanicError" ||
    name.includes("Prisma")
  ) {
    if (
      code === "P1001" ||
      code === "P1000" ||
      code === "P1017" ||
      message.includes("Can't reach database") ||
      message.includes("Timed out fetching") ||
      message.includes("Connection refused") ||
      message.includes("ECONNREFUSED") ||
      message.includes("server has closed the connection") ||
      name === "PrismaClientInitializationError"
    ) {
      return true;
    }
  }

  if (
    message.includes("Can't reach database") ||
    message.includes("ECONNREFUSED") ||
    message.includes("connect ECONNREFUSED")
  ) {
    return true;
  }

  return false;
}

/** Log internals; throw a safe AppError for the UI/API boundary. */
export function rethrowSafe(error: unknown): never {
  if (isAppError(error)) {
    throw error;
  }

  if (isDatabaseUnavailable(error)) {
    console.error("[db] unavailable", error);
    throw serviceUnavailableError();
  }

  console.error(error);
  throw new AppError("INTERNAL", "Something went wrong");
}
