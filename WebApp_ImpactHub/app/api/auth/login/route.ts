import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';
import { validateEmail } from '@/lib/validation';
import { getClientIPFromRequest } from '@/lib/security';
import { logAuthEvent, logSecurityEvent } from '@/lib/audit-log';
import type { ApiResponse } from '@/types/api';

interface LoginRequest {
  email: string;
  password: string;
}

/**
 * POST /api/auth/login
 * Server-side login with rate limiting and audit logging
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIPFromRequest(request);
    
    // Rate limit by IP for login attempts
    const rateLimit = checkRateLimit(`auth:login:${clientIP}`, RATE_LIMITS.auth);
    
    if (!rateLimit.allowed) {
      // Log rate limit exceeded
      await logSecurityEvent('rate_limit_exceeded', {
        endpoint: '/api/auth/login',
        ip: clientIP,
      });
      
      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: `Too many login attempts. Please try again in ${Math.ceil(rateLimit.resetIn / 60000)} minutes.` 
        },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }
    
    // Parse and validate request body
    let body: LoginRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { email, password } = body;
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: emailValidation.error },
        { status: 400 }
      );
    }
    
    // Validate password exists
    if (!password || typeof password !== 'string' || password.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailValidation.email,
      password,
    });
    
    if (error) {
      // Log failed login
      await logAuthEvent('login_failed', undefined, {
        email: emailValidation.email,
        ip: clientIP,
        reason: error.message,
      });
      
      // Return generic error to prevent email enumeration
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Log successful login
    await logAuthEvent('login_success', data.user.id, {
      ip: clientIP,
      method: 'password',
    });
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
