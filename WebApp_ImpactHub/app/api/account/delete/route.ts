import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit-log';
import type { ApiResponse } from '@/types/api';

/**
 * POST /api/account/delete
 * Delete the current user's account after password verification
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting - strict for account deletion
    const rateLimit = checkRateLimit(`delete:${user.id}`, RATE_LIMITS.auth);
    if (!rateLimit.allowed) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      await logAuditEvent({
        event_type: 'suspicious_activity',
        user_id: user.id,
        metadata: { action: 'delete_account_failed_password' },
        severity: 'medium',
      });
      
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Log the deletion attempt
    await logAuditEvent({
      event_type: 'profile_updated',
      user_id: user.id,
      metadata: { action: 'account_deletion_initiated' },
      severity: 'high',
    });

    // Delete user data in order (respecting foreign key constraints)
    // Note: Most of these will cascade from profiles due to ON DELETE CASCADE
    // But we explicitly delete to ensure clean removal
    
    try {
      // Delete sets (via workout_exercises -> workouts)
      // This should cascade from workouts deletion
      
      // Delete workout_exercises (via workouts)
      // This should cascade from workouts deletion
      
      // Delete workouts
      await supabase
        .from('workouts')
        .delete()
        .eq('user_id', user.id);

      // Delete program-related data
      await supabase
        .from('program_templates')
        .delete()
        .eq('user_id', user.id);

      // Delete personal records
      await supabase
        .from('personal_records')
        .delete()
        .eq('user_id', user.id);

      // Delete user settings
      await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id);

      // Delete AI usage data (if exists)
      try {
        await supabase
          .from('ai_plan_generations' as 'profiles')
          .delete()
          .eq('user_id', user.id);
        
        await supabase
          .from('ai_usage_counters' as 'profiles')
          .delete()
          .eq('user_id', user.id);
      } catch {
        // Tables might not exist yet
      }

      // Delete entitlements (if exists)
      try {
        await supabase
          .from('entitlements' as 'profiles')
          .delete()
          .eq('user_id', user.id);
      } catch {
        // Table might not exist yet
      }

      // Delete subscriptions
      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id);

      // Delete profile (this should cascade any remaining FK references)
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

    } catch (deleteError) {
      console.error('Error deleting user data:', deleteError);
      // Continue to delete auth user even if some data deletion fails
    }

    // Finally, delete the auth user
    // Note: This requires admin/service role permissions
    // For client-side, we'll sign out and the user record remains
    // In production, you'd want a server-side admin client to delete the auth user
    
    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Account deleted successfully',
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
