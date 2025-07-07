import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { handleError } from './error-handling.ts';
import { auditSecurityEvent } from './audit.ts';

export async function fetchAssistanceData(
  supabase: SupabaseClient,
  assistanceId: number,
  clientIP: string,
  userAgent: string
) {
  const { data: assistance, error: assistanceError } = await supabase
    .from('assistances')
    .select(`
      id, 
      description, 
      status, 
      type, 
      buildings!inner(id, name, address), 
      suppliers!inner(id, name, email, phone), 
      intervention_types!inner(id, name)
    `)
    .eq('id', assistanceId)
    .single();

  if (assistanceError || !assistance) {
    console.error('Error fetching assistance details:', assistanceError);
    
    await auditSecurityEvent(
      supabase,
      'ASSISTANCE_DATA_FETCH_FAILED',
      'assistances',
      assistanceId,
      clientIP,
      userAgent,
      { error: assistanceError?.message }
    );
    
    throw new Error('Erro ao carregar dados da assistência');
  }

  return assistance;
}