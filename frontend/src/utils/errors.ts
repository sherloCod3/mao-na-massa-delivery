/**
 * Error types and utilities for the frontend.
 *
 * Principles (Error Handling Patterns):
 * - Typed errors known vs unexpected
 * - User-friendly messages in Portuguese
 * - Fallback chain for unknown errors
 * - Preserved context for debugging
 */

// ─── API Error Shape ─────────────────────────────────────────────

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    request_id: string | null
    details?: Record<string, unknown>
  }
}

// ─── Parse API Error ─────────────────────────────────────────────

export interface ParsedError {
  message: string
  code: string
  requestId: string | null
  raw: unknown
}

/**
 * Parse a caught value into a structured error with a user-friendly message.
 *
 * Handles:
 * - ApiError instances (from client.ts)
 * - Standard JS Errors
 * - String errors
 * - Unknown shapes (throw string, etc.)
 *
 * Note: Raw Response objects are NOT handled here because client.ts
 * parses them before throwing. If you need to handle Response objects,
 * do so before calling this function.
 */
export function parseApiError(err: unknown): ParsedError {
  // Already a known shape — from client.ts
  if (err instanceof ApiError) {
    return {
      message: err.userMessage,
      code: err.code,
      requestId: err.requestId,
      raw: err,
    }
  }

  // Standard JS Error
  if (err instanceof Error) {
    return {
      message: err.message || 'Erro desconhecido',
      code: 'JS_ERROR',
      requestId: null,
      raw: err,
    }
  }

  // String error
  if (typeof err === 'string') {
    return {
      message: err,
      code: 'STRING_ERROR',
      requestId: null,
      raw: err,
    }
  }

  // Unknown
  return {
    message: 'Erro inesperado',
    code: 'UNKNOWN',
    requestId: null,
    raw: err,
  }
}

// ─── ApiError Class ──────────────────────────────────────────────

export class ApiError extends Error {
  code: string
  statusCode: number
  requestId: string | null
  details: Record<string, unknown> | null

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    requestId: string | null = null,
    details: Record<string, unknown> | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.requestId = requestId
    this.details = details
  }

  get userMessage(): string {
    return this.message
  }
}

// ─── Friendly Toast Message chooser ──────────────────────────────

export function friendlyMessage(
  err: unknown,
  fallback: string = 'Erro ao executar operação',
): string {
  const parsed = parseApiError(err)
  // Use the parsed message if it looks user-friendly (not an internal code)
  if (parsed.message && parsed.code !== 'INTERNAL_ERROR') {
    return parsed.message
  }
  return fallback
}

/**
 * Safely execute an async function and return enriched error info.
 * Usage: const [result, error] = await tryCatch(fn)
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
): Promise<[T, null] | [null, ParsedError]> {
  try {
    const data = await fn()
    return [data, null]
  } catch (err) {
    return [null, parseApiError(err)]
  }
}
