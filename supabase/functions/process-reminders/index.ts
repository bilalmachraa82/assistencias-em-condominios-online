
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const results = {
      sameDayReminders: 0,
      nextDayReminders: 0,
      errors: [] as string[]
    };
    
    // Processar lembretes do mesmo dia (dia da intervenção)
    const { data: sameDayAssistances, error: sameDayError } = await supabase
      .from('assistances')
      .select('id, status, scheduled_datetime, validation_token, suppliers(email, name)')
      .eq('status', 'Agendado')
      .gte('scheduled_datetime', today.toISOString())
      .lt('scheduled_datetime', tomorrow.toISOString());
    
    if (sameDayError) {
      results.errors.push(`Erro ao buscar assistências do mesmo dia: ${sameDayError.message}`);
    } else if (sameDayAssistances && sameDayAssistances.length > 0) {
      // Enviar emails de lembrete para as assistências do dia atual
      for (const assistance of sameDayAssistances) {
        try {
          const response = await fetch(
            'https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/send-supplier-email',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                assistanceId: assistance.id,
                emailType: 'validation',
                isReminder: true
              })
            }
          );
          
          if (response.ok) {
            results.sameDayReminders++;
          } else {
            const error = await response.json();
            results.errors.push(`Erro ao enviar email para assistência ${assistance.id}: ${error.error || 'Erro desconhecido'}`);
          }
        } catch (e) {
          results.errors.push(`Exceção ao processar assistência ${assistance.id}: ${e.message}`);
        }
      }
    }
    
    // Processar lembretes do dia seguinte (dia após a intervenção)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: nextDayAssistances, error: nextDayError } = await supabase
      .from('assistances')
      .select('id, status, scheduled_datetime, validation_token, suppliers(email, name)')
      .eq('status', 'Agendado')
      .gte('scheduled_datetime', yesterday.toISOString())
      .lt('scheduled_datetime', today.toISOString());
    
    if (nextDayError) {
      results.errors.push(`Erro ao buscar assistências do dia seguinte: ${nextDayError.message}`);
    } else if (nextDayAssistances && nextDayAssistances.length > 0) {
      // Enviar emails de lembrete para as assistências do dia seguinte
      for (const assistance of nextDayAssistances) {
        try {
          const response = await fetch(
            'https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/send-supplier-email',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                assistanceId: assistance.id,
                emailType: 'validation',
                isReminder: true,
                isNextDay: true
              })
            }
          );
          
          if (response.ok) {
            results.nextDayReminders++;
            
            // Atualizar o contador de lembretes
            await supabase
              .from('assistances')
              .update({
                validation_reminder_count: assistance.validation_reminder_count + 1 || 1,
                validation_email_sent_at: new Date().toISOString()
              })
              .eq('id', assistance.id);
          } else {
            const error = await response.json();
            results.errors.push(`Erro ao enviar email para assistência ${assistance.id}: ${error.error || 'Erro desconhecido'}`);
          }
        } catch (e) {
          results.errors.push(`Exceção ao processar assistência ${assistance.id}: ${e.message}`);
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processamento concluído. ${results.sameDayReminders} lembretes do dia e ${results.nextDayReminders} lembretes do dia seguinte enviados.`,
        results
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro:', error.message);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
