import { AppError } from "./errors";

/**
 * Explicit success / failure without throwing across domain boundaries.
 * Prefer Result for expected failures; throw AppError only for unexpected cases
 * at infrastructure edges if needed.
 */

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function unwrapOrThrow<T>(result: Result<T>): T {
  if (!result.ok) {
    throw result.error;
  }
  return result.value;
}
