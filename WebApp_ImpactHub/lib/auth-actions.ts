'use server';

/**
 * Server-side authentication actions with rate limiting
 * These actions handle auth operations securely on the server
 */

import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';
import { validateEmail, validateString, MAX_LENGTHS } from '@/lib/validation';
import { headers } from 'next/headers';

// Types for action responses
export interface AuthActionResult {
  success: boolean;
  error?: string;
  message?: string;
  rateLimited?: boolean;
}

/**
 * Get client IP from request headers
 */
async function getClientIP(): Promise<string> {
  const headersList = await headers();
  // Check various headers for client IP (Cloudflare, proxies, etc.)
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIP = headersList.get('x-real-ip');
  const cfConnectingIP = headersList.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  
  return 'unknown';
}

/**
 * Validate password strength
 */
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Server action for user login with rate limiting
 */
export async function loginAction(
  email: string,
  password: string
): Promise<AuthActionResult> {
  try {
    const clientIP = await getClientIP();
    
    // Rate limit by IP for auth endpoints
    const rateLimit = checkRateLimit(`auth:login:${clientIP}`, RATE_LIMITS.auth);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Too many login attempts. Please try again in ${Math.ceil(rateLimit.resetIn / 60000)} minutes.`,
        rateLimited: true,
      };
    }
    
    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error };
    }
    
    // Basic password validation (just check it exists)
    if (!password || password.length === 0) {
      return { success: false, error: 'Password is required' };
    }
    
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailValidation.email,
      password,
    });
    
    if (error) {
      // Log failed login attempt (avoid exposing specific error details)
      console.warn(`Failed login attempt for ${emailValidation.email} from ${clientIP}`);
      return { success: false, error: 'Invalid email or password' };
    }
    
    return { success: true, message: 'Login successful' };
  } catch (error) {
    console.error('Login action error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Server action for user signup with rate limiting and validation
 */
export async function signupAction(
  email: string,
  password: string,
  fullName: string
): Promise<AuthActionResult> {
  try {
    const clientIP = await getClientIP();
    
    // Rate limit by IP for auth endpoints - more strict for signup
    const rateLimit = checkRateLimit(`auth:signup:${clientIP}`, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // Only 5 signups per hour per IP
    });
    
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Too many signup attempts. Please try again later.`,
        rateLimited: true,
      };
    }
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error };
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.errors[0] };
    }
    
    // Validate full name
    const nameValidation = validateString(fullName, MAX_LENGTHS.fullName);
    if (!nameValidation.valid) {
      return { success: false, error: 'Please provide a valid name (max 100 characters)' };
    }
    
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: emailValidation.email,
      password,
      options: {
        data: {
          full_name: nameValidation.sanitized,
        },
      },
    });
    
    if (error) {
      // Handle specific signup errors
      if (error.message.includes('already registered')) {
        return { success: false, error: 'An account with this email already exists' };
      }
      console.error(`Signup error for ${emailValidation.email}:`, error.message);
      return { success: false, error: 'Could not create account. Please try again.' };
    }
    
    return { 
      success: true, 
      message: 'Account created! Please check your email to verify your account.' 
    };
  } catch (error) {
    console.error('Signup action error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Server action for password reset with rate limiting
 */
export async function forgotPasswordAction(
  email: string
): Promise<AuthActionResult> {
  try {
    const clientIP = await getClientIP();
    
    // Rate limit password reset requests
    const rateLimit = checkRateLimit(`auth:reset:${clientIP}`, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // Only 3 reset requests per hour per IP
    });
    
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: 'Too many password reset requests. Please try again later.',
        rateLimited: true,
      };
    }
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error };
    }
    
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(emailValidation.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback?type=recovery`,
    });
    
    // Always return success to prevent email enumeration
    // Even if the email doesn't exist, we don't reveal that
    if (error) {
      console.error(`Password reset error for ${emailValidation.email}:`, error.message);
    }
    
    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    };
  } catch (error) {
    console.error('Forgot password action error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Server action for updating password (after reset)
 */
export async function updatePasswordAction(
  newPassword: string
): Promise<AuthActionResult> {
  try {
    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.errors[0] };
    }
    
    const supabase = await createClient();
    
    // Verify user is authenticated (has valid recovery session)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'Invalid or expired reset link. Please request a new one.' };
    }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      console.error(`Password update error for user ${user.id}:`, error.message);
      return { success: false, error: 'Could not update password. Please try again.' };
    }
    
    return { success: true, message: 'Password updated successfully!' };
  } catch (error) {
    console.error('Update password action error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Server action for logout
 */
export async function logoutAction(): Promise<AuthActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error.message);
      return { success: false, error: 'Could not sign out. Please try again.' };
    }
    
    return { success: true, message: 'Signed out successfully' };
  } catch (error) {
    console.error('Logout action error:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
