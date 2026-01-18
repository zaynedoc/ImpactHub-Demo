/**
 * Audit logging utilities for security events
 * Logs important events to the database for security monitoring
 */

import { createClient } from '@/lib/supabase/server';
import { getClientIPFromHeaders } from '@/lib/security';
import type { Json } from '@/types/database';

// Audit event types
export type AuditEventType = 
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'signup'
  | 'password_reset_request'
  | 'password_changed'
  | 'profile_updated'
  | 'workout_created'
  | 'workout_deleted'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'payment_success'
  | 'payment_failed'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'api_key_created'
  | 'api_key_deleted';

export interface AuditLogEntry {
  event_type: AuditEventType;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Log an audit event to the database
 * Falls back to console logging if database is unavailable
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const clientIP = await getClientIPFromHeaders();
    
    
    const logEntry = {
      event_type: entry.event_type,
      user_id: entry.user_id || null,
      ip_address: entry.ip_address || clientIP,
      user_agent: entry.user_agent || null,
      metadata: entry.metadata || {},
      severity: entry.severity || 'low',
      created_at: new Date().toISOString(),
    };
    
    // Try to log to database
    try {
      const supabase = await createClient();
      
      // Note: RLS policy requires auth context; using rpc or direct insert
      // The 'as any' is needed because RLS policies can affect type inference
      const { error } = await (supabase
        .from('audit_logs') as ReturnType<typeof supabase.from>)
        .insert({
          event_type: logEntry.event_type as string,
          user_id: logEntry.user_id,
          ip_address: logEntry.ip_address,
          user_agent: logEntry.user_agent,
          event_data: logEntry.metadata as Json,
        });
      
      if (error) {
        // Fallback to console logging
        console.warn('[AUDIT] Database logging failed:', error.message);
        console.log('[AUDIT]', JSON.stringify(logEntry));
      }
    } catch {
      // Fallback to console logging
      console.log('[AUDIT]', JSON.stringify(logEntry));
    }
    
    // For high severity events, also log to console for immediate visibility
    if (entry.severity === 'high' || entry.severity === 'critical') {
      console.warn(`[AUDIT ${entry.severity.toUpperCase()}]`, JSON.stringify(logEntry));
    }
  } catch (error) {
    // Never throw from audit logging - just log to console
    console.error('[AUDIT ERROR]', error);
  }
}




/**
 * Helper to log authentication events
 */
export async function logAuthEvent(
  eventType: 'login_success' | 'login_failed' | 'logout' | 'signup' | 'password_reset_request' | 'password_changed',
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const severityMap: Record<string, AuditLogEntry['severity']> = {
    login_failed: 'medium',
    password_reset_request: 'medium',
    password_changed: 'high',
    login_success: 'low',
    logout: 'low',
    signup: 'low',
  };
  
  await logAuditEvent({
    event_type: eventType,
    user_id: userId,
    metadata,
    severity: severityMap[eventType] || 'low',
  });
}

/**
 * Helper to log security-related events
 */
export async function logSecurityEvent(
  eventType: 'rate_limit_exceeded' | 'suspicious_activity',
  details: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    event_type: eventType,
    metadata: details,
    severity: eventType === 'suspicious_activity' ? 'high' : 'medium',
  });
}

/**
 * Helper to log payment events
 */
export async function logPaymentEvent(
  eventType: 'payment_success' | 'payment_failed' | 'subscription_created' | 'subscription_cancelled',
  userId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const severityMap: Record<string, AuditLogEntry['severity']> = {
    payment_failed: 'medium',
    subscription_cancelled: 'medium',
    payment_success: 'low',
    subscription_created: 'low',
  };
  
  await logAuditEvent({
    event_type: eventType,
    user_id: userId,
    metadata,
    severity: severityMap[eventType] || 'low',
  });
}

/**
 * Get recent audit logs for a user (admin or self-view)
 */
export async function getRecentAuditLogs(
  userId: string,
  limit: number = 50
): Promise<Array<{
  event_type: string;
  ip_address: string | null;
  event_data: Record<string, unknown> | null;
  created_at: string;
}> | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('audit_logs')
      .select('event_type, ip_address, event_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching audit logs:', error);
      return null;
    }
    
    return data as Array<{
      event_type: string;
      ip_address: string | null;
      event_data: Record<string, unknown> | null;
      created_at: string;
    }>;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return null;
  }
}
