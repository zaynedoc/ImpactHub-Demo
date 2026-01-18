/**
 * Input validation utilities for server-side validation
 * Comprehensive validation and sanitization for security
 */

export const MAX_LENGTHS = {
  username: 30,
  fullName: 100,
  workoutTitle: 100,
  notes: 1000,
  exerciseName: 100,
  bio: 500,
  email: 255,
  password: 128,
} as const;

export const NUMERIC_BOUNDS = {
  weight: { min: 0, max: 2000 },
  reps: { min: 0, max: 1000 },
  sets: { min: 1, max: 100 },
  rir: { min: 0, max: 10 },
  duration: { min: 1, max: 600 }, // max 10 hours
} as const;

export function validateString(
  value: unknown,
  maxLength: number,
  options?: { allowEmpty?: boolean; minLength?: number }
): { valid: boolean; sanitized: string; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, sanitized: '', error: 'Value must be a string' };
  }

  const trimmed = value.trim();

  if (!options?.allowEmpty && trimmed.length === 0) {
    return { valid: false, sanitized: '', error: 'Value cannot be empty' };
  }

  if (options?.minLength && trimmed.length < options.minLength) {
    return {
      valid: false,
      sanitized: '',
      error: `Value must be at least ${options.minLength} characters`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      valid: false,
      sanitized: '',
      error: `Value must be ${maxLength} characters or less`,
    };
  }

  // Enhanced sanitization - remove potentially dangerous characters
  const sanitized = sanitizeForXSS(trimmed);

  return { valid: true, sanitized };
}

/**
 * Sanitize string to prevent XSS attacks
 */
export function sanitizeForXSS(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/data:/gi, '') // Remove data: protocol (except for legitimate use)
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onload=, onclick=, etc.)
    .replace(/expression\s*\(/gi, '') // Remove CSS expressions
    .replace(/url\s*\(/gi, '') // Remove url() in context
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
    }

    export function validateNumber(
  value: unknown,
  min: number,
  max: number,
  options?: { allowDecimals?: boolean }
): { valid: boolean; number: number; error?: string } {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || isNaN(num)) {
    return { valid: false, number: 0, error: 'Value must be a number' };
  }

  if (!options?.allowDecimals && !Number.isInteger(num)) {
    return { valid: false, number: 0, error: 'Value must be a whole number' };
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

export function validateInteger(
  value: unknown,
  min: number,
  max: number
): { valid: boolean; number: number; error?: string } {
  return validateNumber(value, min, max, { allowDecimals: false });
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

  const trimmed = value.trim();

  if (trimmed.length > MAX_LENGTHS.email) {
    return { valid: false, email: '', error: 'Email is too long' };
  }

  // More comprehensive email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, email: '', error: 'Invalid email format' };
  }

  return { valid: true, email: trimmed.toLowerCase() };
}

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    notCommon: boolean;
  };
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

// Common weak passwords to reject
const COMMON_PASSWORDS = [
  'password', 'password1', 'password123', '12345678', '123456789',
  'qwerty123', 'letmein', 'welcome', 'admin', 'login',
  'abc12345', 'password1!', 'iloveyou', 'sunshine', 'princess',
];

export function validatePassword(password: unknown): PasswordValidationResult {
  if (typeof password !== 'string') {
    return {
      valid: false,
      error: 'Password must be a string',
      checks: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
        notCommon: true,
      },
      strength: 'weak',
    };
  }

  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    notCommon: !COMMON_PASSWORDS.includes(password.toLowerCase()),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  let strength: PasswordValidationResult['strength'];
  if (passedChecks <= 2) strength = 'weak';
  else if (passedChecks <= 3) strength = 'fair';
  else if (passedChecks <= 4) strength = 'good';
  else strength = 'strong';

  // Minimum requirements: length + uppercase + lowercase + number
  const valid = checks.minLength && checks.hasUppercase && checks.hasLowercase && checks.hasNumber && checks.notCommon;

  let error: string | undefined;
  if (!checks.notCommon) {
    error = 'Password is too common. Please choose a stronger password.';
  } else if (!checks.minLength) {
    error = 'Password must be at least 8 characters';
  } else if (!checks.hasUppercase) {
    error = 'Password must contain at least one uppercase letter';
  } else if (!checks.hasLowercase) {
    error = 'Password must contain at least one lowercase letter';
  } else if (!checks.hasNumber) {
    error = 'Password must contain at least one number';
  }

  return { valid, error, checks, strength };
}

// ============================================================================
// DATE VALIDATION
// ============================================================================

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

export function validateDateString(
  value: unknown,
  options?: { minDate?: Date; maxDate?: Date }
): { valid: boolean; dateString: string; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, dateString: '', error: 'Date must be a string' };
  }

  // Validate YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    return { valid: false, dateString: '', error: 'Date must be in YYYY-MM-DD format' };
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { valid: false, dateString: '', error: 'Invalid date' };
  }

  if (options?.minDate && date < options.minDate) {
    return { valid: false, dateString: '', error: 'Date is too far in the past' };
  }

  if (options?.maxDate && date > options.maxDate) {
    return { valid: false, dateString: '', error: 'Date cannot be in the future' };
  }

  return { valid: true, dateString: value };
}

// ============================================================================
// USERNAME VALIDATION
// ============================================================================

export function validateUsername(value: unknown): { valid: boolean; username: string; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, username: '', error: 'Username must be a string' };
  }

  const trimmed = value.trim();

  if (trimmed.length < 3) {
    return { valid: false, username: '', error: 'Username must be at least 3 characters' };
  }

  if (trimmed.length > MAX_LENGTHS.username) {
    return { valid: false, username: '', error: `Username must be ${MAX_LENGTHS.username} characters or less` };
  }

  // Only allow alphanumeric and underscores
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(trimmed)) {
    return { valid: false, username: '', error: 'Username can only contain letters, numbers, and underscores' };
  }

  // Don't allow usernames that start with underscore or number
  if (/^[_0-9]/.test(trimmed)) {
    return { valid: false, username: '', error: 'Username must start with a letter' };
  }

  // Reserved usernames
  const reserved = ['admin', 'root', 'system', 'moderator', 'support', 'help', 'api', 'www'];
  if (reserved.includes(trimmed.toLowerCase())) {
    return { valid: false, username: '', error: 'This username is not available' };
  }

  return { valid: true, username: trimmed.toLowerCase() };
}

// ============================================================================
// URL VALIDATION
// ============================================================================

export function validateURL(value: unknown, options?: { allowedProtocols?: string[] }): { valid: boolean; url: string; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, url: '', error: 'URL must be a string' };
  }

  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);
    
    const allowedProtocols = options?.allowedProtocols || ['https:', 'http:'];
    if (!allowedProtocols.includes(url.protocol)) {
      return { valid: false, url: '', error: `URL must use ${allowedProtocols.join(' or ')}` };
    }

    return { valid: true, url: trimmed };
  } catch {
    return { valid: false, url: '', error: 'Invalid URL format' };
  }
}
