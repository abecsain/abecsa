/**
 * ABECSA Security & CRUD Input Validation Suite
 * Strict field-level validation, mass-assignment protection, and payload sanitization.
 */

export function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const clean = email.trim().toLowerCase();
  // Standard RFC 5322 regex check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return clean.length >= 5 && clean.length <= 254 && emailRegex.test(clean);
}

export function isValidPhone(phone: unknown): boolean {
  if (typeof phone !== "string") return false;
  const clean = phone.replace(/[\s\-\+\(\)]/g, "");
  return clean.length >= 7 && clean.length <= 15 && /^\d+$/.test(clean);
}

export function sanitizeString(
  val: unknown,
  maxLength = 1000,
  minLength = 0
): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (trimmed.length < minLength || trimmed.length > maxLength) return null;
  // Strip control characters & null bytes
  return trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

export function sanitizeHtmlText(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function parseValidNumber(
  val: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): number | null {
  if (val === undefined || val === null || val === "") return null;
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return null;
  if (num < min || num > max) return null;
  return num;
}

export function isValidEnum<T extends string>(
  val: unknown,
  allowedValues: readonly T[]
): val is T {
  if (typeof val !== "string") return false;
  return (allowedValues as readonly string[]).includes(val);
}

export function pickAllowed<T extends Record<string, any>>(
  input: any,
  allowedKeys: readonly (keyof T)[]
): Partial<T> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const result: Partial<T> = {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(input, key) && input[key] !== undefined) {
      result[key] = input[key];
    }
  }
  return result;
}
