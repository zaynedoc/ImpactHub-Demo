import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();

  // Handle email verification with token_hash (from email links)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'email',
    });

    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      // Email verified - redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Handle OAuth/magic link with code
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if this is a password recovery flow
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      
      // Successful authentication - redirect to next page
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error?message=Could not authenticate user`);
}
