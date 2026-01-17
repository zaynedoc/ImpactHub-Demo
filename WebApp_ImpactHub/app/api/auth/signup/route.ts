import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { validateEmail, validateString, MAX_LENGTHS } from '@/lib/validation';
import { getClientIPFromRequest, sanitizeString } from '@/lib/security';
import { logAuthEvent, logSecurityEvent } from '@/lib/audit-log';
import type { ApiResponse } from '@/types/api';

interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
}

// Password validation
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

/**
 * POST /api/auth/signup
 * Server-side signup with rate limiting, validation, and audit logging
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIPFromRequest(request);
    
    // Strict rate limiting for signups (5 per hour per IP)
    const rateLimit = checkRateLimit(`auth:signup:${clientIP}`, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,
    });
    
    if (!rateLimit.allowed) {
      await logSecurityEvent('rate_limit_exceeded', {
        endpoint: '/api/auth/signup',
        ip: clientIP,
      });
      
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many signup attempts. Please try again later.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }
    
    // Parse and validate request body
    let body: SignupRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { email, password, fullName } = body;
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: emailValidation.error },
        { status: 400 }
      );
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: passwordValidation.error },
        { status: 400 }
      );
    }
    
    // Validate and sanitize full name
    const nameValidation = validateString(fullName, MAX_LENGTHS.fullName);
    if (!nameValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Please provide a valid name (max 100 characters)' },
        { status: 400 }
      );
    }
    
    const sanitizedName = sanitizeString(nameValidation.sanitized);
    
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: emailValidation.email,
      password,
      options: {
        data: {
          full_name: sanitizedName,
        },
      },
    });
    
    if (error) {
      // Handle specific errors
      if (error.message.includes('already registered')) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'An account with this email already exists' },
          { status: 400 }
        );
      }
      
      console.error(`Signup error for ${emailValidation.email}:`, error.message);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Could not create account. Please try again.' },
        { status: 500 }
      );
    }
    
    // Log signup
    if (data.user) {
      await logAuthEvent('signup', data.user.id, {
        ip: clientIP,
        email: emailValidation.email,
      });
    }
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Account created! Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
