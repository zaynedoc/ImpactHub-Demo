/**
 * Security utilities for ImpactHub
 * Contains helpers for request security, sanitization, and audit logging
 */

import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function getClientIPFromHeaders(): Promise<string> {
  const headersList = await headers();
  
  // Cloudflare
  const cfConnectingIP = headersList.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;
  
  // Vercel / Generic proxies
  const xRealIP = headersList.get('x-real-ip');
  if (xRealIP) return xRealIP;
  
  // X-Forwarded-For (may contain multiple IPs)
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    // Get the first (original client) IP
    return forwardedFor.split(',')[0].trim();
  }
  
  return 'unknown';
}

/**
 * Extract client IP from NextRequest object
 */
export function getClientIPFromRequest(request: NextRequest): string {
  // Cloudflare
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;
  
  // Vercel / Generic proxies
  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) return xRealIP;
  
  // X-Forwarded-For
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // Fallback to request IP if available
  return request.ip || 'unknown';
}

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim();
}

/**
 * HTML encode special characters for safe display
 */
export function htmlEncode(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize object keys and string values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeString(key);
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[sanitizedKey] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) :
        item
      );
    } else {
      sanitized[sanitizedKey] = value;
    }
  }
  
  return sanitized as T;
}

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  // For same-origin requests, origin might be null
  if (!origin && !referer) return true;
  
  const allowedHosts = [
    host,
    process.env.NEXT_PUBLIC_SITE_URL,
    'localhost:3000',
    '127.0.0.1:3000',
  ].filter(Boolean);
  
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return allowedHosts.includes(originHost);
    } catch {
      return false;
    }
  }
  
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      return allowedHosts.includes(refererHost);
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Check if request is from an API client (not a browser)
 */
export function isAPIRequest(request: NextRequest): boolean {
  const accept = request.headers.get('accept') || '';
  const contentType = request.headers.get('content-type') || '';
  
  return (
    accept.includes('application/json') ||
    contentType.includes('application/json') ||
    request.headers.has('x-api-key')
  );
}

// ============================================================================
// SUSPICIOUS ACTIVITY DETECTION
// ============================================================================

// Common attack patterns to detect
const SUSPICIOUS_PATTERNS = [
  /\.\.\//g,                    // Path traversal
  /<script/gi,                  // Script injection
  /javascript:/gi,              // JavaScript protocol
  /SELECT.*FROM/gi,             // SQL injection
  /UNION.*SELECT/gi,            // SQL injection
  /INSERT.*INTO/gi,             // SQL injection
  /DROP.*TABLE/gi,              // SQL injection
  /DELETE.*FROM/gi,             // SQL injection
  /UPDATE.*SET/gi,              // SQL injection
  /'.*OR.*'/gi,                 // SQL injection
  /".*OR.*"/gi,                 // SQL injection
  /exec\s*\(/gi,                // Command execution
  /eval\s*\(/gi,                // JavaScript eval
  /\$\{/g,                      // Template injection
];

/**
 * Check if input contains suspicious patterns
 */
export function containsSuspiciousContent(input: string): boolean {
  if (typeof input !== 'string') return false;
  
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Analyze request for suspicious activity
 */
export function analyzeRequestSecurity(request: NextRequest): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const url = request.nextUrl;
  const path = url.pathname;
  const query = url.search;
  
  // Check path for suspicious patterns
  if (containsSuspiciousContent(path)) {
    reasons.push('Suspicious path pattern detected');
  }
  
  // Check query string
  if (containsSuspiciousContent(query)) {
    reasons.push('Suspicious query parameter detected');
  }
  
  // Check for unusual user agents
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousAgents = ['sqlmap', 'nikto', 'acunetix', 'nessus', 'masscan'];
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    reasons.push('Suspicious user agent detected');
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}

// ============================================================================
// TIMING-SAFE COMPARISON
// ============================================================================

/**
 * Compare two strings in constant time (prevents timing attacks)
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// ============================================================================
// TOKEN/HASH UTILITIES
// ============================================================================

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string using SHA-256
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}
