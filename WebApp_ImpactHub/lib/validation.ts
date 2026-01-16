/**
 * Input validation utilities for server-side validation
 */

export const MAX_LENGTHS = {
  username: 30,
  fullName: 100,
  workoutTitle: 100,
  notes: 1000,
  exerciseName: 100,
} as const;

export const NUMERIC_BOUNDS = {
  weight: { min: 0, max: 2000 },
  reps: { min: 0, max: 1000 },
  sets: { min: 1, max: 100 },
  rir: { min: 0, max: 10 },
} as const;

export function validateString(
  value: unknown,
  maxLength: number
): { valid: boolean; sanitized: string; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, sanitized: '', error: 'Value must be a string' };
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { valid: false, sanitized: '', error: 'Value cannot be empty' };
  }

  if (trimmed.length > maxLength) {
    return {
      valid: false,
      sanitized: '',
      error: `Value must be ${maxLength} characters or less`,
    };
  }

  // Basic sanitization - remove potentially dangerous characters
  const sanitized = trimmed
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers

  return { valid: true, sanitized };
}

export function validateNumber(
  value: unknown,
  min: number,
  max: number
): { valid: boolean; number: number; error?: string } {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || isNaN(num)) {
    return { valid: false, number: 0, error: 'Value must be a number' };
  }

  if (num < min || num > max) {
    return {
      valid: false,
      number: 0,
      error: `Value must be between ${min} and ${max}`,
    };
  }

  return { valid: true, number: num };
}

export function validateUUID(value: unknown): { valid: boolean; uuid: string; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, uuid: '', error: 'UUID must be a string' };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    return { valid: false, uuid: '', error: 'Invalid UUID format' };
  }

  return { valid: true, uuid: value.toLowerCase() };
}

export function validateEmail(value: unknown): { valid: boolean; email: string; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, email: '', error: 'Email must be a string' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(value)) {
    return { valid: false, email: '', error: 'Invalid email format' };
  }

  return { valid: true, email: value.toLowerCase().trim() };
}

export function validateDate(value: unknown): { valid: boolean; date: Date | null; error?: string } {
  if (!value) {
    return { valid: false, date: null, error: 'Date is required' };
  }

  const date = new Date(value as string);

  if (isNaN(date.getTime())) {
    return { valid: false, date: null, error: 'Invalid date format' };
  }

  return { valid: true, date };
}
