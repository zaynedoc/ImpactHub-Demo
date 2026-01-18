import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { logAuthEvent } from '@/lib/audit-log';
import { getClientIPFromRequest } from '@/lib/security';

// Allowed redirect paths to prevent open redirect vulnerabilities
const ALLOWED_REDIRECT_PATHS = [
  '/dashboard',
  '/auth/reset-password',
  '/auth/profile-setup',
  '/settings',
];

function isAllowedRedirect(path: string): boolean {
  // Only allow paths that start with our allowed paths
  return ALLOWED_REDIRECT_PATHS.some(allowed => 
    path === allowed || path.startsWith(allowed + '/')
  );
}

function sanitizeRedirectPath(path: string): string {
  // Remove any protocol or domain attempts
  const sanitized = path.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/]+/, '');
  
  // Ensure path starts with /
  if (!sanitized.startsWith('/')) {
    return '/dashboard';
  }
  
  // Check against allowed paths
  if (!isAllowedRedirect(sanitized)) {
    return '/dashboard';
  }
  
  return sanitized;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';
  
  // Sanitize the redirect path to prevent open redirect attacks
  const safeNext = sanitizeRedirectPath(next);
  
  const supabase = await createClient();
  const clientIP = getClientIPFromRequest(request);

  // Handle email verification with token_hash (from email links)
  if (token_hash && type) {
    // Validate type parameter to prevent injection
    const allowedTypes = ['signup', 'recovery', 'email'];
    if (!allowedTypes.includes(type)) {
      console.warn(`Invalid OTP type attempted: ${type} from IP: ${clientIP}`);
      return NextResponse.redirect(`${origin}/auth/error?message=Invalid verification type`);
    }
    
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'email',
    });

    if (!error && data.user) {
      // Log successful verification
      await logAuthEvent(
        type === 'signup' ? 'signup' : 'password_reset_request',
        data.user.id,
        { method: 'email_verification', ip: clientIP }
      );
      
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      // Email verified - redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }
    
    // Log failed verification attempt
    console.warn(`Failed OTP verification from IP: ${clientIP}`);
  }

  // Handle OAuth/magic link with code
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Log successful authentication
      await logAuthEvent('login_success', data.user.id, { 
        method: 'oauth_code_exchange', 
        ip: clientIP 
      });
      
      // Check if this is a password recovery flow
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      
      // Successful authentication - redirect to sanitized next page
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    
    // Log failed authentication attempt
    console.warn(`Failed code exchange from IP: ${clientIP}`);
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error?message=Could not authenticate user`);
}
