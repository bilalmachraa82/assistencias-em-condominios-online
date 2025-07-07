import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export async function auditSecurityEvent(
  supabase: SupabaseClient,
  eventType: string,
  resourceType: string,
  resourceId: number,
  clientIP: string,
  userAgent: string,
  details: any
) {
  await supabase.rpc('audit_security_event', {
    event_type: eventType,
    resource_type: resourceType,
    resource_id: resourceId,
    client_ip: clientIP,
    user_agent: userAgent,
    details
  });
}