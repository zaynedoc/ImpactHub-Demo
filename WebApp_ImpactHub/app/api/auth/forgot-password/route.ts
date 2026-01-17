import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { validateEmail } from '@/lib/validation';
import { getClientIPFromRequest } from '@/lib/security';
import { logAuthEvent, logSecurityEvent } from '@/lib/audit-log';
import type { ApiResponse } from '@/types/api';

interface ForgotPasswordRequest {
  email: string;
}

/**
 * POST /api/auth/forgot-password
 * Server-side password reset request with rate limiting
 * Always returns success to prevent email enumeration
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIPFromRequest(request);
    
    // Strict rate limiting for password resets (3 per hour per IP)
    const rateLimit = checkRateLimit(`auth:reset:${clientIP}`, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
    });
    
    if (!rateLimit.allowed) {
      await logSecurityEvent('rate_limit_exceeded', {
        endpoint: '/api/auth/forgot-password',
        ip: clientIP,
      });
      
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many password reset requests. Please try again later.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }
    
    // Parse and validate request body
    let body: ForgotPasswordRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { email } = body;
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: emailValidation.error },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get the site URL from environment or request
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    
    const { error } = await supabase.auth.resetPasswordForEmail(emailValidation.email, {
      redirectTo: `${siteUrl}/auth/callback?type=recovery`,
    });
    
    // Log the password reset request
    await logAuthEvent('password_reset_request', undefined, {
      email: emailValidation.email,
      ip: clientIP,
      success: !error,
    });
    
    if (error) {
      console.error(`Password reset error for ${emailValidation.email}:`, error.message);
    }
    
    // Always return success to prevent email enumeration attacks
    // Even if the email doesn't exist or there's an error, don't reveal that
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password API error:', error);
    // Even on server error, return a generic success to prevent information leakage
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  }
}
