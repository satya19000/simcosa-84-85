import { ValidationError } from './Errors'

/** Assert a required string field is non-empty. */
export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(field, 'must be a non-empty string')
  }
  return value.trim()
}

/** Assert a required string and enforce max length. */
export function requireStringMax(value: unknown, field: string, max: number): string {
  const s = requireString(value, field)
  if (s.length > max) {
    throw new ValidationError(field, `must be ${max} characters or fewer (got ${s.length})`)
  }
  return s
}

/** Assert an optional string field — returns undefined if absent/null. */
export function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') throw new ValidationError(field, 'must be a string if provided')
  return value.trim() || undefined
}

/** Assert value is one of an allowed set. */
export function requireOneOf<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[]
): T {
  if (!allowed.includes(value as T)) {
    throw new ValidationError(field, `must be one of: ${allowed.join(', ')}`)
  }
  return value as T
}

/** Assert value is a valid ISO-8601 date-time string. */
export function requireISODate(value: unknown, field: string): string {
  const s = requireString(value, field)
  if (isNaN(Date.parse(s))) {
    throw new ValidationError(field, 'must be a valid ISO-8601 date-time string')
  }
  return s
}

/** Assert optional ISO-8601 date-time — returns undefined if absent. */
export function optionalISODate(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined
  return requireISODate(value, field)
}

/** Assert a required boolean field. */
export function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new ValidationError(field, 'must be a boolean')
  return value
}

/** Assert value is a positive integer. */
export function requirePositiveInt(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new ValidationError(field, 'must be a positive integer')
  }
  return value
}
