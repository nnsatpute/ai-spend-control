import { isAppError, rethrowSafe, type ErrorCode } from "@/domain/common";

const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  DOMAIN_RULE: 422,
  SERVICE_UNAVAILABLE: 503,
  UPSTREAM: 502,
  INTERNAL: 500,
};

export type ApiErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
};

export function errorStatus(code: ErrorCode): number {
  return ERROR_STATUS[code];
}

export function toApiErrorBody(error: unknown): ApiErrorBody {
  if (isAppError(error)) {
    return {
      error: {
        code: error.code,
        message: error.message,
        // Never leak internal details to clients
      },
    };
  }

  try {
    rethrowSafe(error);
  } catch (safe) {
    if (isAppError(safe)) {
      return {
        error: {
          code: safe.code,
          message: safe.message,
        },
      };
    }
  }

  return {
    error: {
      code: "INTERNAL",
      message: "Something went wrong",
    },
  };
}

export function apiStatusFromError(error: unknown): number {
  if (isAppError(error)) {
    return errorStatus(error.code);
  }

  try {
    rethrowSafe(error);
  } catch (safe) {
    if (isAppError(safe)) {
      return errorStatus(safe.code);
    }
  }

  return 500;
}

export function apiError(error: unknown): Response {
  return Response.json(toApiErrorBody(error), { status: apiStatusFromError(error) });
}
