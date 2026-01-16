import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Debug: log whether env vars are set (only in browser)
  if (typeof window !== 'undefined') {
    console.log('[Supabase Client] URL set:', !!supabaseUrl);
    console.log('[Supabase Client] Key set:', !!supabaseAnonKey);
  }

  // Return a dummy client during build time if env vars are not set
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase Client] Missing env vars, using placeholder');
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}
